import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }));
vi.mock('@/lib/apiClient', () => ({ apiClient: api }));

const { CustomersHttpRepository } = await import('./customers.http-repository');
const repository = new CustomersHttpRepository();

beforeEach(() => Object.values(api).forEach((fn) => fn.mockReset()));

describe('CustomersHttpRepository', () => {
  it('lista clientes y los devuelve como entidades', async () => {
    api.get.mockResolvedValueOnce([{ id: 'c1', identityNumber: '1', name: 'Ana', email: 'a@x.com' }]);
    expect(await repository.list()).toMatchObject([{ id: 'c1', email: 'a@x.com', hasContactInfo: true }]);
    expect(api.get).toHaveBeenCalledWith('/customers');
  });

  it('crea, actualiza y elimina en su endpoint', async () => {
    api.post.mockResolvedValueOnce({ id: 'c2', identityNumber: '2', name: 'Luis' });
    api.put.mockResolvedValueOnce({ id: 'c2', identityNumber: '2', name: 'Luis P' });
    await repository.create({ identityNumber: '2', name: 'Luis' });
    await repository.update('c2', { name: 'Luis P' });
    await repository.remove('c2');
    expect(api.post).toHaveBeenCalledWith('/customers', { identityNumber: '2', name: 'Luis' });
    expect(api.put).toHaveBeenCalledWith('/customers/c2', { name: 'Luis P' });
    expect(api.delete).toHaveBeenCalledWith('/customers/c2');
  });
});
