/** Formas de las respuestas y peticiones de `/auth/*` y `/tenants/public`. No salen de `infrastructure`. */

export interface PublicTenantDTO {
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

export interface LoginRequestDTO {
  email: string;
  password: string;
  tenantSlug?: string;
}

export interface PinLoginRequestDTO {
  pin: string;
  tenantSlug: string;
}

/** Respuesta de `/auth/web/*`: solo el token de acceso (el de renovación viaja en una cookie). */
export interface AuthTokensDTO {
  accessToken: string;
}

export interface ProfileDTO {
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
