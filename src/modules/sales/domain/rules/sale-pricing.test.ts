import { describe, expect, it } from 'vitest';
import { Money } from '@/shared/domain/value-objects/money';
import { allocatePayments, changeDue, paymentsCoverTotal, priceSale, remainingToPay, SalePricingError, type SaleLineAmounts } from './sale-pricing';

// Paridad con pos-store/src/modules/sales/domain/services/sale-pricing.spec.ts: mismos casos, mismos resultados.
const line = (overrides: Partial<SaleLineAmounts> = {}): SaleLineAmounts => ({ quantity: 2, price: 10, ...overrides });

describe('priceSale (paridad con el backend)', () => {
  it('calcula una venta sin descuentos', () => {
    expect(priceSale([line(), line({ price: 3, quantity: 1 })])).toEqual({
      lines: [
        { subtotal: 20, discountAmount: 0, globalDiscountAmount: 0, total: 20 },
        { subtotal: 3, discountAmount: 0, globalDiscountAmount: 0, total: 3 },
      ],
      subtotal: 23,
      itemsDiscountAmount: 0,
      globalDiscountAmount: 0,
      discountAmount: 0,
      total: 23,
    });
  });

  it('aplica descuentos de línea y prorratea el global según la base neta', () => {
    const pricing = priceSale([line({ discountAmount: 5 }), line({ price: 2.5 })], 4);
    expect(pricing.lines).toEqual([
      { subtotal: 20, discountAmount: 5, globalDiscountAmount: 3, total: 12 },
      { subtotal: 5, discountAmount: 0, globalDiscountAmount: 1, total: 4 },
    ]);
    expect(pricing).toMatchObject({ subtotal: 25, itemsDiscountAmount: 5, globalDiscountAmount: 4, discountAmount: 9, total: 16 });
  });

  it('las líneas suman exactamente el total aunque el prorrateo no sea exacto', () => {
    const pricing = priceSale([line({ quantity: 1 }), line({ quantity: 1 }), line({ quantity: 1 })], 10);
    expect(pricing.total).toBe(20);
    expect(Money.sum(pricing.lines.map((l) => Money.of(l.total))).toNumber()).toBe(20);
    expect(Money.sum(pricing.lines.map((l) => Money.of(l.globalDiscountAmount))).toNumber()).toBe(10);
  });

  it('ninguna línea queda negativa con descuentos grandes sobre líneas baratas', () => {
    const pricing = priceSale([line({ price: 99.99, quantity: 1 }), line({ price: 0.01, quantity: 1 })], 99.99);
    expect(pricing.total).toBe(0.01);
    for (const priced of pricing.lines) expect(priced.total).toBeGreaterThanOrEqual(0);
  });

  it('venta gratis, líneas gratis, precios con más de 2 decimales y coma flotante', () => {
    expect(priceSale([line()], 20).total).toBe(0);
    expect(priceSale([line({ price: 0 })]).total).toBe(0);
    expect(priceSale([line({ price: 3.333, quantity: 3 })]).total).toBe(10);
    expect(priceSale([line({ price: 10 }), line({ price: 8, discountAmount: 2 })]).total).toBe(34);
    expect(priceSale([line({ price: 0.1, quantity: 3, discountAmount: 0.30000000000000004 })]).total).toBe(0);
  });

  it('rechaza lo mismo que el backend', () => {
    expect(() => priceSale([])).toThrow(SalePricingError);
    expect(() => priceSale([line({ price: -1 })])).toThrow(/negativo/);
    expect(() => priceSale([line({ quantity: 0 })])).toThrow(/cantidad/);
    expect(() => priceSale([line({ discountAmount: -1 })])).toThrow(/negativo/);
    expect(() => priceSale([line({ discountAmount: 21 })])).toThrow(/superar/);
    expect(() => priceSale([line()], -1)).toThrow(/negativo/);
    expect(() => priceSale([line()], 21)).toThrow(/superar/);
  });
});

describe('pagos', () => {
  it('cubrir el total, lo que falta y el cambio, sin errores de coma flotante', () => {
    expect(paymentsCoverTotal(30, [10, 20])).toBe(true);
    expect(paymentsCoverTotal(0.3, [0.1, 0.2])).toBe(true); // 0.1 + 0.2 !== 0.3 en coma flotante
    expect(paymentsCoverTotal(30, [10, 19.99])).toBe(false);
    expect(remainingToPay(30, [10])).toBe(20);
    expect(remainingToPay(30, [50])).toBe(0);
    expect(changeDue(30, [50])).toBe(20);
    expect(changeDue(0.3, [0.1, 0.2])).toBe(0);
  });
});

describe('allocatePayments (paridad con el backend)', () => {
  const cash = (amount: number) => ({ paymentMethod: 'EFECTIVO', amount });
  const card = (amount: number) => ({ paymentMethod: 'TARJETA', amount });

  it('deja los pagos intactos cuando suman exactamente el total', () => {
    expect(allocatePayments(30, [cash(10), card(20)])).toEqual([cash(10), card(20)]);
  });
  it('el vuelto sale del efectivo: pagar 50 en efectivo una venta de 30 registra 30', () => {
    expect(allocatePayments(30, [cash(50)])).toEqual([cash(30)]);
  });
  it('con pago mixto la tarjeta se aplica completa y el efectivo absorbe el sobrante', () => {
    expect(allocatePayments(30, [cash(20), card(25)])).toEqual([cash(5), card(25)]);
  });
  it('una tarjeta que excede el total no genera vuelto: se recorta al total', () => {
    expect(allocatePayments(30, [card(40)])).toEqual([card(30)]);
  });
  it('descarta los pagos que quedan en cero y no pierde centavos', () => {
    expect(allocatePayments(0.3, [card(0.3), cash(10)])).toEqual([card(0.3)]);
    expect(allocatePayments(0.3, [cash(0.1), cash(0.2)])).toEqual([cash(0.1), cash(0.2)]);
  });
});
