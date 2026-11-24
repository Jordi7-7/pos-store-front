import { describe, expect, it } from 'vitest';
import { addCountLine, countBlocker, countDifference, countSummary, mergeSheetItems, removeCountLine, removeUncountedLines, toCountLines, updateCountLine, type SheetItem, type CountFormLine, type NewCountLine } from './stock-count-lines';

const product = (variantId: string, expected = 5): NewCountLine => ({ variantId, sku: variantId.toUpperCase(), productName: `Producto ${variantId}`, expected, referenceCost: 4 });
const line = (variantId: string, expected: number, counted: number | undefined, extra: Partial<CountFormLine> = {}): CountFormLine => ({ ...product(variantId, expected), counted, ...extra });

describe('líneas del conteo físico', () => {
  it('agregar un producto que ya está no lo duplica y avisa de que no se agregó', () => {
    const first = addCountLine([], product('a'));
    const again = addCountLine(first.lines, product('a'));

    expect(first.added).toBe(true);
    expect(again.added).toBe(false);
    expect(again.lines).toHaveLength(1);
  });

  it('una línea nueva empieza sin lo contado, para obligar a escribirlo', () => {
    expect(addCountLine([], product('a')).lines[0]?.counted).toBeUndefined();
  });

  it('la diferencia es lo contado menos lo que decía el sistema, y es nula mientras no se cuenta', () => {
    expect(countDifference(line('a', 12, 10))).toBe(-2);
    expect(countDifference(line('a', 5, 7))).toBe(2);
    expect(countDifference(line('a', -2, 3))).toBe(5);
    expect(countDifference(line('a', 5, 5))).toBe(0);
    expect(countDifference(line('a', 5, undefined))).toBeNull();
    expect(countDifference(line('a', 5, NaN))).toBeNull();
  });

  it('las diferencias decimales son exactas', () => {
    expect(countDifference(line('a', 0.1, 0.3))).toBe(0.2);
  });

  it('resume cuántas unidades sobran, cuántas faltan y cuántos productos coinciden', () => {
    const lines = [line('a', 12, 10), line('b', 5, 7), line('c', 3, 3), line('d', 4, 1), line('e', 9, undefined)];

    expect(countSummary(lines)).toEqual({ counted: 4, pending: 1, surplus: 2, shortage: 5, matching: 1 });
  });

  it('actualiza y quita solo la línea indicada', () => {
    const lines = [line('a', 1, undefined), line('b', 1, undefined)];

    expect(updateCountLine(lines, 'b', { counted: 3 }).map((l) => l.counted)).toEqual([undefined, 3]);
    expect(removeCountLine(lines, 'a').map((l) => l.variantId)).toEqual(['b']);
  });

  it('dice por qué no se puede confirmar', () => {
    expect(countBlocker([])).toBe('Agrega al menos un producto.');
    expect(countBlocker([line('a', 5, undefined)])).toBe('Escribe lo contado de al menos un producto.');
    expect(countBlocker([line('a', 5, -1)])).toBe('Lo contado no puede ser negativo.');
    expect(countBlocker([line('a', 5, 7, { unitCost: -1 })])).toBe('El costo no puede ser negativo.');
    expect(countBlocker([line('a', 5, 5), line('b', 2, 2)])).toBe('Lo contado coincide con el sistema: no hay nada que ajustar.');
    expect(countBlocker(Array.from({ length: 201 }, (_, i) => line(`v${i}`, 1, 2)))).toContain('200');
    expect(countBlocker([line('a', 5, 3)])).toBeNull();
  });

  it('los productos sin contar no bloquean ni se envían: solo cuentan los que tienen cantidad', () => {
    const lines = [line('a', 5, 3), line('b', 8, undefined), line('c', 2, 2)];

    expect(countBlocker(lines)).toBeNull();
    expect(toCountLines(lines).map((l) => l.variantId)).toEqual(['a', 'c']);
    expect(removeUncountedLines(lines).map((l) => l.variantId)).toEqual(['a', 'c']);
  });

  it('el costo solo viaja cuando sobra mercancía y se escribió', () => {
    const lines = [line('a', 5, 7, { unitCost: 3.5 }), line('b', 5, 3, { unitCost: 9 }), line('c', 0, 2)];

    expect(toCountLines(lines)).toEqual([
      { variantId: 'a', counted: 7, expected: 5, unitCost: 3.5 },
      { variantId: 'b', counted: 3, expected: 5 },
      { variantId: 'c', counted: 2, expected: 0 },
    ]);
  });
});

const sheetItem = (variantId: string, stock = 5): SheetItem => ({ variantId, sku: variantId.toUpperCase(), productName: `Producto ${variantId}`, stock, purchasePrice: 3 });

describe('cargar productos de la lista de la sucursal', () => {
  it('agrega los que faltan con lo que dice el sistema como esperado y sin contar', () => {
    const merged = mergeSheetItems([], [sheetItem('a', 12), sheetItem('b', -2)]);

    expect(merged).toMatchObject({ added: 2, skipped: 0, full: false });
    expect(merged.lines.map((l) => [l.variantId, l.expected, l.counted, l.referenceCost])).toEqual([['a', 12, undefined, 3], ['b', -2, undefined, 3]]);
  });

  it('los que ya estaban no se duplican ni pierden lo contado', () => {
    const merged = mergeSheetItems([line('a', 5, 7)], [sheetItem('a', 99), sheetItem('b')]);

    expect(merged).toMatchObject({ added: 1, skipped: 1 });
    expect(merged.lines[0]).toMatchObject({ variantId: 'a', expected: 5, counted: 7 });
  });

  it('no pasa del tope de 200 líneas y avisa de que quedaron productos sin agregar', () => {
    const existing = Array.from({ length: 199 }, (_, i) => line(`e${i}`, 1, undefined));
    const merged = mergeSheetItems(existing, [sheetItem('x'), sheetItem('y'), sheetItem('z')]);

    expect(merged.lines).toHaveLength(200);
    expect(merged).toMatchObject({ added: 1, full: true });
  });

  it('con el tope ya lleno no agrega nada', () => {
    const existing = Array.from({ length: 200 }, (_, i) => line(`e${i}`, 1, undefined));

    expect(mergeSheetItems(existing, [sheetItem('x')])).toMatchObject({ added: 0, full: true });
  });
});

