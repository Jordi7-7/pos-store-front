import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Globe, DollarSign, Clock, Building, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

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
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-neutral font-medium">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/5 to-bg-card border border-primary/10 flex items-center justify-between shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-secondary mb-1">Configuración del Negocio</h2>
          <p className="text-xs text-neutral">Administra la información de tu empresa, zona horaria y moneda.</p>
        </div>
      </div>

      <div className="bg-bg-card border border-border-card rounded-2xl p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Business Name */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-primary" /> Nombre del Negocio
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-bg-dark border border-border-card rounded-xl px-4 py-3 text-xs text-secondary font-medium focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-150"
                placeholder="Mi Tienda"
              />
            </div>

            {/* RUC (Read Only) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral uppercase tracking-wider flex items-center gap-1.5">
                RUC / Identificación Fiscal
              </label>
              <input
                type="text"
                disabled
                value={ruc}
                className="w-full bg-bg-dark/50 border border-border-card/50 rounded-xl px-4 py-3 text-xs text-neutral font-medium cursor-not-allowed opacity-80"
              />
              <p className="text-[10px] text-neutral italic">El RUC no puede modificarse una vez registrado.</p>
            </div>

            {/* Country Select */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-primary" /> País
              </label>
              <select
                required
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  // Reset timezone if it's not applicable to the new country
                  setTimezone('');
                }}
                className="w-full bg-bg-dark border border-border-card rounded-xl px-4 py-3 text-xs text-secondary font-medium focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-150"
              >
                <option value="">Selecciona un país</option>
                {metadata?.countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Currency Select */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-primary" /> Moneda del Sistema
              </label>
              <select
                required
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
                className="w-full bg-bg-dark border border-border-card rounded-xl px-4 py-3 text-xs text-secondary font-medium focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-150"
              >
                <option value="">Selecciona una moneda</option>
                {metadata?.currencies.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.name} ({curr.code} - {curr.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Timezone Select */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-neutral uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" /> Zona Horaria
              </label>
              <select
                required
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-bg-dark border border-border-card rounded-xl px-4 py-3 text-xs text-secondary font-medium focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-150"
              >
                <option value="">
                  {country ? 'Selecciona una zona horaria' : 'Primero selecciona un país'}
                </option>
                {filteredTimezones.map((tz) => (
                  <option key={tz.name} value={tz.name}>
                    {tz.name} ({tz.utcOffsetStr})
                  </option>
                ))}
              </select>
              {filteredTimezones.length === 0 && country && (
                <p className="text-[10px] text-amber-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> No se encontraron zonas específicas para este país, mostrando todas.
                </p>
              )}
            </div>

          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-border-card flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 py-3 px-6 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl shadow-md shadow-primary/10 transition-all duration-150 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar Configuración
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantSettings;
