/** Rango de fechas de un filtro (los mismos campos que `DateRange` del selector de calendario). */
export interface DateSpan {
  from?: Date;
  to?: Date;
}

/** Un filtro por fecha siempre tiene al menos el día de inicio; sin él, la lista traería todos los registros. */
export interface RequiredDateSpan extends DateSpan {
  from: Date;
}

/**
 * El día de hoy en la zona horaria de la tienda, como fecha local a medianoche: así el calendario
 * marca el mismo día que ve el negocio aunque el navegador esté en otra zona.
 */
export function todayInTimezone(timezone: string, now: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (type: string): number => Number(parts.find((p) => p.type === type)?.value);
  return new Date(part('year'), part('month') - 1, part('day'));
}

/** Rango de un solo día: hoy. Es el valor por defecto de los filtros por fecha. */
export function todayRange(timezone: string, now: Date = new Date()): RequiredDateSpan {
  const today = todayInTimezone(timezone, now);
  return { from: today, to: today };
}

/**
 * Valida el rango que devuelve el calendario: no se puede dejar el filtro vacío (si se desmarca
 * el día, se conserva el rango anterior) y un rango con solo inicio se toma como ese único día.
 */
export function requireDateRange(next: DateSpan | undefined, current: RequiredDateSpan): RequiredDateSpan {
  if (!next?.from) return current;
  return { from: next.from, to: next.to ?? next.from };
}
