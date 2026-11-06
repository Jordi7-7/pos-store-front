import { Checkout } from '../application/checkout';
import { CheckoutAttempt } from '../domain/checkout-attempt';
import { salesService } from './sales.service';

/**
 * Raíz de composición del módulo: aquí se enchufan los adaptadores reales a los casos de uso.
 * `Checkout` es único por pestaña para que un cobro pendiente conserve su clave de idempotencia.
 */
export const checkout = new Checkout(salesService, new CheckoutAttempt(() => crypto.randomUUID()));
