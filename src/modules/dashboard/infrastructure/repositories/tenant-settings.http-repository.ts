import { apiClient } from '@/lib/apiClient';
import type { TenantSettingsRepository, UpdateTenantSettingsInput } from '../../application/ports/tenant-settings.repository';
import type { TenantMetadata, TenantSettings } from '../../domain/entities/tenant-settings.entity';

/** Configuración del negocio por HTTP. */
export class TenantSettingsHttpRepository implements TenantSettingsRepository {
  metadata(): Promise<TenantMetadata> {
    return apiClient.get<TenantMetadata>('/tenants/metadata');
  }

  current(): Promise<TenantSettings> {
    return apiClient.get<TenantSettings>('/tenants/current');
  }

  update(input: UpdateTenantSettingsInput): Promise<TenantSettings> {
    return apiClient.put<TenantSettings>('/tenants/current', input);
  }
}
