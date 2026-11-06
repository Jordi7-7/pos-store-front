import type { TenantSettingsRepository } from '../ports/tenant-settings.repository';
import type { TenantSettings } from '../../domain/entities/tenant-settings.entity';

export interface SaveTenantSettingsCommand {
  name: string;
  slug: string;
  logoUrl: string;
  country: string;
  currencyCode: string;
  timezone: string;
}

/** Guarda la configuración del negocio normalizando lo escrito: el identificador va en minúsculas y sin espacios, y un logo vacío no se envía. */
export class SaveTenantSettings {
  constructor(private readonly repository: Pick<TenantSettingsRepository, 'update'>) {}

  execute(command: SaveTenantSettingsCommand): Promise<TenantSettings> {
    return this.repository.update({
      name: command.name,
      slug: command.slug.trim().toLowerCase(),
      logoUrl: command.logoUrl.trim() || undefined,
      country: command.country,
      currencyCode: command.currencyCode,
      timezone: command.timezone,
    });
  }
}
