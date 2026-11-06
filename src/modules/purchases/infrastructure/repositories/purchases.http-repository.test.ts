import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() }));
vi.mock('@/lib/apiClient', () => ({ apiClient: api }));

const { PurchasesHttpRepository } = await import('./purchases.http-repository');
const { SuppliersHttpRepository } = await import('./suppliers.http-repository');

beforeEach(() => Object.values(api).forEach((fn) => fn.mockReset()));

const purchaseDto = {
  id: 'p1',
  invoiceNumber: undefined,
  createdAt: '2026-01-02T10:00:00Z',
  status: 'COMPLETED',
  totalAmount: '30.10',
  isCancellable: true,
  supplier: null,
  branch: { id: 'b1', name: 'Matriz' },
  items: [{ id: 'i1', quantity: 3, purchasePrice: '10.03', variant: { id: 'v1', sku: 'AB-1', product: { name: 'Playera' } } }],
};

describe('repositorio de compras', () => {
  it('lista con filtros en la URL y entidades sin textos de pantalla', async () => {
    api.get.mockResolvedValue({ data: [purchaseDto], meta: { total: 1, page: 2, limit: 10, totalPages: 1 } });
    const page = await new PurchasesHttpRepository().list({ branchId: 'b1', supplierId: 's1', page: 2, limit: 10 });
    expect(api.get).toHaveBeenCalledWith('/purchases?branchId=b1&supplierId=s1&page=2&limit=10');
    expect(page.meta.page).toBe(2);
    const [purchase] = page.data;
    expect(purchase).toMatchObject({ totalAmount: 30.1, totalUnits: 3, branchName: 'Matriz', supplierName: '', invoiceNumber: '' });
    expect(purchase?.items[0]).toMatchObject({ sku: 'AB-1', productName: 'Playera', unitCost: 10.03, subtotal: 30.09 });
    expect(Object.keys(purchase ?? {}).some((key) => /formatted|label/i.test(key))).toBe(false);
  });

  it('sin filtros no añade query string', async () => {
    api.get.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 1 } });
    await new PurchasesHttpRepository().list();
    expect(api.get).toHaveBeenCalledWith('/purchases');
  });

  it('registrar, anular, validar e importar usan las rutas del backend', async () => {
    api.post.mockResolvedValue(purchaseDto);
    api.patch.mockResolvedValue(undefined);
    const repository = new PurchasesHttpRepository();
    await repository.register({ branchId: 'b1', items: [] });
    await repository.cancel('p1');
    await repository.validateImport([{ sku: 'A', quantity: 1 }]);
    await repository.import({ branchId: 'b1', items: [] });
    expect(api.post.mock.calls.map(([path]) => path)).toEqual(['/purchases', '/purchases/validate-import', '/purchases/import']);
    expect(api.patch).toHaveBeenCalledWith('/purchases/p1/cancel', {});
  });
});

describe('repositorio de proveedores', () => {
  it('lista, crea, edita y borra', async () => {
    const dto = { id: 's1', identityNumber: '1', name: 'Acme', email: '', phone: '', address: '' };
    api.get.mockResolvedValue([dto]);
    api.post.mockResolvedValue(dto);
    api.put.mockResolvedValue(dto);
    const repository = new SuppliersHttpRepository();
    expect(await repository.list()).toEqual([dto]);
    await repository.create({ identityNumber: '1', name: 'Acme' });
    await repository.update('s1', { name: 'B' });
    await repository.remove('s1');
    expect(api.put).toHaveBeenCalledWith('/purchases/suppliers/s1', { name: 'B' });
    expect(api.delete).toHaveBeenCalledWith('/purchases/suppliers/s1');
  });
});
