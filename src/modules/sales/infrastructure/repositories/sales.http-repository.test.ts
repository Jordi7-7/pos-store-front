import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('@/lib/apiClient', () => ({ apiClient: api }));

const { SalesHttpRepository } = await import('./sales.http-repository');

const repository = new SalesHttpRepository();
beforeEach(() => {
  api.get.mockReset();
  api.post.mockReset();
});

describe('SalesHttpRepository', () => {
  it('lista ventas con su filtro y devuelve entidades (no DTO)', async () => {
    api.get.mockResolvedValueOnce({
      data: [{ id: 's1', invoiceNumber: '001', createdAt: '2026-11-05T17:00:00Z', total: '310', discountAmount: 0, status: 'COMPLETED', customer: { name: 'Ana' }, branch: { name: 'Centro' } }],
      meta: { total: 1, page: 2, limit: 5, totalPages: 1 },
    });
    const page = await repository.list({ startDate: '2026-11-01', branchId: 'b1', page: 2, limit: 5 });

    expect(api.get).toHaveBeenCalledWith('/sales/paginated?startDate=2026-11-01&branchId=b1&page=2&limit=5');
    expect(page.items[0]).toMatchObject({ id: 's1', total: 310, customerName: 'Ana', branchName: 'Centro' });
    expect(page.items[0]).not.toHaveProperty('totalFormatted');
    expect(page.meta.page).toBe(2);
  });

  it('busca una venta por folio (codificado) y la convierte en entidad', async () => {
    api.get.mockResolvedValueOnce({ id: 's1', invoiceNumber: '001/002', createdAt: '2026-11-05T17:00:00Z', total: 10, subtotal: 10, discountAmount: 0, status: 'COMPLETED', items: [], payments: [], refunds: [] });
    const sale = await repository.getByInvoice('001/002');
    expect(api.get).toHaveBeenCalledWith('/sales/invoice/001%2F002');
    expect(sale.createdAt).toBeInstanceOf(Date);
  });

  it('cobrar y devolver van a su endpoint', async () => {
    api.post.mockResolvedValue({ id: 's1', invoiceNumber: '001' });
    await repository.processSale({ branchId: 'b', cashSessionId: 's', items: [], payments: [] });
    await repository.processRefund({ branchId: 'b', saleId: 's', cashSessionId: 'c', reason: 'r', items: [] });
    expect(api.post.mock.calls.map(([path]) => path)).toEqual(['/sales', '/sales/refunds']);
  });
});
