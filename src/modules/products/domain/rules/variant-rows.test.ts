import { describe, expect, it } from 'vitest';
import type { ProductVariantEntity } from '../entities/product.entity';
import { applyBulkPrices, mergeEditableRows, toEditableRow, toVariantUpdate, validateRowsForSave, type EditableVariantRow, normalizeSkuInput, splitVariantSku } from './variant-rows';

const row = (overrides: Partial<EditableVariantRow> = {}): EditableVariantRow => ({
  id: 'v1', sku: 'A-1', barcode: '', purchasePrice: 50, salePrice: 100, wholesalePrice: null, combinationText: 'Talla: S', hasChanged: false, ...overrides,
});

describe('filas de variantes del editor', () => {
  it('una variante del servidor se convierte en fila con su combinación (o "Variante" si no tiene atributos)', () => {
    const variant = { id: 'v', sku: 'A-1', barcode: '', purchasePrice: 50, salePrice: 100, wholesalePrice: 80, images: [{ id: 'i', url: 'u' }], attributes: [{ name: 'Talla', value: 'M' }, { name: 'Color', value: 'Rojo' }], stocks: [], tags: [], totalStock: 0, primaryImageUrl: '' } as ProductVariantEntity;
    expect(toEditableRow(variant)).toMatchObject({ combinationText: 'Talla: M · Color: Rojo', wholesalePrice: 80, imageIds: ['i'], hasChanged: false });
    expect(toEditableRow({ ...variant, attributes: [] }).combinationText).toBe('Variante');
  });

  it('al recargar el producto se conservan las ediciones sin guardar, se añaden las nuevas y se quitan las borradas', () => {
    const current = [row({ id: 'a', salePrice: 150, hasChanged: true }), row({ id: 'b' })];
    const fromServer = [row({ id: 'a', salePrice: 100 }), row({ id: 'c', sku: 'A-3' })];
    const merged = mergeEditableRows(current, fromServer);
    expect(merged.map((r) => r.id)).toEqual(['a', 'c']);
    expect(merged[0]).toMatchObject({ salePrice: 150, hasChanged: true }); // la edición pendiente sobrevive
  });

  it('asignación masiva: los campos vacíos no tocan el precio de cada fila', () => {
    const rows = applyBulkPrices([row({ id: 'a' }), row({ id: 'b', purchasePrice: 70 })], { purchasePrice: '', salePrice: '120', wholesalePrice: '90' });
    expect(rows.map((r) => [r.purchasePrice, r.salePrice, r.wholesalePrice, r.hasChanged])).toEqual([[50, 120, 90, true], [70, 120, 90, true]]);
  });

  it('valida SKU vacíos y repetidos (sin distinguir mayúsculas)', () => {
    expect(validateRowsForSave([row(), row({ id: 'b', sku: 'A-2' })])).toEqual({ ok: true });
    expect(validateRowsForSave([row({ sku: '  ' })])).toMatchObject({ ok: false, message: expect.stringMatching(/vacíos/) });
    expect(validateRowsForSave([row({ sku: 'a-1' }), row({ id: 'b', sku: 'A-1' })])).toMatchObject({ ok: false, message: expect.stringMatching(/repetido/) });
  });

  it('la actualización envía números, el código de barras vacío como ausente y los ids de sus fotos', () => {
    expect(toVariantUpdate(row({ sku: ' A-1 ', salePrice: '150', barcode: ' ', images: [{ id: 'i', url: 'u' }] }))).toEqual({
      sku: 'A-1', barcode: undefined, purchasePrice: 50, salePrice: 150, wholesalePrice: null, imageIds: ['i'],
    });
  });
});

describe('SKU de una variante en el editor', () => {
  it('normaliza lo que se escribe', () => {
    expect(normalizeSkuInput('ab 1_c-d!')).toBe('AB1_C-D');
  });

  it('separa el prefijo del SKU base y el sufijo editable', () => {
    expect(splitVariantSku('HM-1', 'HM', 'HM')).toEqual({ prefix: 'HM', suffix: '1' });
    expect(splitVariantSku('HM-A-2', 'HM', 'HM')).toEqual({ prefix: 'HM', suffix: 'A-2' });
  });

  it('si el SKU base cambió en la ficha, quita el prefijo viejo y propone el nuevo', () => {
    expect(splitVariantSku('OLD-3', 'NEW', 'OLD')).toEqual({ prefix: 'NEW', suffix: '3' });
  });

  it('sin SKU base no hay prefijo; con un SKU ajeno toma lo que va tras el primer guion', () => {
    expect(splitVariantSku('X-9', '', '')).toEqual({ prefix: '', suffix: 'X-9' });
    expect(splitVariantSku('ZZ-5', 'HM', 'HM')).toEqual({ prefix: 'HM', suffix: '5' });
    expect(splitVariantSku('SINGUION', 'HM', 'HM')).toEqual({ prefix: 'HM', suffix: 'SINGUION' });
  });
});
