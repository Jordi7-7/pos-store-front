import { describe, expect, it } from 'vitest';
import { exchangeDifference, newItemsTotal, refundAmount, returnTotal, type RefundableItem } from './exchange-rules';

const item = (overrides: Partial<RefundableItem & { variantId: string }> = {}) => ({
  variantId: 'v1',
  quantity: 2,
  refundedQty: 0,
  price: 100,
  discountAmount: 0,
  lineTotal: 200,
  ...overrides,
});

describe('devolución (paridad con refund-plan del backend)', () => {
  it('devuelve lo pagado, también cuando hubo descuento global (defecto: antes se ignoraba)', () => {
    // 2 × 100 con descuento global de 20 repartido en la línea: el cliente pagó 180, no 200
    expect(refundAmount(item({ lineTotal: 180 }), 1)).toBe(90);
    expect(refundAmount(item({ lineTotal: 180 }), 2)).toBe(180);
  });

  it('incluye el descuento de línea', () => {
    expect(refundAmount(item({ discountAmount: 20, lineTotal: 180 }), 2)).toBe(180);
  });

  it('varias devoluciones parciales suman exactamente lo pagado (3 × 10.00 → 3.33 + 3.34 + 3.33)', () => {
    const base = { quantity: 3, price: 10, discountAmount: 0, lineTotal: 10 };
    const first = refundAmount({ ...base, refundedQty: 0 }, 1);
    const second = refundAmount({ ...base, refundedQty: 1 }, 1);
    const third = refundAmount({ ...base, refundedQty: 2 }, 1);
    expect([first, second, third]).toEqual([3.33, 3.34, 3.33]);
    expect(first + second + third).toBeCloseTo(10, 10);
  });

  it('una venta antigua sin total guardado se calcula con precio y descuento de línea', () => {
    expect(refundAmount(item({ lineTotal: 0, discountAmount: 20 }), 1)).toBe(90);
  });

  it('el total a devolver suma las cantidades elegidas por línea', () => {
    const items = [item({ variantId: 'a', lineTotal: 180 }), item({ variantId: 'b', price: 50, quantity: 1, lineTotal: 50 })];
    expect(returnTotal(items, { a: 1, b: 1 })).toBe(140);
    expect(returnTotal(items, {})).toBe(0);
  });
});

describe('cambio', () => {
  it('total de productos nuevos con descuentos por unidad, sin errores de coma flotante', () => {
    expect(newItemsTotal([{ price: 0.1, quantity: 3 }])).toBe(0.3);
    expect(newItemsTotal([{ price: 20, quantity: 2, discountAmount: 5 }, { price: 10, quantity: 1 }])).toBe(40);
  });

  it('una línea nunca resta por debajo de cero', () => {
    expect(newItemsTotal([{ price: 10, quantity: 1, discountAmount: 15 }])).toBe(0);
  });

  it('la diferencia es positiva si paga el cliente y negativa si se le devuelve', () => {
    expect(exchangeDifference(100, 90)).toBe(10);
    expect(exchangeDifference(90, 100)).toBe(-10);
    expect(exchangeDifference(0.3, 0.1)).toBe(0.2);
  });
});
