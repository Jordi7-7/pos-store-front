import { formatMoneyAmount } from '@/shared/domain/format-money';
import type { TicketFormat } from '../../domain/entities/ticket';

/** La tabla de caracteres de la impresora (CP850) no tiene todos los símbolos de moneda. */
const PRINTABLE = /^[\u0020-\u00FF]*$/;

/**
 * Importe para un ticket con la moneda y el idioma de la tienda. Los espacios "duros" de Intl se
 * convierten en espacios normales; si el símbolo no se puede imprimir (p. ej. €), se usa el código
 * de la moneda (`EUR 1.234,50`) en vez de dejar un carácter roto.
 */
export function ticketMoney(format: TicketFormat): (value: number | null | undefined) => string {
  return (value) => {
    const text = formatMoneyAmount(value, format.currencyCode, format.locale).replace(/[\u00A0\u202F]/g, ' ');
    if (PRINTABLE.test(text)) return text;
    const digits = text.replace(/[^\d.,\-\s]/g, '').trim();
    return `${format.currencyCode} ${digits}`;
  };
}
