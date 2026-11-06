import type { Session } from '../domain/session';
import type { AuthRepository, SignInCredentials } from './ports/auth.repository';

/** Se autenticó, pero no se pudo cargar el perfil (red caída, 500, datos de la tienda incompletos). */
export class ProfileUnavailableError extends Error {
  constructor(cause?: unknown) {
    super('No se pudo cargar tu perfil. Inténtalo de nuevo.', cause === undefined ? undefined : { cause });
    this.name = 'ProfileUnavailableError';
  }
}

/**
 * Iniciar sesión (usuario y contraseña, o PIN del cajero). Devuelve la sesión COMPLETA —tokens,
 * usuario y tienda— o falla: nunca queda una sesión a medias (tokens sin perfil). Los errores del
 * servidor al autenticar (credenciales, 429, cuenta deshabilitada…) llegan tal cual con su `code`.
 */
export class SignIn {
  constructor(private readonly repository: Pick<AuthRepository, 'login' | 'pinLogin' | 'getProfile'>) {}

  async execute(credentials: SignInCredentials): Promise<Session> {
    const tokens = credentials.kind === 'pin' ? await this.repository.pinLogin(credentials) : await this.repository.login(credentials);
    if (!tokens?.accessToken) throw new ProfileUnavailableError();

    try {
      const { user, tenant } = await this.repository.getProfile(tokens.accessToken);
      return { tokens, user, tenant };
    } catch (error) {
      throw new ProfileUnavailableError(error);
    }
  }
}
