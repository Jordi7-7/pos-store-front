import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/shared/infrastructure/http/api-error';
import type { ProfileDTO } from '../../infrastructure/dtos/auth.dto';
import { toSessionTenant, toSessionUser } from '../../infrastructure/mappers/session.mapper';
import type { SessionTenant, SessionUser } from '../../domain/entities/session';

const { getProfile, loginRequest, pinLoginRequest } = vi.hoisted(() => ({ getProfile: vi.fn(), loginRequest: vi.fn(), pinLoginRequest: vi.fn() }));
// El repositorio es falso; el caso de uso SignIn y el store son los reales.
vi.mock('../../infrastructure/dependencies', async () => {
  const { SignIn } = await import('../../application/use-cases/sign-in');
  const authRepository = {
    getProfile: (...args: unknown[]) => getProfile(...args),
    login: (...args: unknown[]) => loginRequest(...args),
    pinLogin: (...args: unknown[]) => pinLoginRequest(...args),
    logout: vi.fn(async () => undefined),
    refresh: vi.fn(),
    getPublicTenant: vi.fn(),
  };
  return { authRepository, signIn: new SignIn(authRepository) };
});

const { useAuthStore, selectIsAuthenticated } = await import('./useAuthStore');
const { useWorkspaceStore } = await import('@/shared/presentation/stores/workspace.store');

