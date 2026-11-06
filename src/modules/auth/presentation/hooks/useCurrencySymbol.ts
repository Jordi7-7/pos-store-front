import { MissingTenantDataError, useTenant } from './useSession';

/** Símbolo de la moneda de la tienda (`$`, `€`…). Exige sesión con tienda: no hay símbolo por defecto. */
export function useCurrencySymbol(): string {
  const tenant = useTenant();
  if (!tenant) throw new MissingTenantDataError('moneda');
  return tenant.currencySymbol;
}
