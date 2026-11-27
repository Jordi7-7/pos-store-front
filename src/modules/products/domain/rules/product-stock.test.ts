import { describe, expect, it } from 'vitest';
import { ProductType } from '../enums';
import { isVariableProduct, labelLinesFor, labelLinesForArrival, stockedLabelLineFor, productStock, stockBreakdown, variantStock } from './product-stock';

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

});

describe('etiquetas desde la lista de productos', () => {
  const stocked = (sku: string, ...stocks: Array<[string, number]>) => ({ sku, salePrice: 10, ...variant(...stocks) });
  const labels = (variants: ReturnType<typeof stocked>[], branchId = 'a') => labelLinesFor([{ name: 'Playera', variants }], branchId);
  const quantities = (variants: ReturnType<typeof stocked>[], branchId = 'a') => labels(variants, branchId).lines.map((line) => [line.sku, line.quantity]);

  it('tantas etiquetas como existencias hay en la sucursal, con precio y combinación', () => {
    const { lines } = labelLinesFor([{ name: 'Playera', variants: [{ ...stocked(' P-S ', ['a', 4], ['b', 9]), salePrice: '12', attributes: [{ value: 'S' }, { value: 'Rojo' }] }] }], 'a');
    expect(lines).toEqual([{ sku: 'P-S', name: 'Playera', price: 12, quantity: 4, detail: 'S / Rojo' }]);
  });

  it('sin sucursal elegida suma las de todas, y las cantidades con decimales suben', () => {
    expect(quantities([stocked('P-S', ['a', 4], ['b', 9])], '')).toEqual([['P-S', 13]]);
    expect(quantities([stocked('P-S', ['a', 2.5])])).toEqual([['P-S', 3]]);
  });

  it('lo que está en cero, en negativo o sin existencias en esa sucursal no sale y se cuenta', () => {
    const result = labels([stocked('HAY', ['a', 2]), stocked('CERO', ['a', 0]), stocked('NEGATIVO', ['a', -3]), stocked('OTRA', ['b', 5])]);
    expect(result.lines.map((line) => line.sku)).toEqual(['HAY']);
    expect(result).toMatchObject({ withoutStock: 3, noneInStock: false });
  });

  it('si nada tiene existencias sale una etiqueta de cada uno', () => {
    const result = labels([stocked('A', ['a', 0]), stocked('B')]);
    expect(result.lines.map((line) => [line.sku, line.quantity])).toEqual([['A', 1], ['B', 1]]);
    expect(result).toMatchObject({ withoutStock: 0, noneInStock: true });
  });

  it('una variante sin SKU, o un producto sin variantes, no genera etiqueta y se cuenta para avisar', () => {
    const result = labelLinesFor([{ name: 'Playera', variants: [stocked('P-S', ['a', 1]), stocked('  ', ['a', 8])] }, { name: 'Vacío', variants: [] }], 'a');
    expect(result.lines.map((line) => line.sku)).toEqual(['P-S']);
    expect(result.skipped).toBe(2);
  });

  it('al imprimir una sola variante lleva sus existencias, y al menos una etiqueta', () => {
    expect(stockedLabelLineFor('Playera', stocked('A', ['a', 6]), 'a')?.quantity).toBe(6);
    expect(stockedLabelLineFor('Playera', stocked('A', ['a', -2]), 'a')?.quantity).toBe(1);
    expect(stockedLabelLineFor('Playera', stocked(' ', ['a', 6]), 'a')).toBeNull();
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
