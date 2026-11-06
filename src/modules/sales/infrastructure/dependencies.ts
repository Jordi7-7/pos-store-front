import { Checkout } from '../application/use-cases/checkout';
import { ExchangeProducts } from '../application/use-cases/exchange-products';
import { RefundSale } from '../application/use-cases/refund-sale';
import { CheckoutAttempt } from '../domain/rules/checkout-attempt';
import { SalesHttpRepository } from './repositories/sales.http-repository';

/**
 * Raíz de composición del módulo: aquí se enchufan los adaptadores reales a los casos de uso.
 * `Checkout` es único por pestaña para que un cobro pendiente conserve su clave de idempotencia.
 */
export const salesRepository = new SalesHttpRepository();
export const checkout = new Checkout(salesRepository, new CheckoutAttempt(() => crypto.randomUUID()));
export const refundSale = new RefundSale(salesRepository);
export const exchangeProducts = new ExchangeProducts(refundSale, checkout);
