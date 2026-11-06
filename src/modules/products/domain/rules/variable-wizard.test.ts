import { describe, expect, it } from 'vitest';
import { applyBulkValues, combinationsOf, findSkuProblem, generateVariantRows, resolveBaseSku, toggleAttributeValue, toVariableProductRequest, type BulkValues } from './variable-wizard';

const noBulk: BulkValues = { skuPrefix: '', purchasePrice: '', salePrice: '', wholesalePrice: '', stock: '' };
const sizes = { attributeId: 'a1', attributeName: 'Talla', values: [{ id: 's', value: 'S' }, { id: 'm', value: 'M' }] };
const colors = { attributeId: 'a2', attributeName: 'Color', values: [{ id: 'r', value: 'Rojo' }, { id: 'n', value: 'Negro' }, { id: 'b', value: 'Blanco' }] };

describe('selección de valores', () => {
  it('marca y desmarca; un atributo sin valores sale de la selección', () => {
    const one = toggleAttributeValue({}, 'a1', 's');
    expect(one).toEqual({ a1: ['s'] });
    expect(toggleAttributeValue(one, 'a1', 'm')).toEqual({ a1: ['s', 'm'] });
    expect(toggleAttributeValue(one, 'a1', 's')).toEqual({});
  });
});

describe('combinaciones y SKU', () => {
  it('producto cartesiano: 2 tallas × 3 colores = 6, y un solo atributo = una por valor', () => {
    expect(combinationsOf([sizes, colors])).toHaveLength(6);
    expect(combinationsOf([sizes]).map((c) => c[0]?.valueName)).toEqual(['S', 'M']);
  });

  it('SKU base: ficha, luego prefijo en bloque, luego nombre; siempre limpio y en mayúsculas', () => {
    expect(resolveBaseSku(' hm-12 ', 'X', 'Playera')).toBe('HM-12');
    expect(resolveBaseSku('', ' ab c ', 'Playera')).toBe('ABC');
    expect(resolveBaseSku(undefined, '', 'Playera Oversize')).toBe('PLAYER');
    expect(resolveBaseSku('', '', '')).toBe('PROD');
    expect(resolveBaseSku('', '', '¡¡!!')).toBe('PROD');
  });

  it('genera filas numeradas con los valores en bloque como punto de partida', () => {
    const rows = generateVariantRows(combinationsOf([sizes]), 'HM', { ...noBulk, purchasePrice: '40', salePrice: '90', stock: '3' }, 7);
    expect(rows.map((r) => r.sku)).toEqual(['HM-1', 'HM-2']);
    expect(rows[0]).toMatchObject({ id: 'var-7-0', purchasePrice: 40, salePrice: 90, wholesalePrice: null, initialStock: 3 });
  });
});

describe('aplicar en bloque', () => {
  const rows = generateVariantRows(combinationsOf([sizes]), 'HM', noBulk, 1).map((r, i) => ({ ...r, salePrice: 10 + i, initialStock: 5 }));

  it('los campos vacíos no tocan nada; los escritos sustituyen a todas las filas', () => {
    expect(applyBulkValues(rows, noBulk)).toEqual(rows);
    const applied = applyBulkValues(rows, { ...noBulk, salePrice: '99', stock: '0' });
    expect(applied.map((r) => [r.salePrice, r.initialStock])).toEqual([[99, 0], [99, 0]]);
  });

  it('un prefijo renumera los SKU y lo limpia', () => {
    expect(applyBulkValues(rows, { ...noBulk, skuPrefix: ' ab c ' }).map((r) => r.sku)).toEqual(['ABC-1', 'ABC-2']);
  });
});

describe('validación y petición', () => {
  const rows = generateVariantRows(combinationsOf([sizes]), 'HM', { ...noBulk, purchasePrice: '40', salePrice: '90', stock: '3' }, 1);

  it('detecta SKU vacío o repetido sin distinguir mayúsculas', () => {
    expect(findSkuProblem(rows)).toBeNull();
    expect(findSkuProblem([rows[0]!, { ...rows[1]!, sku: 'hm-1' }])).toMatch(/repetido/);
    expect(findSkuProblem([{ ...rows[0]!, sku: '  ' }])).toMatch(/SKU válido/);
  });

  it('la petición lleva el stock en la sucursal, imágenes por variante y el SKU base en mayúsculas', () => {
    const request = toVariableProductRequest({ name: ' Playera ', baseSku: ' hm ', description: ' ', categoryId: '' }, rows, [{ id: 'img1', url: '' }], 'b1', '');
    expect(request).toMatchObject({ name: 'Playera', baseSku: 'HM', description: '', categoryId: undefined, imageIds: ['img1'] });
    expect(request.variants[0]).toMatchObject({ sku: 'HM-1', purchasePrice: 40, salePrice: 90, wholesalePrice: null, stocks: [{ branchId: 'b1', quantity: 3 }], attributeValues: [{ attributeValueId: 's' }] });
  });

  it('sin SKU base en la ficha usa el prefijo en bloque', () => {
    expect(toVariableProductRequest({ name: 'X' }, rows, [], 'b1', ' zz ').baseSku).toBe('ZZ');
    expect(toVariableProductRequest({ name: 'X' }, rows, [], 'b1', '').baseSku).toBeUndefined();
  });
});
