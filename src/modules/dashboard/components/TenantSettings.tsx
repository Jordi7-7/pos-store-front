import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Globe, DollarSign, Clock, Building, Save, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
  ComboboxItem,
} from '@/components/ui/combobox';

interface Country {
  code: string;
  name: string;
}

interface Currency {
  code: string;
  name: string;
  symbol: string;
}

interface Timezone {
  name: string;
  utcOffsetStr: string;
  countries: string[];
}

interface MetadataResponse {
  countries: Country[];
  currencies: Currency[];
  timezones: Timezone[];
}

interface Tenant {
  id: string;
  name: string;
  ruc: string;
  country: string;
  currencyCode: string;
  currencySymbol: string;
  timezone: string;
}

export const TenantSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [metadata, setMetadata] = useState<MetadataResponse | null>(null);
  
  const [name, setName] = useState('');
  const [ruc, setRuc] = useState('');
  const [country, setCountry] = useState('');
  const [currencyCode, setCurrencyCode] = useState('');
  const [timezone, setTimezone] = useState('');

  // Fetch initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [metaRes, tenantRes] = await Promise.all([
          apiClient.request<MetadataResponse>('/tenants/metadata'),
          apiClient.request<Tenant>('/tenants/current'),
        ]);

        setMetadata(metaRes);
        setName(tenantRes.name);
        setRuc(tenantRes.ruc);
        setCountry(tenantRes.country);
        setCurrencyCode(tenantRes.currencyCode);
        setTimezone(tenantRes.timezone);
      } catch (error) {
        console.error('Error loading tenant settings:', error);
        toast.error('Error al cargar la configuración del negocio');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter timezones dynamically by selected country
  const filteredTimezones = metadata?.timezones.filter((tz) => 
    !country || tz.countries.includes(country)
  ) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await apiClient.request<Tenant>('/tenants/current', {
        method: 'PUT',
        body: JSON.stringify({
          name,
          country,
          currencyCode,
          timezone,
        }),
      });
      toast.success('Configuración del negocio actualizada con éxito');
    } catch (error) {
      console.error('Error updating tenant:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm text-neutral font-medium">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <Card className="border border-border-card shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-secondary">Configuración del Negocio</CardTitle>
          <CardDescription className="text-xs text-neutral">
            Administra la información de tu empresa, zona horaria y moneda.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Business Name */}
              <Field>
                <FieldLabel className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-primary" /> Nombre del Negocio
                </FieldLabel>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Mi Tienda"
                  className="text-xs h-9"
                />
              </Field>

              {/* RUC (Read Only) */}
              <Field>
                <FieldLabel className="text-[11px] font-bold uppercase tracking-wider">
                  RUC / Identificación Fiscal
                </FieldLabel>
                <Input
                  disabled
                  value={ruc}
                  className="text-xs h-9 cursor-not-allowed bg-bg-dark/50"
                />
              </Field>

              {/* Country Select (Combobox) */}
              <Field>
                <FieldLabel className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-primary" /> País
                </FieldLabel>
                <div className="w-full">
                  <Combobox 
                    value={country} 
                    onValueChange={(val) => {
                      setCountry(val ?? '');
                      setTimezone('');
                    }}
                    items={metadata?.countries || []}
                  >
                    <ComboboxInput
                      placeholder="Seleccionar país..."
                      className="text-xs h-9 w-full bg-bg-dark border border-border-card rounded-xl px-4 py-3 text-xs text-secondary font-medium"
                    />
                    <ComboboxContent className="bg-popover border border-border rounded-xl shadow-2xl z-30 w-72 max-h-60 overflow-y-auto">
                      <ComboboxEmpty className="p-3 text-center text-xs text-neutral">
                        No se encontraron países.
                      </ComboboxEmpty>
                      <ComboboxList className="p-1">
                        {(c: Country) => (
                          <ComboboxItem 
                            key={c.code} 
                            value={c.code}
                            className="px-3 py-2 hover:bg-accent hover:text-accent-foreground text-xs text-secondary rounded-lg transition-colors cursor-pointer"
                          >
                            {c.name} ({c.code})
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </div>
              </Field>

              {/* Currency Select (Combobox) */}
              <Field>
                <FieldLabel className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-primary" /> Moneda del Sistema
                </FieldLabel>
                <div className="w-full">
                  <Combobox 
                    value={currencyCode} 
                    onValueChange={(val) => setCurrencyCode(val ?? '')}
                    items={metadata?.currencies || []}
                  >
                    <ComboboxInput
                      placeholder="Seleccionar moneda..."
                      className="text-xs h-9 w-full bg-bg-dark border border-border-card rounded-xl px-4 py-3 text-xs text-secondary font-medium"
                    />
                    <ComboboxContent className="bg-popover border border-border rounded-xl shadow-2xl z-30 w-72 max-h-60 overflow-y-auto">
                      <ComboboxEmpty className="p-3 text-center text-xs text-neutral">
                        No se encontraron monedas.
                      </ComboboxEmpty>
                      <ComboboxList className="p-1">
                        {(curr: Currency) => (
                          <ComboboxItem 
                            key={curr.code} 
                            value={curr.code}
                            className="px-3 py-2 hover:bg-accent hover:text-accent-foreground text-xs text-secondary rounded-lg transition-colors cursor-pointer"
                          >
                            {curr.name} ({curr.code} - {curr.symbol})
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </div>
              </Field>

              {/* Timezone Select (Combobox) */}
              <Field className="md:col-span-2">
                <FieldLabel className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" /> Zona Horaria
                </FieldLabel>
                <div className="w-full">
                  <Combobox 
                    value={timezone} 
                    onValueChange={(val) => setTimezone(val ?? '')}
                    items={filteredTimezones}
                    disabled={!country}
                  >
                    <ComboboxInput
                      placeholder={country ? "Seleccionar zona horaria..." : "Primero selecciona un país"}
                      className="text-xs h-9 w-full bg-bg-dark border border-border-card rounded-xl px-4 py-3 text-xs text-secondary font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <ComboboxContent className="bg-popover border border-border rounded-xl shadow-2xl z-30 w-72 max-h-60 overflow-y-auto">
                      <ComboboxEmpty className="p-3 text-center text-xs text-neutral">
                        No se encontraron zonas horarias.
                      </ComboboxEmpty>
                      <ComboboxList className="p-1">
                        {(tz: Timezone) => (
                          <ComboboxItem 
                            key={tz.name} 
                            value={tz.name}
                            className="px-3 py-2 hover:bg-accent hover:text-accent-foreground text-xs text-secondary rounded-lg transition-colors cursor-pointer"
                          >
                            {tz.name} ({tz.utcOffsetStr})
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </div>
                {filteredTimezones.length === 0 && country && (
                  <p className="text-[10px] text-amber-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" /> No se encontraron zonas específicas para este país.
                  </p>
                )}
              </Field>

            </div>

            {/* Action Footer */}
            <div className="pt-4 border-t border-border-card/50 flex justify-end">
              <Button
                type="submit"
                disabled={saving}
                size="sm"
                className="h-9 px-5 text-xs font-semibold gap-1.5"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Guardar Configuración
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantSettings;
