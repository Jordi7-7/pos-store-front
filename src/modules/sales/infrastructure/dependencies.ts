import { Checkout } from '../application/checkout';
import { ExchangeProducts } from '../application/exchange-products';
import { RefundSale } from '../application/refund-sale';
import type { TicketPrinter } from '../application/ports/ticket-printer';
import { CheckoutAttempt } from '../domain/checkout-attempt';
import { thermalPrinterService } from './printing/thermal-printer.service';
import { SalesHttpRepository } from './sales.http-repository';

/**
 * Raíz de composición del módulo: aquí se enchufan los adaptadores reales a los casos de uso.
 * `Checkout` es único por pestaña para que un cobro pendiente conserve su clave de idempotencia.
 */
export const salesRepository = new SalesHttpRepository();
export const checkout = new Checkout(salesRepository, new CheckoutAttempt(() => crypto.randomUUID()));
export const refundSale = new RefundSale(salesRepository);
export const exchangeProducts = new ExchangeProducts(refundSale, checkout);

/** Impresora de tickets en uso (térmica USB). La interfaz depende del puerto, no de la clase. */
export const ticketPrinter: TicketPrinter = thermalPrinterService;
