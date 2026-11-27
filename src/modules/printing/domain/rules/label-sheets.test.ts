import { describe, expect, it } from 'vitest';
import type { LabelItem } from '../entities/label';
import { buildSheets, codesPerLabel, countLabels, splitIntoBatches } from './label-sheets';

const item = (sku: string, quantity: number): LabelItem => ({ sku, name: sku, price: 1, quantity });
const shape = (sheets: ReturnType<typeof buildSheets>) => sheets.map((sheet) => `${sheet.items.map((i) => i.sku).join('+')} x${sheet.copies}`);

describe('reparto de códigos en etiquetas', () => {
  it('solo el modo «código de barras» permite dos por etiqueta', () => {
    expect(codesPerLabel({ content: 'BARCODE', twoPerLabel: true })).toBe(2);
    expect(codesPerLabel({ content: 'BARCODE', twoPerLabel: false })).toBe(1);
    expect(codesPerLabel({ content: 'FULL', twoPerLabel: true })).toBe(1);
  });

  it('de uno en uno: una etiqueta por producto con sus copias', () => {
    expect(shape(buildSheets([item('A', 3), item('B', 1)], 1))).toEqual(['A x3', 'B x1']);
  });

  it('de dos en dos: la mitad que sobra se completa con el siguiente producto', () => {
    const sheets = buildSheets([item('A', 5), item('B', 3)], 2);
    expect(shape(sheets)).toEqual(['A+A x2', 'A+B x1', 'B+B x1']);
    expect(countLabels(sheets)).toBe(4);
  });

  it('con un total impar solo la última etiqueta queda con una mitad vacía', () => {
    expect(shape(buildSheets([item('A', 1), item('B', 1), item('C', 1)], 2))).toEqual(['A+B x1', 'C x1']);
  });

  it('no se pierde ni se repite ningún código', () => {
    const queue = [item('A', 7), item('B', 2), item('C', 1), item('D', 4)];
    const printed = new Map<string, number>();
    for (const sheet of buildSheets(queue, 2)) for (const i of sheet.items) printed.set(i.sku, (printed.get(i.sku) ?? 0) + sheet.copies);
    expect(Object.fromEntries(printed)).toEqual({ A: 7, B: 2, C: 1, D: 4 });
  });

  it('una cantidad vacía o fraccionaria cuenta como un entero de al menos uno', () => {
    expect(countLabels(buildSheets([item('A', 0), item('B', 2.9)], 1))).toBe(3);
  });
});

describe('tandas de envío', () => {
  const shapes = (queue: LabelItem[], size: number) => splitIntoBatches(buildSheets(queue, 1), size).map(shape);

  it('ninguna tanda pasa del tamaño, y las copias de un producto se reparten', () => {
    expect(shapes([item('A', 3), item('B', 6), item('C', 1)], 4)).toEqual([['A x3', 'B x1'], ['B x4'], ['B x1', 'C x1']]);
  });

  it('no se pierde ni se repite ninguna etiqueta', () => {
    const batches = splitIntoBatches(buildSheets([item('A', 81)], 1), 8);
    expect(batches).toHaveLength(11);
    expect(batches.reduce((total, batch) => total + countLabels(batch), 0)).toBe(81);
    expect(Math.max(...batches.map(countLabels))).toBe(8);
  });

  it('sin etiquetas no hay tandas', () => {
    expect(splitIntoBatches([], 8)).toEqual([]);
  });
});
