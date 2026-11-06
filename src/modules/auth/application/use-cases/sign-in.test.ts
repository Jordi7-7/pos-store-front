import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/shared/infrastructure/http/api-error';
import type { SessionTenant, SessionUser } from '../../domain/entities/session';
import { ProfileUnavailableError, SignIn } from './sign-in';

const user = { id: 'u1', permissions: [] } as unknown as SessionUser;
const tenant = { id: 't1', slug: 'tienda' } as unknown as SessionTenant;

function setup() {
  const repository = {
    login: vi.fn(async () => ({ accessToken: 'a', refreshToken: 'r' })),
    pinLogin: vi.fn(async () => ({ accessToken: 'pa', refreshToken: 'pr' })),
    getProfile: vi.fn(async () => ({ user, tenant })),
  };
  return { repository, signIn: new SignIn(repository) };
}

describe('SignIn', () => {
  it('con usuario y contraseña devuelve la sesión completa y pide el perfil con el token recién entregado', async () => {
    const { repository, signIn } = setup();
    const session = await signIn.execute({ kind: 'password', identifier: 'admin', password: 'x', tenantSlug: 'tienda' });
    expect(session).toEqual({ tokens: { accessToken: 'a', refreshToken: 'r' }, user, tenant });
    expect(repository.getProfile).toHaveBeenCalledWith('a'); // sin guardar antes una sesión a medias
  });

  it('con PIN usa el login por PIN', async () => {
    const { repository, signIn } = setup();
    const session = await signIn.execute({ kind: 'pin', pin: '123456', tenantSlug: 'tienda' });
    expect(repository.pinLogin).toHaveBeenCalledWith({ kind: 'pin', pin: '123456', tenantSlug: 'tienda' });
    expect(session.tokens.accessToken).toBe('pa');
    expect(repository.login).not.toHaveBeenCalled();
  });

  it('los errores del servidor al autenticar llegan tal cual (con su code) y no se pide el perfil', async () => {
    const { repository, signIn } = setup();
    const error = new ApiError({ status: 429, code: 'TOO_MANY_ATTEMPTS', message: 'x' });
    repository.pinLogin.mockRejectedValueOnce(error);
    await expect(signIn.execute({ kind: 'pin', pin: '1', tenantSlug: 't' })).rejects.toBe(error);
    expect(repository.getProfile).not.toHaveBeenCalled();
  });

  it('si autentica pero el perfil falla, lo dice con un error propio y conserva la causa', async () => {
    const { repository, signIn } = setup();
    const cause = ApiError.network(new TypeError('fetch failed'));
    repository.getProfile.mockRejectedValueOnce(cause);
    const error = await signIn.execute({ kind: 'password', identifier: 'a', password: 'b' }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ProfileUnavailableError);
    expect((error as Error).cause).toBe(cause);
  });

  it('una respuesta sin token no abre sesión', async () => {
    const { repository, signIn } = setup();
    repository.login.mockResolvedValueOnce({ accessToken: '', refreshToken: '' });
    await expect(signIn.execute({ kind: 'password', identifier: 'a', password: 'b' })).rejects.toBeInstanceOf(ProfileUnavailableError);
  });
});
