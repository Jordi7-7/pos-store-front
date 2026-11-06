import { describe, expect, it, vi } from 'vitest';
import { PaymentMethod } from '../enums';
import { CheckoutAttempt } from '../domain/checkout-attempt';
import { Checkout, CheckoutError, type CheckoutCommand } from './checkout';
import type { SalesRepository } from './ports/sales.repository';
import { SalePricingError } from '../domain/rules/sale-pricing';

function setup() {
  let n = 0;
  const processSale = vi.fn<SalesRepository['processSale']>(async () => ({ id: 's1', invoiceNumber: '001-001-000000001' }));
  const checkout = new Checkout({ processSale }, new CheckoutAttempt(() => `req-${++n}-aaaaaaaa`));
  return { checkout, processSale };
}

const command = (overrides: Partial<CheckoutCommand> = {}): CheckoutCommand => ({
  branchId: 'b1',
  cashSessionId: 's1',
  lines: [{ variantId: 'v1', quantity: 2, price: 10 }],
  payments: [{ paymentMethod: PaymentMethod.EFECTIVO, amount: 20 }],
  ...overrides,
});

describe('Checkout', () => {
  it('envía la venta con su clave de idempotencia y devuelve folio, total y cambio', async () => {
    const { checkout, processSale } = setup();
    const result = await checkout.execute(command({ payments: [{ paymentMethod: PaymentMethod.EFECTIVO, amount: 50 }] }));

    expect(result).toMatchObject({ total: 20, change: 30, receipt: { invoiceNumber: '001-001-000000001' } });
    const sent = processSale.mock.calls[0]?.[0];
    expect(sent?.clientRequestId).toMatch(/^req-1-/);
    // el exceso es cambio, no ingreso: el pago registrado se recorta al total
    expect(sent?.payments).toEqual([{ paymentMethod: PaymentMethod.EFECTIVO, amount: 20 }]);
  });

  it('el descuento de línea se envía como total de la línea y el global se prorratea con las reglas del servidor', async () => {
    const { checkout, processSale } = setup();
    await checkout.execute(
      command({
        lines: [{ variantId: 'v1', quantity: 3, price: 10, discountType: 'PERCENTAGE', discountRate: 10, discountAmount: 1 }],
        globalDiscount: { type: 'PERCENTAGE', rate: 10, amount: 2.7 },
        payments: [{ paymentMethod: PaymentMethod.EFECTIVO, amount: 24.3 }],
      }),
    );
    const sent = processSale.mock.calls[0]?.[0];
    expect(sent).toMatchObject({ discountType: 'PERCENTAGE', discountRate: 10, discountAmount: 2.7 });
    expect(sent?.items[0]).toMatchObject({ discountAmount: 3, discountType: 'PERCENTAGE' });
  });

  it('rechaza un carrito vacío y pagos que no cubren el total, indicando lo que falta', async () => {
    const { checkout, processSale } = setup();
    await expect(checkout.execute(command({ lines: [] }))).rejects.toMatchObject({ code: 'EMPTY_CART' });
    await expect(checkout.execute(command({ payments: [{ paymentMethod: PaymentMethod.EFECTIVO, amount: 19.99 }] }))).rejects.toMatchObject({
      code: 'INSUFFICIENT_PAYMENT',
      missing: 0.01,
    });
    expect(processSale).not.toHaveBeenCalled();
  });

  it('una venta inválida (p. ej. descuento mayor al importe) no sale al servidor', async () => {
    const { checkout, processSale } = setup();
    await expect(checkout.execute(command({ lines: [{ variantId: 'v1', quantity: 1, price: 10, discountAmount: 11 }] }))).rejects.toBeInstanceOf(SalePricingError);
    expect(processSale).not.toHaveBeenCalled();
  });

  it('un reintento tras un fallo usa la misma clave; tras confirmarse, la venta siguiente usa otra', async () => {
    const { checkout, processSale } = setup();
    processSale.mockRejectedValueOnce(new Error('sin red'));
    await expect(checkout.execute(command())).rejects.toThrow('sin red');
    await checkout.execute(command());
    await checkout.execute(command());

    const keys = processSale.mock.calls.map(([sale]) => sale.clientRequestId);
    expect(keys[1]).toBe(keys[0]);
    expect(keys[2]).not.toBe(keys[1]);
  });

  it('CheckoutError lleva código para decidir el mensaje sin parsear texto', () => {
    expect(new CheckoutError('EMPTY_CART', 'x').code).toBe('EMPTY_CART');
  });
});
