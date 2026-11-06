import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }));
vi.mock('@/lib/apiClient', () => ({ apiClient: api }));

const { UsersHttpRepository } = await import('./users.http-repository');
const { RolesHttpRepository } = await import('./roles.http-repository');
const users = new UsersHttpRepository();
const roles = new RolesHttpRepository();

beforeEach(() => Object.values(api).forEach((fn) => fn.mockReset()));

describe('repositorios de personal y roles', () => {
  it('usuarios: lista, crea, actualiza y genera PIN en su endpoint', async () => {
    api.get.mockResolvedValueOnce([{ id: 'u1' }]);
    api.post.mockResolvedValue({ pin: '123456', userId: 'u1' });
    api.put.mockResolvedValueOnce({ id: 'u1' });
    expect(await users.list()).toEqual([{ id: 'u1' }]);
    await users.create({ name: 'Ana', username: 'ana', password: 'x', roleId: 'r1' });
    await users.update('u1', { isActive: false });
    expect(await users.generatePin('u1')).toEqual({ pin: '123456', userId: 'u1' });
    expect(api.post.mock.calls.map(([path]) => path)).toEqual(['/users', '/users/u1/generate-pin']);
    expect(api.put).toHaveBeenCalledWith('/users/u1', { isActive: false });
  });

  it('roles: lista, catálogo de permisos, crea, actualiza y elimina', async () => {
    api.get.mockResolvedValue([]);
    api.post.mockResolvedValueOnce({ id: 'r1' });
    api.put.mockResolvedValueOnce({ id: 'r1' });
    api.delete.mockResolvedValueOnce({ success: true, message: 'ok' });
    await roles.list();
    await roles.permissionsCatalog();
    await roles.create({ name: 'Cajero', permissions: [] });
    await roles.update('r1', { name: 'Cajera' });
    expect((await roles.remove('r1')).success).toBe(true);
    expect(api.get.mock.calls.map(([path]) => path)).toEqual(['/roles', '/roles/permissions-catalog']);
    expect(api.delete).toHaveBeenCalledWith('/roles/r1');
  });
});
