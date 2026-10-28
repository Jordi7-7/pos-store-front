import { apiClient } from '@/lib/apiClient';

export interface PublicTenantResponse {
  id: string;
  name: string;
  ruc?: string;
  slug: string;
  logoUrl: string | null;
  country: string;
  currencyCode: string;
  currencySymbol: string;
  timezone: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  tenantSlug?: string;
}

export interface PinLoginPayload {
  pin: string;
  tenantSlug: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ProfileResponse {
  id: string;
  name: string;
  username: string;
  email?: string | null;
  isOwner: boolean;
  role: { id: string; name: string } | null;
  permissions?: string[];
  branches?: Array<{ id: string; name: string; address?: string | null }>;
  branchIds?: string[];
  cashRegisters?: Array<{
    id: string;
    name: string;
    code: number;
    branchId: string;
  }>;
  tenant: {
    id: string;
    name: string;
    ruc?: string;
    slug: string;
    logoUrl: string | null;
    country: string;
    currencyCode: string;
    currencySymbol: string;
    timezone: string;
  };
}

export interface OnboardPayload {
  tenantName: string;
  ruc: string;
  country: string;
  currencyCode: string;
  currencySymbol: string;
  timezone: string;
  adminName: string;
  username: string;
  email?: string;
  password: string;
  branchName: string;
  branchAddress: string;
  slug?: string;
}

export const authService = {
  /**
   * Obtiene la información pública del negocio a partir de su slug
   */
  getPublicTenantBySlug: async (slug: string): Promise<PublicTenantResponse> => {
    return apiClient.get<PublicTenantResponse>(`/tenants/public/${encodeURIComponent(slug)}`);
  },

  /**
   * Inicio de sesión con credenciales (usuario/email + contraseña)
   */
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/auth/login', payload);
  },

  /**
   * Inicio de sesión directo con PIN de cajero
   */
  pinLogin: async (payload: PinLoginPayload): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/auth/pin-login', payload);
  },

  /**
   * Registro y creación de un nuevo tenant (Onboarding)
   */
  onboard: async (payload: OnboardPayload): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/auth/onboard', payload);
  },

  /**
   * Consulta el perfil autenticado actual del usuario
   */
  getProfile: async (): Promise<ProfileResponse> => {
    return apiClient.get<ProfileResponse>('/auth/profile');
  },

  /**
   * Cierra sesión en el backend revocando la sesión en Redis
   */
  logout: async (token?: string | null): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>(
      '/auth/logout',
      {},
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
    );
  },
};

