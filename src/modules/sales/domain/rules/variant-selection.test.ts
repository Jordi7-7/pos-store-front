import { describe, expect, it } from 'vitest';
import { backpack } from '@/test/fixtures/backpack';
import { attributeChoices, preferredVariant, sameCombination, selectOption, UNSPECIFIED_VALUE, type SelectableVariant } from './variant-selection';

const { attributes, variants } = backpack();
/** El elemento buscado, o falla el test si no está (sin usar `!`). */
function must<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('No está lo que el test busca');
  return value;
}
const bySku = (sku: string, list = variants) => must(list.find((variant) => variant.sku === sku));
const labels = (selected: SelectableVariant) =>
  Object.fromEntries(attributeChoices(attributes, variants, selected).map((choice) => [choice.name, choice.options.map((option) => option.label)]));
const pick = (from: string, attribute: string, value: string) => selectOption(attributes, variants, bySku(from), attribute, `${attribute}:${value}`).sku;

describe('elegir una variante por sus atributos', () => {
  it('el primer atributo ofrece todo y los siguientes solo lo que existe con lo anterior', () => {
    expect(labels(bySku('MNEG-1')).Base).toHaveLength(10);
    expect(labels(bySku('MNEG-1'))).toMatchObject({ Cierre: ['Negro'], Copa: ['Negro'] });
    expect(labels(bySku('MNEG-3'))).toMatchObject({ Cierre: ['Negro', 'Rojo'], Copa: ['Rojo'] });
    expect(labels(bySku('MNEG-5'))).toMatchObject({ Cierre: ['Negro', 'Rojo'], Copa: ['Negro'] });
  });

  it('todas las variantes se pueden alcanzar eligiendo sus opciones de arriba abajo, desde cualquier otra', () => {
    for (const start of variants) {
      for (const target of variants) {
        const reached = attributes.reduce((current, attribute) => {
          const { valueId } = must(target.attributeValues.find((option) => option.attributeId === attribute.id));
          return selectOption(attributes, variants, current, attribute.id, valueId);
        }, start);
        expect(reached.sku).toBe(target.sku);
      }
    }
  });

  it('al cambiar un atributo conserva los siguientes si la combinación existe', () => {
    expect(pick('MNEG-1', 'Base', 'Rojo')).toBe('MNEG-3'); // el cierre negro se mantiene
    expect(pick('MNEG-5', 'Base', 'Celeste')).toBe('MNEG-6'); // no hay cierre rojo: toma el que existe
    expect(pick('MNEG-3', 'Cierre', 'Rojo')).toBe('MNEG-5');
  });

  it('si lo anterior ya no vale, prefiere una combinación con stock', () => {
    const noStock = backpack({ 'MNEG-3': 0 });
    const from = bySku('MNEG-2', noStock.variants); // cierre azul: no existe en rojo

    expect(selectOption(noStock.attributes, noStock.variants, from, 'Base', 'Base:Rojo').sku).toBe('MNEG-5');
  });

  it('marca sin stock una opción solo si ninguna de sus variantes tiene', () => {
    const some = backpack({ 'MNEG-3': 0, 'MNEG-2': -2 });
    const [base] = attributeChoices(some.attributes, some.variants, must(some.variants[0]));
    const stockOf = (label: string) => must(base).options.find((option) => option.label === label)?.inStock;

    expect(stockOf('Rojo')).toBe(true); // queda la MNEG-5
    expect(stockOf('Azul Electrico')).toBe(false);
  });

  it('empieza por la primera con stock, o por la primera si ninguna tiene', () => {
    expect(preferredVariant(backpack({ 'MNEG-1': 0 }).variants)?.sku).toBe('MNEG-2');
    expect(preferredVariant([{ id: 'a', stock: 0, attributeValues: [] }, { id: 'b', stock: -1, attributeValues: [] }])?.id).toBe('a');
    expect(preferredVariant([])).toBeUndefined();
  });

  it('una variante sin un atributo se puede elegir como "Sin especificar"', () => {
    const color = [{ id: 'color', name: 'Color', values: [{ id: 'r', value: 'Rojo' }] }];
    const plain = { id: 'plain', stock: 1, attributeValues: [] };
    const red = { id: 'red', stock: 1, attributeValues: [{ attributeId: 'color', valueId: 'r' }] };

    expect(attributeChoices(color, [red, plain], red)[0]?.options.map((option) => option.label)).toEqual(['Rojo', 'Sin especificar']);
    expect(selectOption(color, [red, plain], red, 'color', UNSPECIFIED_VALUE).id).toBe('plain');
  });

  it('dos variantes con la misma combinación quedan juntas para elegirlas por SKU', () => {
    const twin = { ...bySku('MNEG-1'), id: 'gemela', sku: 'MNEG-1B' };
    const all = [...variants, twin];

    expect(sameCombination(attributes, all, bySku('MNEG-1')).map((variant) => variant.id)).toEqual(['v1', 'gemela']);
    expect(sameCombination(attributes, variants, bySku('MNEG-1'))).toHaveLength(1);
  });
});
