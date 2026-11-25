import { describe, expect, it } from 'vitest';
import {
  applyBulkValues,
  applyPaste,
  choicesFrom,
  combinationKey,
  combinationsOf,
  countCombinations,
  findRowIssues,
  hasBlockingIssues,
  suggestBaseSku,
  suggestSku,
  syncRows,
  toggleAttributeValue,
  toVariableProductRequest,
  type BulkValues,
  type WizardVariantRow,
} from './variable-wizard';

const noBulk: BulkValues = { purchasePrice: '', salePrice: '', wholesalePrice: '', stock: '' };
const sizes = { attributeId: 'a1', attributeName: 'Talla', values: [{ id: 's', value: 'S' }, { id: 'm', value: 'M' }] };
const colors = { attributeId: 'a2', attributeName: 'Color', values: [{ id: 'r', value: 'Rojo' }, { id: 'n', value: 'Negro' }, { id: 'b', value: 'Blanco' }] };
const catalog = [
  { id: 'a1', name: 'Talla', values: [{ id: 's', value: 'S' }, { id: 'm', value: 'M' }, { id: 'l', value: 'L' }] },
  { id: 'a2', name: 'Color', values: [{ id: 'r', value: 'Rojo' }, { id: 'n', value: 'Negro' }] },
];
const at = <T,>(list: readonly T[], index: number): T => {
  const item = list[index];
  if (item === undefined) throw new Error(`No hay elemento ${index}`);
  return item;
};
const ids = () => {
  let n = 0;
  return () => `new-${++n}`;
};

describe('selección de valores y combinaciones', () => {
  it('marca y desmarca; un atributo sin valores sale de la selección', () => {
    const one = toggleAttributeValue({}, 'a1', 's');
    expect(one).toEqual({ a1: ['s'] });
    expect(toggleAttributeValue(one, 'a1', 'm')).toEqual({ a1: ['s', 'm'] });
    expect(toggleAttributeValue(one, 'a1', 's')).toEqual({});
  });

  it('producto cartesiano: 2 tallas × 3 colores = 6, y un solo atributo = una por valor', () => {
    expect(combinationsOf([sizes, colors])).toHaveLength(6);
    expect(combinationsOf([sizes]).map((c) => c[0]?.valueName)).toEqual(['S', 'M']);
  });

  it('cuenta las combinaciones sin generarlas, y 0 si no hay nada marcado', () => {
    expect(countCombinations([sizes, colors])).toBe(6);
    expect(countCombinations([])).toBe(0);
  });

  it('los atributos salen en el orden del catálogo y solo con valores marcados', () => {
    const choices = choicesFrom({ a2: ['n'], a1: ['m', 's'] }, catalog);
    expect(choices.map((c) => [c.attributeName, c.values.map((v) => v.value)])).toEqual([['Talla', ['S', 'M']], ['Color', ['Negro']]]);
    expect(choicesFrom({}, catalog)).toEqual([]);
  });

  it('la clave de una combinación no depende del orden', () => {
    const first = at(combinationsOf([sizes, colors]), 0);
    expect(combinationKey(first)).toBe(combinationKey([...first].reverse()));
  });
});

describe('SKU', () => {
  it('el SKU base sugerido sale del nombre, sin acentos ni símbolos', () => {
    expect(suggestBaseSku('Playera Oversize')).toBe('PLAYER');
    expect(suggestBaseSku('  Cámisa-ñ 2 ')).toBe('CAMISA');
    expect(suggestBaseSku('¡¡!!')).toBe('');
  });

  it('el SKU de una variante es el base más sus valores', () => {
    const first = at(combinationsOf([colors, sizes]), 0);
    expect(suggestSku('ply', first)).toBe('PLY-ROJO-S');
  });
});

describe('syncRows: poner la tabla al día sin perder lo escrito', () => {
  const initial = syncRows([], combinationsOf([sizes]), 'PLY', ids());

  it('crea una fila por combinación con SKU a partir de los valores', () => {
    expect(initial.map((row) => row.sku)).toEqual(['PLY-S', 'PLY-M']);
    expect(initial[0]).toMatchObject({ purchasePrice: 0, salePrice: 0, wholesalePrice: null, initialStock: 0 });
  });

  it('al añadir un valor conserva lo escrito en las filas que ya existían y la nueva hereda los precios de la primera', () => {
    const edited = initial.map((row, index) => ({ ...row, purchasePrice: 40, salePrice: 90, initialStock: index === 0 ? 7 : 3 }));
    const withBarcode = [{ ...at(edited, 0), barcode: '7501' }, at(edited, 1)];

    const next = syncRows(withBarcode, combinationsOf([{ ...sizes, values: [...sizes.values, { id: 'l', value: 'L' }] }]), 'PLY', ids());

    expect(next.map((row) => row.sku)).toEqual(['PLY-S', 'PLY-M', 'PLY-L']);
    expect(next[0]).toMatchObject({ id: at(initial, 0).id, barcode: '7501', initialStock: 7, salePrice: 90 });
    expect(next[2]).toMatchObject({ purchasePrice: 40, salePrice: 90, initialStock: 0 });
  });

  it('al quitar un valor sale su fila y las demás no cambian', () => {
    const next = syncRows(initial, combinationsOf([{ ...sizes, values: [at(sizes.values, 1)] }]), 'PLY', ids());
    expect(next.map((row) => row.id)).toEqual([at(initial, 1).id]);
  });

  it('un SKU escrito a mano se respeta aunque cambie el SKU base; los demás siguen al base', () => {
    const edited = [{ ...at(initial, 0), sku: 'MI-SKU', skuEdited: true }, at(initial, 1)];
    const next = syncRows(edited, combinationsOf([sizes]), 'NUEVO', ids());
    expect(next.map((row) => row.sku)).toEqual(['MI-SKU', 'NUEVO-M']);
  });

  it('un SKU sugerido nunca pisa a otro: valores que limpian igual reciben -2, -3', () => {
    const twins = combinationsOf([{ attributeId: 'a1', attributeName: 'Talla', values: [{ id: 'x1', value: 'X L' }, { id: 'x2', value: 'XL' }, { id: 'x3', value: 'X-L' }] }]);
    expect(syncRows([], twins, 'PLY', ids()).map((row) => row.sku)).toEqual(['PLY-XL', 'PLY-XL-2', 'PLY-X-L']);
  });
});

