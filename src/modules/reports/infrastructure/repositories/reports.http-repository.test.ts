import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/lib/apiClient', () => ({ apiClient: api }));

const { ReportsHttpRepository } = await import('./reports.http-repository');
const repository = new ReportsHttpRepository();

beforeEach(() => api.get.mockReset());

describe('ReportsHttpRepository', () => {
  it('los informes por rango envían las fechas y la sucursal solo si hay una', async () => {
    api.get.mockResolvedValue([]);
    await repository.salesCost('2026-11-01', '2026-11-30', 'b1');
    await repository.productSales('2026-11-01', '2026-11-30');
    expect(api.get.mock.calls.map(([path]) => path)).toEqual([
      '/reports/sales-cost?startDate=2026-11-01&endDate=2026-11-30&branchId=b1',
      '/reports/product-sales?startDate=2026-11-01&endDate=2026-11-30',
    ]);
  });

  it('existencias valuadas: paginación y sucursal opcionales; devuelve también los totales', async () => {
    api.get.mockResolvedValue({ data: [], meta: { total: 0, page: 2, limit: 5, totalPages: 1, totalValue: 10 } });
    const page = await repository.valuedInventory({ page: 2, limit: 5, branchId: 'b1' });
    expect(api.get).toHaveBeenCalledWith('/reports/valued-inventory?page=2&limit=5&branchId=b1');
    expect(page.meta.totalValue).toBe(10);
    await repository.valuedInventory();
    expect(api.get).toHaveBeenLastCalledWith('/reports/valued-inventory');
  });
});
