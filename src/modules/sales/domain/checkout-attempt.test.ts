import { describe, expect, it } from 'vitest';
import { CheckoutAttempt, checkoutFingerprint } from './checkout-attempt';

const sale = (overrides: Partial<Parameters<typeof checkoutFingerprint>[0]> = {}) => ({
  branchId: 'b1',
  cashSessionId: 's1',
  items: [{ variantId: 'v1', quantity: 1, price: 310 }],
  payments: [{ paymentMethod: 'EFECTIVO', amount: 310 }],
  ...overrides,
});

const counter = () => {
  let n = 0;
  return () => `id-${++n}`;
};

describe('intento de cobro (idempotencia)', () => {
  it('un reintento de la misma venta usa la misma clave (no duplica)', () => {
    const attempt = new CheckoutAttempt(counter());
    const first = attempt.idFor(checkoutFingerprint(sale()));
    const retry = attempt.idFor(checkoutFingerprint(sale()));
    expect(retry).toBe(first);
  });

  it('un cobro pendiente conserva su clave aunque entre otro cobro distinto en medio', () => {
    const attempt = new CheckoutAttempt(counter());
    const pos = attempt.idFor(checkoutFingerprint(sale()));
    const exchange = attempt.idFor(checkoutFingerprint(sale({ items: [{ variantId: 'v9', quantity: 1, price: 5 }] })));
    expect(exchange).not.toBe(pos);
    expect(attempt.idFor(checkoutFingerprint(sale()))).toBe(pos);
  });

  it('los intentos abandonados no se acumulan sin límite', () => {
    const attempt = new CheckoutAttempt(counter(), 2);
    const first = attempt.idFor('a');
    attempt.idFor('b');
    attempt.idFor('c');
    expect(attempt.idFor('a')).not.toBe(first); // 'a' ya se descartó por antigüedad
  });

  it('si cambia el carrito, los pagos o el cliente es otra venta y lleva otra clave', () => {
    const attempt = new CheckoutAttempt(counter());
    const base = attempt.idFor(checkoutFingerprint(sale()));
    const moreItems = attempt.idFor(checkoutFingerprint(sale({ items: [{ variantId: 'v1', quantity: 2, price: 310 }] })));
    expect(moreItems).not.toBe(base);
    const otherPayment = attempt.idFor(checkoutFingerprint(sale({ items: [{ variantId: 'v1', quantity: 2, price: 310 }], payments: [{ paymentMethod: 'TARJETA', amount: 620 }] })));
    expect(otherPayment).not.toBe(moreItems);
    const withCustomer = attempt.idFor(checkoutFingerprint(sale({ customerId: 'c1' })));
    expect(withCustomer).not.toBe(otherPayment);
  });

  it('tras confirmarse la venta, la siguiente (aunque sea idéntica) lleva clave nueva', () => {
    const attempt = new CheckoutAttempt(counter());
    const first = attempt.idFor(checkoutFingerprint(sale()));
    attempt.complete(checkoutFingerprint(sale()));
    expect(attempt.idFor(checkoutFingerprint(sale()))).not.toBe(first);
  });

  it('tras un fallo (sin complete) se conserva la clave para el reintento', () => {
    const attempt = new CheckoutAttempt(counter());
    const first = attempt.idFor(checkoutFingerprint(sale()));
    // el envío falló por red: no se llama a complete()
    expect(attempt.idFor(checkoutFingerprint(sale()))).toBe(first);
  });
});
