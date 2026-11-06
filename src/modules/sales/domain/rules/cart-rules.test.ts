import { DiscountType } from '@/modules/sales/domain/enums';
import { describe, expect, it } from 'vitest';
import { cartRefsFromPosVariant, clampGlobalDiscount, computeCartTotals, computeLineDiscount, discountForPrice, withWholesale, type PricedCartLine } from './cart-rules';
import { priceSale } from './sale-pricing';

const line = (overrides: Partial<PricedCartLine> = {}): PricedCartLine => ({
  price: 20,
  unitSalePrice: 20,
  wholesalePrice: 15,
  quantity: 1,
  ...overrides,
});

describe('descuento de línea', () => {
  it('por porcentaje redondea al céntimo con la mitad hacia arriba (1.005 → 1.01)', () => {
    expect(computeLineDiscount(20, DiscountType.PERCENTAGE, 10)).toMatchObject({ discountAmount: 2, discountRate: 10, clamped: null });
    expect(computeLineDiscount(10.05, DiscountType.PERCENTAGE, 10).discountAmount).toBe(1.01);
  });
  it('por monto: el valor es el precio final y el descuento la diferencia', () => {
    expect(computeLineDiscount(20, DiscountType.AMOUNT, 15)).toMatchObject({ discountAmount: 5, discountRate: 15 });
  });
  it('recorta lo imposible y lo avisa: >100 %, precio mayor al original, negativos y no numéricos', () => {
    expect(computeLineDiscount(20, DiscountType.PERCENTAGE, 150)).toMatchObject({ discountRate: 100, discountAmount: 20, clamped: 'MAX_PERCENT' });
    expect(computeLineDiscount(20, DiscountType.AMOUNT, 30)).toMatchObject({ discountRate: 20, discountAmount: 0, clamped: 'ABOVE_PRICE' });
    expect(computeLineDiscount(20, DiscountType.PERCENTAGE, -5)).toMatchObject({ discountRate: 0, discountAmount: 0 });
    expect(computeLineDiscount(20, DiscountType.PERCENTAGE, Number.NaN)).toMatchObject({ discountRate: 0, discountAmount: 0 });
  });
});

describe('mayoreo', () => {
  it('cambia el precio y recalcula el descuento conservando su tipo', () => {
    const base = line({ discountType: DiscountType.PERCENTAGE, discountRate: 10, discountAmount: 2 });
    expect(withWholesale(base, true)).toMatchObject({ price: 15, isWholesale: true, discountAmount: 1.5 });
    expect(withWholesale(withWholesale(base, true), false)).toMatchObject({ price: 20, isWholesale: false, discountAmount: 2 });
  });
  it('sin precio de mayoreo se queda en el regular', () => {
    expect(withWholesale(line({ wholesalePrice: null }), true)).toMatchObject({ price: 20, isWholesale: false });
  });
  it('descuento por monto: si el nuevo precio queda por debajo del precio fijado, el descuento es 0', () => {
    expect(discountForPrice({ discountType: DiscountType.AMOUNT, discountRate: 18, discountAmount: 2 }, 15)).toBe(0);
    expect(discountForPrice({ discountType: DiscountType.AMOUNT, discountRate: 12, discountAmount: 8 }, 20)).toBe(8);
  });
});

describe('descuento global', () => {
  it('se recorta al 100 % y nunca es negativo', () => {
    expect(clampGlobalDiscount(DiscountType.PERCENTAGE, 150, 100)).toEqual({ rate: 100, clamped: 'MAX_PERCENT' });
    expect(clampGlobalDiscount(DiscountType.PERCENTAGE, -3, 100)).toEqual({ rate: 0, clamped: null });
    expect(clampGlobalDiscount(DiscountType.PERCENTAGE, 12.345, 100)).toEqual({ rate: 12.35, clamped: null });
    expect(clampGlobalDiscount(DiscountType.AMOUNT, 500, 100)).toEqual({ rate: 100, clamped: 'ABOVE_SUBTOTAL' });
  });
});

describe('totales del carrito', () => {
  it('suma exacta: 3 × 0.1 es 0.3 y no 0.30000000000000004', () => {
    expect(computeCartTotals([line({ price: 0.1, quantity: 3 })], DiscountType.PERCENTAGE, 0)).toMatchObject({ grossSubtotal: 0.3, total: 0.3 });
  });
  it('aplica descuentos de línea y el global sobre el neto', () => {
    const totals = computeCartTotals([line({ quantity: 2, discountAmount: 2 }), line({ price: 10, quantity: 1 })], DiscountType.PERCENTAGE, 10);
    expect(totals).toEqual({ grossSubtotal: 50, totalItemDiscounts: 4, netSubtotal: 46, globalDiscountAmount: 4.6, total: 41.4 });
  });
  it('el total de la pantalla coincide con el que calcula el servidor (priceSale) en una muestra variada', () => {
    const cases: Array<{ lines: PricedCartLine[]; rate: number }> = [
      { lines: [line({ price: 3.333, quantity: 3 })], rate: 0 },
      { lines: [line({ price: 99.99, quantity: 1 }), line({ price: 0.01, quantity: 7, discountAmount: 0.01 })], rate: 33.33 },
      { lines: [line({ price: 12.5, quantity: 3, discountAmount: 1.25 }), line({ price: 7.77, quantity: 2 })], rate: 7.5 },
      { lines: [line({ price: 10.05, quantity: 1, discountAmount: 1.01 })], rate: 100 },
    ];
    for (const { lines, rate } of cases) {
      const totals = computeCartTotals(lines, DiscountType.PERCENTAGE, rate);
      const server = priceSale(
        lines.map((l) => ({ quantity: l.quantity, price: l.price, discountAmount: Number(((l.discountAmount ?? 0) * l.quantity).toFixed(2)) })),
        totals.globalDiscountAmount,
      );
      expect(totals.total).toBe(server.total);
      expect(totals.grossSubtotal).toBe(server.subtotal);
    }
  });
});

describe('cartRefsFromPosVariant', () => {
  it('pasa los precios a número y deja el mayoreo ausente como null', () => {
    const { product, variant } = cartRefsFromPosVariant({ id: 'v1', sku: 'A-1', productName: 'Playera', productType: 'SIMPLE', salePrice: '10.5' as unknown as number, wholesalePrice: undefined });
    expect(product).toEqual({ id: 'v1', name: 'Playera', type: 'SIMPLE' });
    expect(variant).toMatchObject({ id: 'v1', sku: 'A-1', salePrice: 10.5, wholesalePrice: null, attributes: [] });
  });

  it('conserva un mayoreo de 0 como número y los atributos que trae', () => {
    const { variant } = cartRefsFromPosVariant({ id: 'v', sku: 's', productName: 'p', salePrice: 1, wholesalePrice: 0, attributes: [{ name: 'Talla', value: 'M' }] });
    expect(variant.wholesalePrice).toBe(0);
    expect(variant.attributes).toEqual([{ name: 'Talla', value: 'M' }]);
  });
});
