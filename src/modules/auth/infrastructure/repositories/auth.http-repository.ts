import { apiClient } from '@/lib/apiClient';
import type { AuthRepository, SignInCredentials } from '../../application/ports/auth.repository';
import type { AuthTokens, SessionTenant, SessionUser } from '../../domain/entities/session';
import type { AuthTokensDTO, ProfileDTO, PublicTenantDTO } from '../dtos/auth.dto';
import { toSessionTenant, toSessionUser } from '../mappers/session.mapper';

const bearer = (accessToken: string): RequestInit => ({ headers: { Authorization: `Bearer ${accessToken}` } });

const toTokens = (dto: AuthTokensDTO): AuthTokens => ({ accessToken: dto.accessToken });

/** Autenticación por HTTP: convierte las respuestas (DTO) en entidades de sesión. */
export class AuthHttpRepository implements AuthRepository {
  async getPublicTenant(slug: string): Promise<SessionTenant> {
    return toSessionTenant(await apiClient.get<PublicTenantDTO>(`/tenants/public/${encodeURIComponent(slug)}`));
  }

  async login(credentials: Extract<SignInCredentials, { kind: 'password' }>): Promise<AuthTokens> {
    const response = await apiClient.post<AuthTokensDTO>('/auth/web/login', {
      email: credentials.identifier,
      password: credentials.password,
      tenantSlug: credentials.tenantSlug,
    });
    return toTokens(response);
  }

  async pinLogin(credentials: Extract<SignInCredentials, { kind: 'pin' }>): Promise<AuthTokens> {
    return toTokens(await apiClient.post<AuthTokensDTO>('/auth/web/pin-login', { pin: credentials.pin, tenantSlug: credentials.tenantSlug }));
  }

  async getProfile(accessToken?: string): Promise<{ user: SessionUser; tenant: SessionTenant }> {
    const profile = await apiClient.get<ProfileDTO>('/auth/profile', accessToken ? bearer(accessToken) : undefined);
    return { user: toSessionUser(profile), tenant: toSessionTenant(profile.tenant) };
  }

  async refresh(): Promise<AuthTokens> {
    return toTokens(await apiClient.post<AuthTokensDTO>('/auth/web/refresh'));
  }

  async logout(): Promise<void> {
    await apiClient.post('/auth/web/logout');
  }
}
