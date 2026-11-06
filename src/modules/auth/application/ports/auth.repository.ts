import type { AuthTokens, SessionTenant, SessionUser } from '../../domain/entities/session';

export type SignInCredentials =
  | { kind: 'password'; identifier: string; password: string; tenantSlug?: string }
  | { kind: 'pin'; pin: string; tenantSlug: string };

/**
 * Puerto de salida: autenticación y perfil en el servidor. La implementación (`infrastructure`)
 * habla HTTP y devuelve entidades de sesión; los DTO no salen de ahí.
 */
export interface AuthRepository {
  getPublicTenant(slug: string): Promise<SessionTenant>;
  login(credentials: Extract<SignInCredentials, { kind: 'password' }>): Promise<AuthTokens>;
  pinLogin(credentials: Extract<SignInCredentials, { kind: 'pin' }>): Promise<AuthTokens>;
  /** Con `accessToken` explícito se puede pedir el perfil antes de guardar la sesión. */
  getProfile(accessToken?: string): Promise<{ user: SessionUser; tenant: SessionTenant }>;
  /** Renueva la sesión con la cookie de renovación que guarda el navegador; falla con 401 si ya no sirve. */
  refresh(): Promise<AuthTokens>;
  /** Revoca la sesión en el servidor y borra la cookie. */
  logout(): Promise<void>;
}
