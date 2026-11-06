import type { ProfileDTO, PublicTenantDTO } from '../dtos/auth.dto';
import type { SessionTenant, SessionUser } from '../../domain/entities/session';

/** El backend no mandó un dato de la tienda que la aplicación necesita (no se inventa uno). */
export class IncompleteTenantError extends Error {
  constructor(readonly field: string) {
    super(`A la tienda le falta el dato obligatorio "${field}".`);
    this.name = 'IncompleteTenantError';
  }
}

const REQUIRED_TENANT_FIELDS = ['id', 'name', 'slug', 'country', 'currencyCode', 'currencySymbol', 'timezone'] as const;

export function toSessionTenant(dto: PublicTenantDTO | ProfileDTO['tenant']): SessionTenant {
  for (const field of REQUIRED_TENANT_FIELDS) {
    const value = dto[field];
    if (typeof value !== 'string' || !value.trim()) throw new IncompleteTenantError(field);
  }
  return {
    id: dto.id,
    name: dto.name,
    slug: dto.slug,
    ...(dto.ruc ? { ruc: dto.ruc } : {}),
    logoUrl: dto.logoUrl ?? null,
    country: dto.country,
    currencyCode: dto.currencyCode,
    currencySymbol: dto.currencySymbol,
    timezone: dto.timezone,
  };
}

export function toSessionUser(profile: ProfileDTO): SessionUser {
  const isOwner = Boolean(profile.isOwner);
  return {
    id: profile.id,
    name: profile.name,
    username: profile.username,
    email: profile.email ?? null,
    isOwner,
    role: profile.role ? { id: profile.role.id, name: profile.role.name } : null,
    permissions: profile.permissions ?? [],
    branches: (profile.branches ?? []).map((b) => ({ id: b.id, name: b.name, address: b.address ?? null })),
    cashRegisters: profile.cashRegisters ?? [],
  };
}
