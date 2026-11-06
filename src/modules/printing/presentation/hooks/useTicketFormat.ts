import { useTenant } from '@/modules/auth/presentation/hooks/useSession';
import { MissingTenantDataError } from '@/modules/auth/presentation/hooks/useSession';
import { localeForCountry } from '@/shared/domain/rules/format-money';
import type { TicketFormat } from '../../domain/entities/ticket';

/** Moneda e idioma de la tienda para escribir importes en tickets. Exige sesión con tienda: no hay valores por defecto. */
export function useTicketFormat(): TicketFormat {
  const tenant = useTenant();
  if (!tenant) throw new MissingTenantDataError('moneda');
  return { currencyCode: tenant.currencyCode, locale: localeForCountry(tenant.country) };
}