describe('aplicar en bloque', () => {
  const rows = syncRows([], combinationsOf([sizes]), 'HM', ids()).map((r, i) => ({ ...r, salePrice: 10 + i, initialStock: 5 }));

  it('los campos vacíos no tocan nada; los escritos sustituyen a todas las filas', () => {
    expect(applyBulkValues(rows, noBulk)).toEqual(rows);
    const applied = applyBulkValues(rows, { ...noBulk, salePrice: '99', stock: '0' });
    expect(applied.map((r) => [r.salePrice, r.initialStock])).toEqual([[99, 0], [99, 0]]);
  });
});

describe('problemas por fila', () => {
  const base: WizardVariantRow = { id: 'r1', sku: 'A-1', barcode: '', purchasePrice: 2, salePrice: 5, wholesalePrice: null, initialStock: 1, combination: [] };

  it('una fila correcta no tiene problemas', () => {
    expect(findRowIssues([base])).toEqual({});
  });

  it('SKU vacío o repetido (sin distinguir mayúsculas) y precio de venta en 0 impiden guardar', () => {
    const issues = findRowIssues([
      { ...base, id: 'a', sku: ' ' },
      { ...base, id: 'b', sku: 'dup' },
      { ...base, id: 'c', sku: 'DUP' },
      { ...base, id: 'd', sku: 'D-1', salePrice: 0 },
    ]);

    expect(issues['a']).toEqual([{ field: 'sku', message: 'Falta el SKU.', level: 'error' }]);
    expect(issues['b']?.[0]).toMatchObject({ field: 'sku', level: 'error' });
    expect(issues['c']?.[0]).toMatchObject({ field: 'sku', level: 'error' });
    expect(issues['d']).toEqual([{ field: 'salePrice', message: 'Falta el precio de venta.', level: 'error' }]);
    expect(hasBlockingIssues(issues)).toBe(true);
  });

  it('negativos impiden guardar', () => {
    const issues = findRowIssues([{ ...base, purchasePrice: -1, wholesalePrice: -2, initialStock: -3 }]);
    expect(issues['r1']?.map((issue) => issue.field).sort()).toEqual(['initialStock', 'purchasePrice', 'wholesalePrice']);
    expect(hasBlockingIssues(issues)).toBe(true);
  });

  it('vender bajo el costo o tener stock con costo 0 solo avisa', () => {
    const issues = findRowIssues([{ ...base, id: 'x', purchasePrice: 9, salePrice: 5 }, { ...base, id: 'y', sku: 'Y', purchasePrice: 0, initialStock: 4 }]);
    expect(issues['x']).toEqual([{ field: 'salePrice', message: 'Vendes por debajo del costo.', level: 'warning' }]);
    expect(issues['y']?.[0]).toMatchObject({ field: 'purchasePrice', level: 'warning' });
    expect(hasBlockingIssues(issues)).toBe(false);
  });
});

describe('pegar desde una hoja de cálculo', () => {
  const rows = syncRows([], combinationsOf([{ ...sizes, values: [...sizes.values, { id: 'l', value: 'L' }] }]), 'HM', ids());

  it('rellena hacia abajo y hacia la derecha desde la celda elegida', () => {
    const pasted = applyPaste(rows, 0, 'purchasePrice', '10\t25\t\t4\n12,5\t30\t35\t6\n');
    expect(pasted.map((r) => [r.purchasePrice, r.salePrice, r.wholesalePrice, r.initialStock])).toEqual([
      [10, 25, null, 4],
      [12.5, 30, 35, 6],
      [0, 0, null, 0],
    ]);
  });

  it('pegar desde la segunda fila no toca la primera, y lo que no cabe se ignora', () => {
    const pasted = applyPaste(rows, 1, 'salePrice', '7\n8\n9\n10');
    expect(pasted.map((r) => r.salePrice)).toEqual([0, 7, 8]);
  });

  it('un SKU pegado se limpia y queda como escrito a mano; un número ilegible no cambia la celda', () => {
    const pasted = applyPaste(rows, 0, 'sku', 'ab 1\t\tabc\t12');
    expect(pasted[0]).toMatchObject({ sku: 'AB1', skuEdited: true, purchasePrice: 0, salePrice: 12 });
  });
});

describe('petición', () => {
  const rows = syncRows([], combinationsOf([sizes]), 'HM', ids()).map((r) => ({ ...r, purchasePrice: 40, salePrice: 90, initialStock: 3 }));

  it('lleva el stock en la sucursal, imágenes por variante y el SKU base en mayúsculas', () => {
    const request = toVariableProductRequest({ name: ' Playera ', baseSku: ' hm ', description: ' ', categoryId: '' }, rows, [{ id: 'img1', url: '' }], 'b1');
    expect(request).toMatchObject({ name: 'Playera', baseSku: 'HM', description: '', categoryId: undefined, imageIds: ['img1'] });
    expect(request.variants[0]).toMatchObject({ sku: 'HM-S', purchasePrice: 40, salePrice: 90, wholesalePrice: null, stocks: [{ branchId: 'b1', quantity: 3 }], attributeValues: [{ attributeValueId: 's' }] });
  });
});
