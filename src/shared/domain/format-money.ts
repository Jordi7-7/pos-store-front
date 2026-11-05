/**
 * Formato de importes por moneda y país de la tienda. La moneda y el idioma salen de la tienda,
 * no se fijan (antes: `$` literal y `USD`/`es-EC` en varios sitios).
 */

/** Idioma de formato para el país de la tienda (`MX` → `es-MX`). Intl cae a `es` si no hay variante. */
export function localeForCountry(country: string): string {
  return `es-${country.trim().toUpperCase()}`;
}

const formatters = new Map<string, Intl.NumberFormat>();

/** Importe con símbolo, miles y 2 decimales (el backend guarda `numeric(10,2)`). */
export function formatMoneyAmount(value: number | null | undefined, currencyCode: string, locale: string): string {
  const key = `${locale}|${currencyCode}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    formatters.set(key, formatter);
  }
  // Un valor ausente o no numérico se muestra como 0 (antes `Number(x || 0)`), no como "NaN".
  return formatter.format(typeof value === 'number' && Number.isFinite(value) ? value : 0);
}
