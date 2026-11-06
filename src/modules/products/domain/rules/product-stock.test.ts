import { describe, expect, it } from 'vitest';
import { ProductType } from '../enums';
import { isVariableProduct, labelLinesFor, productStock, stockBreakdown, variantStock } from './product-stock';

const variant = (...quantities: Array<[string, number]>) => ({ stocks: quantities.map(([branchId, quantity]) => ({ branchId, quantity })) });

describe('existencias en la lista de productos', () => {
  it('una variante: de la sucursal, o la suma de todas sin sucursal', () => {
    const v = variant(['a', 5], ['b', -2]);
    expect(variantStock(v, 'a')).toBe(5);
    expect(variantStock(v, 'z')).toBe(0);
    expect(variantStock(v, '')).toBe(3);
  });

  it('un producto: total de la empresa sin sucursal; con sucursal, suma de sus variantes allí', () => {
    const product = { totalStock: 99, variants: [variant(['a', 2], ['b', 7]), variant(['a', 1])] };
    expect(productStock(product, '')).toBe(99);
    expect(productStock(product, 'a')).toBe(3);
  });

  it('el desglose solo es "mixto" con variantes positivas y negativas a la vez', () => {
    const mixed = { type: ProductType.VARIABLE, variants: [variant(['a', 4]), variant(['a', -1])] };
    expect(stockBreakdown(mixed, 'a')).toEqual({ positive: 4, negative: -1, isMixed: true });
    expect(stockBreakdown({ type: ProductType.VARIABLE, variants: [variant(['a', 4]), variant(['a', 0])] }, 'a').isMixed).toBe(false);
    expect(stockBreakdown({ ...mixed, type: ProductType.SIMPLE }, 'a').isMixed).toBe(false);
  });

  it('detecta producto con variantes por tipo o por datos antiguos', () => {
    expect(isVariableProduct({ type: ProductType.VARIABLE, variants: [] })).toBe(true);
    expect(isVariableProduct({ type: ProductType.SIMPLE, variants: [{ attributes: [] }, { attributes: [] }] })).toBe(true);
    expect(isVariableProduct({ type: ProductType.SIMPLE, variants: [{ attributes: [{}] }] })).toBe(true);
    expect(isVariableProduct({ type: ProductType.SIMPLE, variants: [{ attributes: [] }] })).toBe(false);
  });

  it('etiquetas: una por variante con su precio; sin variantes, una "SIN-SKU"', () => {
    expect(labelLinesFor([{ name: 'Playera', variants: [{ sku: 'P-S', salePrice: 10 }, { sku: '', salePrice: 12 }] }, { name: 'Vacío', variants: [] }])).toEqual([
      { sku: 'P-S', name: 'Playera', price: 10, quantity: 1 },
      { sku: 'SIN-SKU', name: 'Playera', price: 12, quantity: 1 },
      { sku: 'SIN-SKU', name: 'Vacío', price: 0, quantity: 1 },
    ]);
  });
});
