import { describe, expect, it } from 'vitest';
import { AUTH_STORAGE_VERSION, migratePersistedAuth } from './auth-persistence';

// Forma exacta que guardaba la versión anterior (partialize plano, con campos duplicados).
const legacy = {
  accessToken: 'a',
  refreshToken: 'r',
  tenantId: 't1',
  tenantSlug: 'leiza',
  publicTenant: {
    id: 't1',
    name: 'LEIZA',
    ruc: '179',
    slug: 'leiza',
    logoUrl: 'https://x/logo.png',
    country: 'MX',
    currencyCode: 'MXN',
    currencySymbol: '$',
    timezone: 'America/Mexico_City',
  },
  role: 'Cajero',
  roleId: 'role-1',
  roleName: 'Cajero',
  permissions: ['view:pos'],
  user: { id: 'u1', name: 'Cajero COPA', username: 'cajero', email: null, timezone: 'x', branchIds: ['b1'], cashRegisters: [] },
  branchIds: ['b1'],
  cashRegisters: [{ id: 'c1', name: 'Caja 1', code: 1, branchId: 'b1' }],
  timezone: 'America/Mexico_City',
  selectedBranchId: 'b1',
  selectedCashRegisterId: 'c1',
  isAuthenticated: true,
};

describe('migratePersistedAuth', () => {
  it('conserva la sesión de la versión anterior (nadie pierde el login al desplegar)', () => {
    const next = migratePersistedAuth(legacy, 0);
    expect(next.accessToken).toBe('a');
    expect(next.refreshToken).toBe('r');
    expect(next.tenant).toMatchObject({ id: 't1', slug: 'leiza', currencyCode: 'MXN', timezone: 'America/Mexico_City' });
    expect(next.user).toMatchObject({
      id: 'u1',
      isOwner: false,
      role: { id: 'role-1', name: 'Cajero' },
      permissions: ['view:pos'],
      branches: [{ id: 'b1', name: '' }],
    });
    expect(next.selectedBranchId).toBe('b1');
    expect(next.selectedCashRegisterId).toBe('c1');
  });

  it('el propietario se reconoce por el rol OWNER y no lleva rol de usuario', () => {
    const next = migratePersistedAuth({ ...legacy, role: 'OWNER', roleId: null, roleName: 'Propietario' }, 0);
    expect(next.user?.isOwner).toBe(true);
    expect(next.user?.role).toBeNull();
  });

  it('no guarda campos duplicados ni derivados', () => {
    const keys = Object.keys(migratePersistedAuth(legacy, 0)).sort();
    expect(keys).toEqual(['accessToken', 'refreshToken', 'selectedBranchId', 'selectedCashRegisterId', 'tenant', 'user']);
  });

  it('si la tienda guardada está incompleta, descarta la sesión (no inventa datos)', () => {
    const next = migratePersistedAuth({ ...legacy, publicTenant: { ...legacy.publicTenant, timezone: undefined } }, 0);
    expect(next.accessToken).toBeNull();
    expect(next.user).toBeNull();
    expect(next.tenant).toBeNull();
  });

  it('sin tokens o sin usuario, descarta la sesión pero conserva la tienda para el login', () => {
    const noTokens = migratePersistedAuth({ ...legacy, accessToken: null }, 0);
    expect(noTokens.user).toBeNull();
    expect(noTokens.tenant?.slug).toBe('leiza');
    expect(migratePersistedAuth({ ...legacy, user: null }, 0).accessToken).toBeNull();
  });

  it('basura o formato desconocido no rompe: devuelve estado vacío', () => {
    expect(migratePersistedAuth('basura', 0).user).toBeNull();
    expect(migratePersistedAuth(null, 0).tenant).toBeNull();
  });

  it('la versión actual se acepta tal cual', () => {
    const current = { accessToken: 'a', refreshToken: 'r', user: null, tenant: null, selectedBranchId: null, selectedCashRegisterId: null };
    expect(migratePersistedAuth(current, AUTH_STORAGE_VERSION)).toEqual(current);
  });
});
