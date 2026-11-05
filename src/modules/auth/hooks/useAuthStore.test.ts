import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/shared/infrastructure/http/api-error';
import type { ProfileResponse } from '../services/auth.service';
import type { SessionTenant, SessionUser } from '../domain/session';

const getProfile = vi.fn();
vi.mock('../services/auth.service', () => ({
  authService: { getProfile: (...args: unknown[]) => getProfile(...args), logout: vi.fn(async () => ({ message: 'ok' })) },
}));

const { useAuthStore, selectIsAuthenticated } = await import('./useAuthStore');

const profile: ProfileResponse = {
  id: 'u1',
  name: 'Cajero',
  username: 'cajero',
  isOwner: false,
  role: { id: 'r1', name: 'Cajero' },
  permissions: ['view:pos'],
  branches: [{ id: 'b1', name: 'Leiza' }],
  cashRegisters: [{ id: 'c1', name: 'Caja 1', code: 1, branchId: 'b1' }],
  tenant: {
    id: 't1',
    name: 'Tienda',
    slug: 'tienda',
    logoUrl: null,
    country: 'MX',
    currencyCode: 'MXN',
    currencySymbol: '$',
    timezone: 'America/Mexico_City',
  },
};

const user: SessionUser = {
  id: 'u1',
  name: 'Cajero',
  username: 'cajero',
  email: null,
  isOwner: false,
  role: { id: 'r1', name: 'Cajero' },
  permissions: ['view:pos'],
  branches: [],
  cashRegisters: [],
};
const tenant: SessionTenant = {
  id: 't1',
  name: 'Tienda',
  slug: 'tienda',
  logoUrl: null,
  country: 'MX',
  currencyCode: 'MXN',
  currencySymbol: '$',
  timezone: 'America/Mexico_City',
};

beforeEach(() => {
  getProfile.mockReset();
  useAuthStore.setState({ accessToken: 'tok', refreshToken: 'ref', user, tenant, selectedBranchId: null, selectedCashRegisterId: null });
});

describe('autenticación derivada', () => {
  it('está autenticado solo con token, usuario y tienda', () => {
    expect(selectIsAuthenticated({ accessToken: 'a', user, tenant })).toBe(true);
    expect(selectIsAuthenticated({ accessToken: null, user, tenant })).toBe(false);
    expect(selectIsAuthenticated({ accessToken: 'a', user: null, tenant })).toBe(false);
    expect(selectIsAuthenticated({ accessToken: 'a', user, tenant: null })).toBe(false);
  });
});

describe('useAuthStore.fetchProfile', () => {
  it('con éxito guarda usuario y tienda (zona horaria y moneda salen de la tienda)', async () => {
    getProfile.mockResolvedValueOnce(profile);
    await expect(useAuthStore.getState().fetchProfile()).resolves.toBe(true);
    const state = useAuthStore.getState();
    expect(state.tenant?.timezone).toBe('America/Mexico_City');
    expect(state.tenant?.currencyCode).toBe('MXN');
    expect(state.user?.branches).toEqual([{ id: 'b1', name: 'Leiza', address: null }]);
    expect(state.selectedBranchId).toBe('b1');
    expect(state.selectedCashRegisterId).toBe('c1');
  });

  it('si la tienda no trae un dato obligatorio NO se inventa: falla y no toca la sesión', async () => {
    getProfile.mockResolvedValueOnce({ ...profile, tenant: { ...profile.tenant, timezone: '' } });
    await expect(useAuthStore.getState().fetchProfile()).resolves.toBe(false);
    expect(useAuthStore.getState().tenant?.timezone).toBe('America/Mexico_City');
    expect(useAuthStore.getState().accessToken).toBe('tok');
  });

  it('una caída de red NO cierra la sesión', async () => {
    getProfile.mockRejectedValueOnce(ApiError.network(new TypeError('Failed to fetch')));
    await expect(useAuthStore.getState().fetchProfile()).resolves.toBe(false);
    expect(selectIsAuthenticated(useAuthStore.getState())).toBe(true);
  });

  it('un 500 NO cierra la sesión', async () => {
    getProfile.mockRejectedValueOnce(new ApiError({ status: 500, code: 'INTERNAL_ERROR', message: 'x' }));
    await expect(useAuthStore.getState().fetchProfile()).resolves.toBe(false);
    expect(selectIsAuthenticated(useAuthStore.getState())).toBe(true);
  });

  it('un 401 cierra la sesión pero conserva la tienda para la pantalla de login', async () => {
    getProfile.mockRejectedValueOnce(new ApiError({ status: 401, code: 'AUTH_TOKEN_INVALID', message: 'x' }));
    await expect(useAuthStore.getState().fetchProfile()).resolves.toBe(false);
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.tenant?.slug).toBe('tienda');
    expect(selectIsAuthenticated(state)).toBe(false);
  });
});

describe('permisos', () => {
  it('can() exige token y usa el perfil', () => {
    expect(useAuthStore.getState().can('view:pos')).toBe(true);
    expect(useAuthStore.getState().can('view:users')).toBe(false);
    useAuthStore.setState({ accessToken: null });
    expect(useAuthStore.getState().can('view:pos')).toBe(false);
  });

  it('el propietario puede todo', () => {
    useAuthStore.setState({ user: { ...user, isOwner: true, permissions: [] } });
    expect(useAuthStore.getState().can('cualquier:cosa')).toBe(true);
  });
});
