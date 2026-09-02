import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Globe, DollarSign, Clock, Building, Save, AlertCircle, Loader2, Link2, Image as ImageIcon, UploadCloud, Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { mediaService } from '@/modules/media/services/media.service';

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
  slug?: string;
  logoUrl?: string | null;
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
  const [slug, setSlug] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [ruc, setRuc] = useState('');
  const [country, setCountry] = useState('');
  const [currencyCode, setCurrencyCode] = useState('');
  const [timezone, setTimezone] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

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
        setSlug(tenantRes.slug || '');
        setLogoUrl(tenantRes.logoUrl || '');
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

  // Handle direct S3 bucket upload for logo
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('El tamaño de la imagen no debe superar los 5MB.');
      return;
    }

    try {
      setIsUploadingLogo(true);
      const { uploadUrl, fileUrl } = await mediaService.getPresignedUrl(file.name, file.type);
      await mediaService.uploadToR2(uploadUrl, file);
      setLogoUrl(fileUrl);
      toast.success('Logotipo subido al bucket exitosamente');
    } catch (err: any) {
      console.error('Error subiendo logo:', err);
      toast.error('Error al subir el logotipo al bucket');
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
    toast.info('Logotipo removido. Guarda la configuración para aplicar los cambios.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updated = await apiClient.request<Tenant>('/tenants/current', {
        method: 'PUT',
        body: JSON.stringify({
          name,
          slug: slug.trim().toLowerCase(),
          logoUrl: logoUrl.trim() || undefined,
          country,
          currencyCode,
          timezone,
        }),
      });
      useAuthStore.setState({ timezone });
      if (updated.slug) {
        useAuthStore.setState({ tenantSlug: updated.slug });
      }
      if (updated.logoUrl !== undefined) {
        const auth = useAuthStore.getState();
        if (auth.publicTenant) {
          useAuthStore.setState({
            publicTenant: {
              ...auth.publicTenant,
              logoUrl: updated.logoUrl,
              slug: updated.slug || auth.publicTenant.slug,
            },
          });
        }
      }
      toast.success('Configuración del negocio y logo actualizados con éxito');
    } catch (error: any) {
      console.error('Error updating tenant:', error);
      toast.error(error.message || 'Error al guardar la configuración');
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

              {/* Slug (URL Identifier) */}
              <Field className="md:col-span-2">
                <FieldLabel className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-primary" /> Identificador URL (Slug de la Tienda)
                </FieldLabel>
                <Input
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="ej. zapateria-gomez"
                  className="text-xs h-9 font-mono"
                />
                <p className="text-[10px] text-neutral mt-1">
                  Enlace directo de acceso: <span className="font-mono text-primary font-semibold">http://localhost:5173/{slug || 'mi-tienda'}</span>
                </p>
              </Field>

              {/* Logo Upload Section */}
              <div className="md:col-span-2 space-y-2">
                <FieldLabel className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-primary" /> Logotipo de la Empresa
                </FieldLabel>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                />

                {isUploadingLogo ? (
                  <div className="border border-dashed border-primary/50 bg-primary/5 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 transition-all">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-xs font-semibold text-secondary">Subiendo imagen al bucket...</span>
                    <span className="text-[10px] text-neutral">Generando URL pública segura</span>
                  </div>
                ) : logoUrl ? (
                  <div className="p-3 bg-bg-dark/60 rounded-2xl border border-border-card flex items-center justify-between gap-4">
                    <div className="w-16 h-16 rounded-xl bg-bg-card border border-border-card p-1.5 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                      <img
                        src={logoUrl}
                        alt="Logo del negocio"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-8 text-xs gap-1.5 cursor-pointer hover:border-primary"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Cambiar</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveLogo}
                        className="h-8 text-xs gap-1.5 text-rose-500 border-rose-500/20 hover:bg-rose-500/10 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border-card hover:border-primary/50 bg-bg-dark/40 hover:bg-primary/5 rounded-2xl p-6 flex flex-col items-center justify-center gap-2.5 transition-all cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-bg-card border border-border-card flex items-center justify-center text-neutral group-hover:text-primary group-hover:scale-105 transition-all shadow-sm">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-secondary group-hover:text-primary transition-colors">
                        Haz clic para subir el logo de tu empresa
                      </p>
                      <p className="text-[10px] text-neutral mt-0.5">
                        Formatos soportados: PNG, JPG, WEBP o SVG (Máx. 5MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>

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
