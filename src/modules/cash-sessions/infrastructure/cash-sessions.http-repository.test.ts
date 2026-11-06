import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('@/lib/apiClient', () => ({ apiClient: api }));

const { CashSessionsHttpRepository } = await import('./cash-sessions.http-repository');

const repository = new CashSessionsHttpRepository();
beforeEach(() => {
  api.get.mockReset();
  api.post.mockReset();
});

describe('CashSessionsHttpRepository', () => {
  it('sin turno abierto, el turno activo es null (el servidor responde vacío)', async () => {
    api.get.mockResolvedValueOnce('');
    expect(await repository.getActive('b1')).toBeNull();
    expect(api.get).toHaveBeenCalledWith('/sales/cash-sessions/active?branchId=b1');
  });

  it('con turno abierto devuelve la entidad', async () => {
    api.get.mockResolvedValueOnce({ id: 'a', status: 'OPEN', branchId: 'b1', cashRegisterId: 'c1', cashRegisterName: 'Caja 1', openingBalance: 100, openedAt: 'x', openedByName: 'Ana' });
    expect(await repository.getActive('b1', 'c1')).toMatchObject({ id: 'a', cashRegisterName: 'Caja 1', openingBalance: 100 });
  });

  it('abrir devuelve la entidad aunque el servidor responda anidado', async () => {
    api.post.mockResolvedValueOnce({ id: 'a', status: 'OPEN', branch: { id: 'b1' }, cashRegister: { id: 'c1', name: 'Caja 1' }, openingBalance: 100, openedAt: 'x', user: { name: 'Ana' } });
    expect(await repository.open({ branchId: 'b1', cashRegisterId: 'c1', openingBalance: 100 })).toMatchObject({ branchId: 'b1', cashRegisterName: 'Caja 1', openedByName: 'Ana' });
    expect(api.post).toHaveBeenCalledWith('/sales/cash-sessions/open', { branchId: 'b1', cashRegisterId: 'c1', openingBalance: 100 });
  });

  it('cerrar y registrar gastos van a su endpoint', async () => {
    api.post.mockResolvedValue({});
    await repository.close('s1', 100);
    await repository.registerExpense({ branchId: 'b', description: 'x', amount: 1, category: 'c' });
    expect(api.post.mock.calls.map(([path]) => path)).toEqual(['/sales/cash-sessions/s1/close', '/sales/expenses']);
  });
});
