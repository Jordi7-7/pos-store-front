import type { TicketFormat } from '../entities/ticket';
import { ticketMoney } from './ticket-money';

/** Texto del precio en la etiqueta, con la moneda y el idioma de la tienda: `PRECIO $1,234.50`. */
export const labelPriceText = (price: number, format: TicketFormat): string => `PRECIO ${ticketMoney(format)(price)}`;
