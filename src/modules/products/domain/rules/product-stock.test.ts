import { describe, expect, it } from 'vitest';
import { ProductType } from '../enums';
import { isVariableProduct, labelLinesFor, labelLinesForArrival, productStock, stockBreakdown, variantStock } from './product-stock';

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

  it('etiquetas: una por variante con SKU, con su precio y su combinación', () => {
    const { lines, skipped } = labelLinesFor([
      { name: 'Playera', variants: [{ sku: 'P-S', salePrice: 10, attributes: [{ value: 'S' }, { value: 'Rojo' }] }, { sku: ' P-M ', salePrice: '12' }] },
    ]);
    expect(lines).toEqual([
      { sku: 'P-S', name: 'Playera', price: 10, quantity: 1, detail: 'S / Rojo' },
      { sku: 'P-M', name: 'Playera', price: 12, quantity: 1 },
    ]);
    expect(skipped).toBe(0);
  });

  it('una variante sin SKU, o un producto sin variantes, no genera etiqueta y se cuenta para avisar', () => {
    const { lines, skipped } = labelLinesFor([{ name: 'Playera', variants: [{ sku: 'P-S', salePrice: 10 }, { sku: '  ', salePrice: 12 }] }, { name: 'Vacío', variants: [] }]);
    expect(lines.map((line) => line.sku)).toEqual(['P-S']);
    expect(skipped).toBe(2);
  });
});

describe('etiquetas de lo que llegó en un lote', () => {
  const item = (sku: string, quantity: number, attributes: string[] = []) => ({ sku, productName: 'Mochila KTM', salePrice: 25, attributes, quantity });

  it('tantas etiquetas como unidades entraron, con precio y combinación', () => {
    expect(labelLinesForArrival([item('MOCH-KTM-01', 6, ['01']), item('GORRA', 2)])).toEqual({
      lines: [
        { sku: 'MOCH-KTM-01', name: 'Mochila KTM', price: 25, quantity: 6, detail: '01' },
        { sku: 'GORRA', name: 'Mochila KTM', price: 25, quantity: 2 },
      ],
      skipped: 0,
    });
  });

  it('redondea hacia arriba las cantidades con decimales, sin sumar de más por la coma flotante', () => {
    expect(labelLinesForArrival([item('A', 2.5)]).lines[0]?.quantity).toBe(3);
    expect(labelLinesForArrival([item('A', 0.1 + 0.2 + 2.7)]).lines[0]?.quantity).toBe(3);
  });

  it('lo que no tiene SKU se cuenta aparte y lo que no tiene unidades no sale', () => {
    expect(labelLinesForArrival([item('  ', 4), item('B', 0)])).toEqual({ lines: [], skipped: 1 });
  });
});
