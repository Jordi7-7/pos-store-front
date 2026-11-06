import { formatMoneyAmount } from '@/shared/domain/rules/format-money';

/** Lo que condiciona cómo se muestran importes y fechas: sale siempre de la tienda, nunca de valores fijos. */
export interface FormatContext {
  currencyCode: string;
  locale: string;
  timezone: string;
}

export interface Formatters {
  /** `$1,234.50` con la moneda de la tienda. */
  money(value: number | null | undefined): string;
  /** `05 nov 2026` */
  date(value?: string | Date | null): string;
  /** `10:30` */
  time(value?: string | Date | null): string;
  /** `05/11/2026, 10:30` */
  dateTime(value?: string | Date | null): string;
  /** `2h 15m` entre dos instantes (`end` por defecto: ahora). */
  duration(start?: string | null, end?: string | null, now?: number): string;
}

const toDate = (value?: string | Date | null): Date | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** Formateadores puros para una tienda. La capa de presentación los obtiene con `useFormatters()`. */
export function createFormatters({ currencyCode, locale, timezone }: FormatContext): Formatters {
  return {
    money: (value) => formatMoneyAmount(value, currencyCode, locale),

    date: (value) => {
      const date = toDate(value);
      return date ? date.toLocaleDateString(locale, { timeZone: timezone, day: '2-digit', month: 'short', year: 'numeric' }) : '';
    },

    time: (value) => {
      const date = toDate(value);
      return date ? date.toLocaleTimeString(locale, { timeZone: timezone, hour: '2-digit', minute: '2-digit' }) : '';
    },

    dateTime: (value) => {
      if (!value) return '-';
      const date = toDate(value);
      if (!date) return String(value);
      return date.toLocaleString(locale, {
        timeZone: timezone,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    },

    duration: (start, end, now = Date.now()) => {
      const from = toDate(start)?.getTime();
      const to = end ? toDate(end)?.getTime() : now;
      if (from === undefined || to === undefined || to < from) return '0m';
      const minutes = Math.floor((to - from) / 60000);
      const hours = Math.floor(minutes / 60);
      return hours === 0 ? `${minutes}m` : `${hours}h ${minutes % 60}m`;
    },
  };
}
