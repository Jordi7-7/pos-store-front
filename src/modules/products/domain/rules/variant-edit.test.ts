import { describe, expect, it } from 'vitest';
import type { AttributeEntity } from '../entities/catalog.entity';
import { findNewVariantIssues, findRowIssues, suggestSkuForNewVariant, summarizeRowIssues, type ExistingVariant, type NewVariantDraft } from './variant-edit';
import type { EditableVariantRow } from './variant-rows';

const row = (overrides: Partial<EditableVariantRow> = {}): EditableVariantRow => ({
  id: 'a', sku: 'PLY-S', barcode: '', purchasePrice: 50, salePrice: 100, wholesalePrice: null, combinationText: 'Talla: S', ...overrides,
});

const attr = (id: string, name: string, values: string[]): AttributeEntity => ({ id, name, values: values.map((value) => ({ id: `${id}-${value}`, value })) }) as AttributeEntity;
const talla = attr('t', 'Talla', ['S', 'M', 'L']);
const color = attr('c', 'Color', ['Rojo', 'Azul']);
const existing: ExistingVariant[] = [{ sku: 'PLY-S-ROJO', valueIds: ['t-S', 'c-Rojo'], label: 'Talla: S · Color: Rojo' }];
const draft = (overrides: Partial<NewVariantDraft> = {}): NewVariantDraft => ({ selected: { t: 't-M', c: 'c-Rojo' }, sku: 'PLY-M-ROJO', purchasePrice: '50', salePrice: '100', wholesalePrice: '', stock: '0', ...overrides });

describe('problemas de las filas del editor', () => {
  it('marca SKU vacío, SKU repetido sin distinguir mayúsculas y precios negativos; las filas bien no aparecen', () => {
    const issues = findRowIssues([row({ id: 'a', sku: 'ply-s' }), row({ id: 'b', sku: 'PLY-S' }), row({ id: 'c', sku: ' ' }), row({ id: 'd', sku: 'OK', salePrice: -1, wholesalePrice: -5 }), row({ id: 'e', sku: 'FINE' })]);
    expect(issues.a?.sku).toMatch(/repetido/);
    expect(issues.b?.sku).toMatch(/repetido/);
    expect(issues.c?.sku).toMatch(/Escribe/);
    expect(issues.d).toMatchObject({ salePrice: expect.any(String), wholesalePrice: expect.any(String) });
    expect(issues.d?.sku).toBeUndefined();
    expect(issues.e).toBeUndefined();
  });

  it('un precio vacío o que no es número es un problema; el mayoreo vacío (null) no', () => {
    expect(findRowIssues([row({ salePrice: '' })]).a?.salePrice).toBeDefined();
    expect(findRowIssues([row({ purchasePrice: 'abc' })]).a?.purchasePrice).toBeDefined();
    expect(findRowIssues([row({ wholesalePrice: null })]).a).toBeUndefined();
  });

  it('el resumen nombra la variante y el problema, o cuenta cuántas hay', () => {
    const one = [row({ sku: 'X', salePrice: -1 })];
    expect(summarizeRowIssues(one, findRowIssues(one))).toMatch(/"X".*0 o más/);
    const two = [row({ id: 'a', sku: 'Z', salePrice: -1 }), row({ id: 'b', sku: 'Y', salePrice: -1 })];
    expect(summarizeRowIssues(two, findRowIssues(two))).toMatch(/2 variantes/);
    expect(summarizeRowIssues([row()], {})).toBeNull();
  });
});

describe('variante nueva de un producto', () => {
  it('un formulario correcto no tiene problemas', () => {
    expect(findNewVariantIssues(draft(), [talla, color], existing)).toEqual({});
  });

  it('pide todos los atributos del producto (el backend los exige iguales en todas las variantes)', () => {
    expect(findNewVariantIssues(draft({ selected: { t: 't-M' } }), [talla, color], existing).combination).toBe('Elige Color.');
    expect(findNewVariantIssues(draft({ selected: {} }), [talla, color], existing).combination).toBe('Elige Talla y Color.');
  });

  it('rechaza una combinación que el producto ya tiene y dice con qué SKU', () => {
    expect(findNewVariantIssues(draft({ selected: { t: 't-S', c: 'c-Rojo' }, sku: 'OTRO' }), [talla, color], existing).combination).toMatch(/PLY-S-ROJO/);
  });

  it('SKU vacío o ya usado, y números negativos', () => {
    expect(findNewVariantIssues(draft({ sku: '' }), [talla, color], existing).sku).toBeDefined();
    expect(findNewVariantIssues(draft({ sku: 'ply-s-rojo' }), [talla, color], existing).sku).toMatch(/ya lo usa/);
    const issues = findNewVariantIssues(draft({ purchasePrice: '-1', salePrice: '-2', wholesalePrice: '-3', stock: '-4' }), [talla, color], existing);
    expect(Object.keys(issues).sort()).toEqual(['purchasePrice', 'salePrice', 'stock', 'wholesalePrice']);
  });

  it('el SKU sugerido une el SKU base y las opciones, y evita los que ya existen', () => {
    expect(suggestSkuForNewVariant('PLY', ['M', 'Rojo'], [])).toBe('PLY-M-ROJO');
    expect(suggestSkuForNewVariant('PLY', ['M', 'Rojo'], ['ply-m-rojo'])).toBe('PLY-M-ROJO-2');
    expect(suggestSkuForNewVariant('PLY', [], [])).toBeNull();
    expect(suggestSkuForNewVariant('', ['M'], [])).toBe('M');
  });
});