const profile: ProfileDTO = {
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

/** Lo que devuelve el repositorio: la conversión (y su error si faltan datos de la tienda) ocurre al pedirlo. */
const fromDto = (dto: ProfileDTO) => ({ user: toSessionUser(dto), tenant: toSessionTenant(dto.tenant) });

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
  loginRequest.mockReset();
  pinLoginRequest.mockReset();
  useAuthStore.setState({ accessToken: 'tok', refreshToken: 'ref', user, tenant });
  useWorkspaceStore.getState().reset();
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
    getProfile.mockImplementationOnce(async () => fromDto(profile));
    await expect(useAuthStore.getState().fetchProfile()).resolves.toBe(true);
    const state = useAuthStore.getState();
    expect(state.tenant?.timezone).toBe('America/Mexico_City');
    expect(state.tenant?.currencyCode).toBe('MXN');
    expect(state.user?.branches).toEqual([{ id: 'b1', name: 'Leiza', address: null }]);
    const workspace = useWorkspaceStore.getState();
    expect(workspace.selectedBranchId).toBe('b1');
    expect(workspace.selectedCashRegisterId).toBe('c1');
  });

  it('si la tienda no trae un dato obligatorio NO se inventa: falla y no toca la sesión', async () => {
    getProfile.mockImplementationOnce(async () => fromDto({ ...profile, tenant: { ...profile.tenant, timezone: '' } }));
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

describe('sucursal y caja seleccionadas viven fuera de la sesión', () => {
  it('una selección que el perfil ya no permite se descarta al cargarlo', async () => {
    useWorkspaceStore.setState({ selectedBranchId: 'otra-sucursal', selectedCashRegisterId: 'otra-caja' });
    getProfile.mockImplementationOnce(async () => fromDto({
      ...profile,
      branches: [
        { id: 'b1', name: 'Leiza' },
        { id: 'b2', name: 'Copa' },
      ],
      cashRegisters: [
        { id: 'c1', name: 'Caja 1', code: 1, branchId: 'b1' },
        { id: 'c2', name: 'Caja 2', code: 2, branchId: 'b1' },
      ],
    }));
    await useAuthStore.getState().fetchProfile();
    expect(useWorkspaceStore.getState()).toMatchObject({ selectedBranchId: null, selectedCashRegisterId: null });
  });

  it('una selección válida se conserva', async () => {
    useWorkspaceStore.setState({ selectedBranchId: 'b2', selectedCashRegisterId: 'c3' });
    getProfile.mockImplementationOnce(async () => fromDto({
      ...profile,
      branches: [
        { id: 'b1', name: 'Leiza' },
        { id: 'b2', name: 'Copa' },
      ],
      cashRegisters: [
        { id: 'c1', name: 'Caja 1', code: 1, branchId: 'b1' },
        { id: 'c3', name: 'Caja de la casa', code: 1, branchId: 'b2' },
        { id: 'c4', name: 'Caja 4', code: 2, branchId: 'b2' },
      ],
    }));
    await useAuthStore.getState().fetchProfile();
    expect(useWorkspaceStore.getState()).toMatchObject({ selectedBranchId: 'b2', selectedCashRegisterId: 'c3' });
  });

  it('al cerrar sesión se borra la selección (el siguiente usuario no hereda la caja)', () => {
    useWorkspaceStore.setState({ selectedBranchId: 'b1', selectedCashRegisterId: 'c1' });
    useAuthStore.getState().logout();
    expect(useWorkspaceStore.getState()).toMatchObject({ selectedBranchId: null, selectedCashRegisterId: null });
  });
});

describe('cambio de formato de la tienda', () => {
  it('si cambia la moneda, la caché de datos ya formateados se descarta', async () => {
    const { queryClient } = await import('@/providers/QueryProvider');
    const clear = vi.spyOn(queryClient, 'clear');
    getProfile.mockImplementationOnce(async () => fromDto({ ...profile, tenant: { ...profile.tenant, currencyCode: 'USD' } }));
    await useAuthStore.getState().fetchProfile();
    expect(clear).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().tenant?.currencyCode).toBe('USD');
    clear.mockRestore();
  });

  it('si el formato no cambia (p. ej. solo el nombre), la caché se conserva', async () => {
    const { queryClient } = await import('@/providers/QueryProvider');
    const clear = vi.spyOn(queryClient, 'clear');
    getProfile.mockImplementationOnce(async () => fromDto({ ...profile, tenant: { ...profile.tenant, name: 'Otro nombre' } }));
    await useAuthStore.getState().fetchProfile();
    expect(clear).not.toHaveBeenCalled();
    clear.mockRestore();
  });
});

const apiError = (status: number, code: string) => new ApiError({ status, code, message: 'texto del servidor que no se parsea' });

describe('iniciar sesión: el motivo del fallo llega a la pantalla', () => {
  beforeEach(() => useAuthStore.setState({ accessToken: null, refreshToken: null, user: null }));

  it('con credenciales correctas guarda la sesión', async () => {
    loginRequest.mockResolvedValueOnce({ accessToken: 'a', refreshToken: 'r' });
    getProfile.mockImplementationOnce(async () => fromDto(profile));
    expect(await useAuthStore.getState().login('admin', 'x', 'tienda')).toEqual({ ok: true });
    expect(useAuthStore.getState()).toMatchObject({ accessToken: 'a', refreshToken: 'r' });
  });

  it.each([
    [401, 'INVALID_PIN', /PIN incorrecto/],
    [429, 'TOO_MANY_ATTEMPTS', /Demasiados intentos/],
    [401, 'USER_DISABLED', /deshabilitado/],
    [404, 'TENANT_NOT_FOUND', /Tienda no encontrada/],
  ])('PIN: %i %s se distingue de un PIN incorrecto', async (status, code, message) => {
    pinLoginRequest.mockRejectedValueOnce(apiError(status, code));
    const result = await useAuthStore.getState().pinLogin('123456', 'tienda');
    expect(result).toMatchObject({ ok: false, code });
    expect(result.ok === false && result.message).toMatch(message);
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('usuario y contraseña: 429 no se presenta como credenciales incorrectas', async () => {
    loginRequest.mockRejectedValueOnce(apiError(429, 'TOO_MANY_ATTEMPTS'));
    const result = await useAuthStore.getState().login('admin', 'x', 'tienda');
    expect(result).toMatchObject({ ok: false, code: 'TOO_MANY_ATTEMPTS' });
    expect(result.ok === false && result.message).not.toMatch(/incorrectas/);
  });

  it('sin conexión se dice que no hay conexión', async () => {
    pinLoginRequest.mockRejectedValueOnce(ApiError.network(new TypeError('fetch failed')));
    const result = await useAuthStore.getState().pinLogin('123456', 'tienda');
    expect(result).toMatchObject({ ok: false, code: 'NETWORK_ERROR' });
    expect(result.ok === false && result.message).toMatch(/conexión/);
  });

  it('si autentica pero el perfil falla, no queda sesión a medias y no se culpa a las credenciales', async () => {
    pinLoginRequest.mockResolvedValueOnce({ accessToken: 'a', refreshToken: 'r' });
    getProfile.mockRejectedValueOnce(ApiError.network(new TypeError('fetch failed')));
    const result = await useAuthStore.getState().pinLogin('123456', 'tienda');
    expect(result).toMatchObject({ ok: false, code: 'PROFILE_UNAVAILABLE' });
    expect(useAuthStore.getState()).toMatchObject({ accessToken: null, user: null });
  });
});
