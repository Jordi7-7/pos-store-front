import { describe, expect, it, vi } from 'vitest';
import type { TenantSettings } from '../../domain/entities/tenant-settings.entity';
import type { TenantSettingsRepository } from '../ports/tenant-settings.repository';
import { SaveTenantSettings } from './save-tenant-settings';

describe('SaveTenantSettings', () => {
  const setup = () => {
    const update = vi.fn<TenantSettingsRepository['update']>(async () => ({ id: 't' }) as TenantSettings);
    return { update, useCase: new SaveTenantSettings({ update }) };
  };
  const command = { name: 'Mi tienda', slug: '  Mi-Tienda ', logoUrl: '  ', country: 'MX', currencyCode: 'MXN', timezone: 'America/Mexico_City' };

  it('normaliza el identificador (minúsculas, sin espacios) y no envía un logo vacío', async () => {
    const { update, useCase } = setup();
    await useCase.execute(command);
    expect(update).toHaveBeenCalledWith({ name: 'Mi tienda', slug: 'mi-tienda', logoUrl: undefined, country: 'MX', currencyCode: 'MXN', timezone: 'America/Mexico_City' });
  });

  it('conserva el logo escrito (recortado)', async () => {
    const { update, useCase } = setup();
    await useCase.execute({ ...command, logoUrl: ' https://cdn/logo.png ' });
    expect(update.mock.calls[0]?.[0].logoUrl).toBe('https://cdn/logo.png');
  });
});
