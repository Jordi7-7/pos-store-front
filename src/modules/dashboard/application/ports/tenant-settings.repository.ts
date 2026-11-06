import type { TenantMetadata, TenantSettings } from '../../domain/entities/tenant-settings.entity';

export interface UpdateTenantSettingsInput {
  name: string;
  slug: string;
  logoUrl?: string;
  country: string;
  currencyCode: string;
  timezone: string;
}

/** Puerto de salida: configuración del negocio en el servidor. */
export interface TenantSettingsRepository {
  metadata(): Promise<TenantMetadata>;
  current(): Promise<TenantSettings>;
  update(input: UpdateTenantSettingsInput): Promise<TenantSettings>;
}
