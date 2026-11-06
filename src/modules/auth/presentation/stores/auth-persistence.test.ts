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
  it('de la versión plana (0) conserva solo la tienda: los tokens viejos se descartan y hay que volver a iniciar sesión', () => {
    const next = migratePersistedAuth(legacy, 0);
    expect(next.user).toBeNull();
    expect(next.tenant).toMatchObject({ id: 't1', slug: 'leiza', currencyCode: 'MXN', timezone: 'America/Mexico_City' });
    expect(JSON.stringify(next)).not.toMatch(/"a"|"r"|accessToken|refreshToken/);
  });

  it('de la versión 1 (con tokens en localStorage) también: sin usuario y sin ningún token', () => {
    const v1 = { accessToken: 'tok-secreto', refreshToken: 'ref-secreto', user: { id: 'u1' }, tenant: legacy.publicTenant };
    const next = migratePersistedAuth(v1, 1);
    expect(next.user).toBeNull();
    expect(next.tenant?.slug).toBe('leiza');
    expect(JSON.stringify(next)).not.toContain('secreto');
  });

  it('solo se guardan usuario y tienda, nunca tokens', () => {
    expect(Object.keys(migratePersistedAuth(legacy, 0)).sort()).toEqual(['tenant', 'user']);
  });

  it('si la tienda guardada está incompleta, queda sin tienda (no inventa datos)', () => {
    const next = migratePersistedAuth({ ...legacy, publicTenant: { ...legacy.publicTenant, timezone: undefined } }, 0);
    expect(next.user).toBeNull();
    expect(next.tenant).toBeNull();
  });

  it('basura o formato desconocido no rompe: devuelve estado vacío', () => {
    expect(migratePersistedAuth('basura', 0).user).toBeNull();
    expect(migratePersistedAuth(null, 0).tenant).toBeNull();
  });

  it('la versión actual se acepta tal cual y descarta cualquier campo ajeno (por ejemplo un token)', () => {
    const user = { id: 'u1' } as never;
    const tenant = { id: 't1' } as never;
    expect(migratePersistedAuth({ user, tenant, accessToken: 'intruso' }, AUTH_STORAGE_VERSION)).toEqual({ user, tenant });
  });
});
