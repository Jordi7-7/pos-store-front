import { useMemo } from 'react';
import { createFormatters, type Formatters } from '@/shared/presentation/formatting/formatters';
import { localeForCountry } from '@/shared/domain/rules/format-money';
import { MissingTenantDataError, useTenant } from './useSession';

/**
 * Formateadores con la moneda, el idioma y la zona horaria de la tienda. Se recalculan si la
 * tienda cambia esos datos, así las pantallas se repintan sin vaciar la caché de datos.
 */
export function useFormatters(): Formatters {
  const tenant = useTenant();
  if (!tenant) throw new MissingTenantDataError('datos');
  const { currencyCode, country, timezone } = tenant;
  return useMemo(() => createFormatters({ currencyCode, locale: localeForCountry(country), timezone }), [currencyCode, country, timezone]);
}
