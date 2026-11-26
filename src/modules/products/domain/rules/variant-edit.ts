import type { AttributeEntity } from '../entities/catalog.entity';
import type { EditableVariantRow } from './variant-rows';
import { suggestSku } from './variable-wizard';

/** Problemas de una fila del editor, por campo (solo aparecen los campos con problema). */
export type RowIssues = Partial<Record<'sku' | 'purchasePrice' | 'salePrice' | 'wholesalePrice', string>>;

const isNegativeOrInvalid = (value: number | string | null): boolean => value !== null && value !== '' && !(Number(value) >= 0);

/**
 * Problemas de cada fila de la tabla de variantes, por id: SKU vacío o repetido (sin distinguir mayúsculas) y precios
 * negativos o que no son número. Las filas sin problema no aparecen.
 */
export function findRowIssues(rows: readonly EditableVariantRow[]): Record<string, RowIssues> {
  const count = new Map<string, number>();
  for (const row of rows) {
    const key = row.sku.trim().toUpperCase();
    if (key) count.set(key, (count.get(key) ?? 0) + 1);
  }
  const result: Record<string, RowIssues> = {};
  for (const row of rows) {
    const issues: RowIssues = {};
    const key = row.sku.trim().toUpperCase();
    if (!key) issues.sku = 'Escribe un SKU.';
    else if ((count.get(key) ?? 0) > 1) issues.sku = 'Este SKU está repetido.';
    if (isNegativeOrInvalid(row.purchasePrice) || row.purchasePrice === '') issues.purchasePrice = 'Debe ser 0 o más.';
    if (isNegativeOrInvalid(row.salePrice) || row.salePrice === '') issues.salePrice = 'Debe ser 0 o más.';
    if (isNegativeOrInvalid(row.wholesalePrice)) issues.wholesalePrice = 'Debe ser 0 o más.';
    if (Object.keys(issues).length > 0) result[row.id] = issues;
  }
  return result;
}

/** Resumen en una frase de los problemas de las filas, para avisar al guardar; `null` si no hay. */
export function summarizeRowIssues(rows: readonly EditableVariantRow[], issues: Record<string, RowIssues>): string | null {
  const bad = rows.filter((row) => issues[row.id]);
  const first = bad[0];
  if (!first) return null;
  const detail = Object.values(issues[first.id] ?? {})[0] ?? '';
  return bad.length === 1 ? `Corrige la variante "${first.sku || first.combinationText}": ${detail}` : `Corrige ${bad.length} variantes con problemas (por ejemplo "${first.sku || first.combinationText}": ${detail})`;
}

/** Una variante que ya tiene el producto, con los ids de las opciones que combina. */
export interface ExistingVariant {
  sku: string;
  valueIds: readonly string[];
  /** `Talla: M · Color: Rojo` */
  label: string;
}

export interface NewVariantDraft {
  /** attributeId → valueId elegido ('' si no ha elegido). */
  selected: Readonly<Record<string, string>>;
  sku: string;
  purchasePrice: string;
  salePrice: string;
  wholesalePrice: string;
  stock: string;
}

export type NewVariantIssues = Partial<Record<'combination' | 'sku' | 'purchasePrice' | 'salePrice' | 'wholesalePrice' | 'stock', string>>;

/**
 * Problemas del formulario de variante nueva: faltan atributos por elegir (el backend exige los mismos atributos que el resto
 * de variantes), la combinación ya existe, el SKU está vacío o repetido y los números son negativos.
 */
export function findNewVariantIssues(draft: NewVariantDraft, attributes: readonly AttributeEntity[], existing: readonly ExistingVariant[]): NewVariantIssues {
  const issues: NewVariantIssues = {};
  const missing = attributes.filter((attribute) => !draft.selected[attribute.id]);
  if (attributes.length > 0 && missing.length > 0) {
    issues.combination = `Elige ${missing.map((attribute) => attribute.name).join(' y ')}.`;
  } else {
    const chosen = attributes.map((attribute) => draft.selected[attribute.id]).filter((id): id is string => Boolean(id));
    const clash = existing.find((variant) => chosen.length > 0 && variant.valueIds.length === chosen.length && chosen.every((id) => variant.valueIds.includes(id)));
    if (clash) issues.combination = `Ya existe esa combinación (${clash.sku}).`;
  }
  const sku = draft.sku.trim().toUpperCase();
  if (!sku) issues.sku = 'Escribe un SKU.';
  else if (existing.some((variant) => variant.sku.trim().toUpperCase() === sku)) issues.sku = 'Ese SKU ya lo usa otra variante del producto.';
  if (!(Number(draft.purchasePrice || 0) >= 0)) issues.purchasePrice = 'Debe ser 0 o más.';
  if (!(Number(draft.salePrice || 0) >= 0)) issues.salePrice = 'Debe ser 0 o más.';
  if (draft.wholesalePrice !== '' && !(Number(draft.wholesalePrice) >= 0)) issues.wholesalePrice = 'Debe ser 0 o más.';
  if (!(Number(draft.stock || 0) >= 0)) issues.stock = 'Debe ser 0 o más.';
  return issues;
}

/**
 * SKU propuesto para la variante nueva a partir del SKU base y las opciones elegidas (`PLY-NEGRO-M`); si ya lo usa otra
 * variante le añade `-2`, `-3`… Devuelve `null` si no hay SKU base ni opciones elegidas (entonces se queda la propuesta genérica).
 */
export function suggestSkuForNewVariant(baseSku: string, valueNames: readonly string[], usedSkus: readonly string[]): string | null {
  const sku = suggestSku(baseSku, valueNames.map((valueName) => ({ attributeId: '', attributeName: '', valueId: '', valueName })));
  if (!sku || valueNames.length === 0) return null;
  const used = new Set(usedSkus.map((value) => value.trim().toUpperCase()));
  let candidate = sku;
  for (let n = 2; used.has(candidate.toUpperCase()); n++) candidate = `${sku}-${n}`;
  return candidate;
}
