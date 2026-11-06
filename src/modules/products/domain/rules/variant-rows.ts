import type { ProductVariantEntity } from '../entities/product.entity';

/** Una fila de la tabla de variantes del editor: lo que se edita antes de guardar. */
export interface EditableVariantRow {
  id: string;
  sku: string;
  barcode: string;
  purchasePrice: number | string;
  salePrice: number | string;
  wholesalePrice: number | string | null;
  /** `Talla: M · Color: Rojo` */
  combinationText: string;
  images?: { id: string; url: string; description?: string }[];
  imageIds?: string[];
  hasChanged?: boolean;
}

export const toEditableRow = (variant: ProductVariantEntity): EditableVariantRow => ({
  id: variant.id,
  sku: variant.sku || '',
  barcode: variant.barcode || '',
  purchasePrice: Number(variant.purchasePrice) || 0,
  salePrice: Number(variant.salePrice) || 0,
  wholesalePrice: variant.wholesalePrice !== null && variant.wholesalePrice !== undefined ? Number(variant.wholesalePrice) : null,
  combinationText: variant.attributes.map((attribute) => `${attribute.name || 'Atributo'}: ${attribute.value}`).join(' · ') || 'Variante',
  images: variant.images.map((image) => ({ id: image.id, url: image.url || '', description: image.description })),
  imageIds: variant.images.map((image) => image.id),
  hasChanged: false,
});

/**
 * Filas tras recargar el producto del servidor: conserva lo que el usuario ya editó (y aún no guardó)
 * en las variantes que siguen existiendo, añade las nuevas y quita las que ya no existen.
 */
export function mergeEditableRows(current: EditableVariantRow[], fromServer: EditableVariantRow[]): EditableVariantRow[] {
  const byId = new Map(current.map((row) => [row.id, row]));
  return fromServer.map((serverRow) => byId.get(serverRow.id) ?? serverRow);
}

export interface BulkPrices {
  purchasePrice: string;
  salePrice: string;
  wholesalePrice: string;
}

/** Aplica los precios escritos a todas las filas; un campo vacío deja el precio de cada fila como estaba. */
export function applyBulkPrices(rows: EditableVariantRow[], prices: BulkPrices): EditableVariantRow[] {
  return rows.map((row) => ({
    ...row,
    purchasePrice: prices.purchasePrice !== '' ? Number(prices.purchasePrice) : row.purchasePrice,
    salePrice: prices.salePrice !== '' ? Number(prices.salePrice) : row.salePrice,
    wholesalePrice: prices.wholesalePrice !== '' ? Number(prices.wholesalePrice) : row.wholesalePrice,
    hasChanged: true,
  }));
}

export type RowsValidation = { ok: true } | { ok: false; message: string };

/** Todos los SKU deben existir y no repetirse entre las variantes (sin distinguir mayúsculas). */
export function validateRowsForSave(rows: EditableVariantRow[]): RowsValidation {
  const seen = new Set<string>();
  for (const row of rows) {
    if (!row.sku.trim()) return { ok: false, message: 'Todos los SKUs deben ser válidos y no estar vacíos.' };
    const key = row.sku.trim().toUpperCase();
    if (seen.has(key)) return { ok: false, message: `El SKU "${row.sku}" está repetido entre las variantes.` };
    seen.add(key);
  }
  return { ok: true };
}

/** Lo que se envía al servidor para actualizar una variante. */
export interface VariantUpdate {
  sku: string;
  barcode?: string;
  purchasePrice: number;
  salePrice: number;
  wholesalePrice: number | null;
  imageIds: string[];
}

export const toVariantUpdate = (row: EditableVariantRow): VariantUpdate => ({
  sku: row.sku.trim(),
  barcode: row.barcode.trim() || undefined,
  purchasePrice: Number(row.purchasePrice) || 0,
  salePrice: Number(row.salePrice) || 0,
  wholesalePrice: row.wholesalePrice !== null && row.wholesalePrice !== undefined ? Number(row.wholesalePrice) : null,
  imageIds: row.images ? row.images.map((image) => image.id) : row.imageIds || [],
});
