import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn() }));
vi.mock('@/lib/apiClient', () => ({ apiClient: api }));

const { BranchesHttpRepository } = await import('./branches.http-repository');
const repository = new BranchesHttpRepository();

beforeEach(() => Object.values(api).forEach((fn) => fn.mockReset()));

describe('BranchesHttpRepository', () => {
  it('lista, crea y actualiza sucursales en su endpoint', async () => {
    api.get.mockResolvedValueOnce([{ id: 'b1', name: 'Centro', address: 'x' }]);
    api.post.mockResolvedValueOnce({ id: 'b2' });
    api.put.mockResolvedValueOnce({ id: 'b1' });

    expect(await repository.list()).toEqual([{ id: 'b1', name: 'Centro', address: 'x' }]);
    await repository.create({ name: 'Norte', address: 'y' });
    await repository.update('b1', { isActive: false });

    expect(api.get).toHaveBeenCalledWith('/branches');
    expect(api.post).toHaveBeenCalledWith('/branches', { name: 'Norte', address: 'y' });
    expect(api.put).toHaveBeenCalledWith('/branches/b1', { isActive: false });
  });
});
