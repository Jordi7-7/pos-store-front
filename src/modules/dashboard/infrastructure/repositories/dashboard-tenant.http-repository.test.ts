import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }));
vi.mock('@/lib/apiClient', () => ({ apiClient: api }));

const { DashboardHttpRepository } = await import('./dashboard.http-repository');
const { TenantSettingsHttpRepository } = await import('./tenant-settings.http-repository');

beforeEach(() => Object.values(api).forEach((fn) => fn.mockReset()));

describe('repositorios del panel y de la configuración del negocio', () => {
  it('métricas: con o sin sucursal', async () => {
    api.get.mockResolvedValue({});
    const repository = new DashboardHttpRepository();
    await repository.metrics('b1');
    await repository.metrics();
    expect(api.get.mock.calls.map(([path]) => path)).toEqual(['/dashboard/metrics?branchId=b1', '/dashboard/metrics']);
  });

  it('configuración: opciones, datos actuales y actualización por PUT', async () => {
    api.get.mockResolvedValue({});
    api.put.mockResolvedValue({ id: 't' });
    const repository = new TenantSettingsHttpRepository();
    await repository.metadata();
    await repository.current();
    await repository.update({ name: 'x', slug: 'x', country: 'MX', currencyCode: 'MXN', timezone: 'America/Mexico_City' });
    expect(api.get.mock.calls.map(([path]) => path)).toEqual(['/tenants/metadata', '/tenants/current']);
    expect(api.put).toHaveBeenCalledWith('/tenants/current', expect.objectContaining({ slug: 'x' }));
  });
});
