/** Reglas del asistente de producto compuesto: combinaciones de atributos, filas de variantes y petición final. Sin pantalla ni estado. */

export interface WizardImage {
  id: string;
  url: string;
  description?: string;
}

export interface Combination {
  attributeId: string;
  attributeName: string;
  valueId: string;
  valueName: string;
}

export interface WizardVariantRow {
  id: string;
  sku: string;
  barcode: string;
  purchasePrice: number;
  salePrice: number;
  wholesalePrice: number | null;
  initialStock: number;
  combination: Combination[];
  images?: WizardImage[];
  imageIds?: string[];
  /** El SKU lo escribió o pegó la persona: ya no se recalcula al cambiar el SKU base ni los valores. */
  skuEdited?: boolean;
}

/** Atributos que se combinan en un producto (más de 4 ya no es manejable: 4 atributos de 5 valores son 625 variantes). */
export const MAX_ATTRIBUTES_PER_PRODUCT = 4;
/** Tope de variantes de un producto (el backend rechaza más). */
export const MAX_VARIANTS = 500;
/** A partir de aquí se avisa de que la tabla será larga. */
export const WARN_VARIANTS = 100;

/** Valores escritos en el panel "aplicar a todas" (texto tal como se teclea; vacío = no tocar). */
export interface BulkValues {
  purchasePrice: string;
  salePrice: string;
  wholesalePrice: string;
  stock: string;
}

/** Atributo elegido con los valores marcados, listo para combinar. */
export interface AttributeChoice {
  attributeId: string;
  attributeName: string;
  values: Array<{ id: string; value: string }>;
}

export type SelectedValues = Record<string, string[]>;

const cleanSku = (text: string) => text.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');

/** Marca o desmarca un valor; un atributo sin valores marcados desaparece de la selección. */
export function toggleAttributeValue(selected: SelectedValues, attributeId: string, valueId: string): SelectedValues {
  const current = selected[attributeId] ?? [];
  const updated = current.includes(valueId) ? current.filter((id) => id !== valueId) : [...current, valueId];
  if (updated.length > 0) return { ...selected, [attributeId]: updated };
  const { [attributeId]: _removed, ...rest } = selected;
  return rest;
}

/** Todas las combinaciones posibles de un valor por atributo (producto cartesiano). */
export function combinationsOf(choices: AttributeChoice[]): Combination[][] {
  return choices.reduce<Combination[][]>(
    (acc, choice) => acc.flatMap((done) => choice.values.map((value) => [...done, { attributeId: choice.attributeId, attributeName: choice.attributeName, valueId: value.id, valueName: value.value }])),
    [[]],
  );
}

/** SKU base sugerido a partir del nombre: las primeras letras y números (sin acentos ni símbolos). */
export function suggestBaseSku(productName: string): string {
  return productName.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

/** Atributos con los valores marcados, en el orden del catálogo (no en el orden en que se fueron marcando). */
export function choicesFrom(selected: SelectedValues, attributes: ReadonlyArray<{ id: string; name: string; values?: ReadonlyArray<{ id: string; value: string }> }>): AttributeChoice[] {
  return attributes
    .filter((attribute) => (selected[attribute.id] ?? []).length > 0)
    .map((attribute) => ({
      attributeId: attribute.id,
      attributeName: attribute.name,
      values: (attribute.values ?? []).filter((value) => (selected[attribute.id] ?? []).includes(value.id)),
    }))
    .filter((choice) => choice.values.length > 0);
}

/** Cuántas variantes saldrían: el producto de los valores marcados por atributo (0 si no hay ninguno). */
export function countCombinations(choices: readonly AttributeChoice[]): number {
  return choices.length === 0 ? 0 : choices.reduce((total, choice) => total * choice.values.length, 1);
}

/** Identifica una combinación sin depender del orden: sirve para reconocer una fila ya existente. */
export function combinationKey(combination: readonly Combination[]): string {
  return combination.map((item) => item.valueId).sort().join(',');
}

/** SKU sugerido de una variante: el base y sus valores, p. ej. `PLY-NEGRO-M`. */
export function suggestSku(baseSku: string, combination: readonly Combination[]): string {
  return [cleanSku(baseSku), ...combination.map((item) => cleanSku(item.valueName))].filter(Boolean).join('-');
}

/** Si el SKU ya se usó, le añade `-2`, `-3`… hasta que sea único (sin distinguir mayúsculas). */
function uniqueSku(sku: string, used: Set<string>): string {
  let candidate = sku;
  for (let n = 2; used.has(candidate.toUpperCase()); n++) candidate = `${sku}-${n}`;
  return candidate;
}

/**
 * Pone la tabla al día con las combinaciones elegidas SIN perder lo escrito: las filas que ya existían se conservan (con su
 * precio, stock, fotos y SKU editado), las nuevas nacen con los precios de la primera fila, y las que ya no corresponden salen.
 * Los SKU que nadie ha tocado se recalculan a partir del SKU base y los valores.
 */
export function syncRows(previous: readonly WizardVariantRow[], combinations: readonly (readonly Combination[])[], baseSku: string, newId: () => string): WizardVariantRow[] {
  const byKey = new Map(previous.map((row) => [combinationKey(row.combination), row]));
  const template = previous[0];
  const used = new Set<string>();

  // Primero se reservan los SKU escritos a mano, para que los sugeridos nunca los pisen
  for (const combination of combinations) {
    const existing = byKey.get(combinationKey(combination));
    if (existing?.skuEdited) used.add(existing.sku.trim().toUpperCase());
  }

  return combinations.map((combination) => {
    const existing = byKey.get(combinationKey(combination));
    if (existing?.skuEdited) return { ...existing, combination: [...combination] };
    const sku = uniqueSku(suggestSku(baseSku, combination), used);
    used.add(sku.toUpperCase());
    if (existing) return { ...existing, combination: [...combination], sku };
    return {
      id: newId(),
      sku,
      barcode: '',
      purchasePrice: template?.purchasePrice ?? 0,
      salePrice: template?.salePrice ?? 0,
      wholesalePrice: template?.wholesalePrice ?? null,
      initialStock: 0,
      combination: [...combination],
    };
  });
}

const numberOrZero = (text: string) => (text ? Number(text) : 0);

/** Aplica el panel en bloque: cada valor escrito sustituye al de todas las filas; los vacíos no tocan nada. */
export function applyBulkValues(rows: WizardVariantRow[], bulk: BulkValues): WizardVariantRow[] {
  return rows.map((row) => ({
    ...row,
    purchasePrice: bulk.purchasePrice !== '' ? numberOrZero(bulk.purchasePrice) : row.purchasePrice,
    salePrice: bulk.salePrice !== '' ? numberOrZero(bulk.salePrice) : row.salePrice,
    wholesalePrice: bulk.wholesalePrice !== '' ? numberOrZero(bulk.wholesalePrice) : row.wholesalePrice,
    initialStock: bulk.stock !== '' ? numberOrZero(bulk.stock) : row.initialStock,
  }));
}

export type RowField = 'sku' | 'purchasePrice' | 'salePrice' | 'wholesalePrice' | 'initialStock';

export interface RowIssue {
  field: RowField;
  message: string;
  /** `error` impide guardar; `warning` solo avisa. */
  level: 'error' | 'warning';
}

/** Problemas de cada fila, por id de fila. Una fila sin problemas no aparece. */
export function findRowIssues(rows: readonly WizardVariantRow[]): Record<string, RowIssue[]> {
  const issues: Record<string, RowIssue[]> = {};
  const add = (rowId: string, issue: RowIssue) => {
    (issues[rowId] ??= []).push(issue);
  };

  const countBySku = new Map<string, number>();
  for (const row of rows) {
    const sku = row.sku.trim().toUpperCase();
    if (sku) countBySku.set(sku, (countBySku.get(sku) ?? 0) + 1);
  }

  for (const row of rows) {
    const sku = row.sku.trim().toUpperCase();
    if (!sku) add(row.id, { field: 'sku', message: 'Falta el SKU.', level: 'error' });
    else if ((countBySku.get(sku) ?? 0) > 1) add(row.id, { field: 'sku', message: 'Este SKU está repetido en la lista.', level: 'error' });

    if (row.purchasePrice < 0) add(row.id, { field: 'purchasePrice', message: 'El precio de compra no puede ser negativo.', level: 'error' });
    if (row.salePrice < 0) add(row.id, { field: 'salePrice', message: 'El precio de venta no puede ser negativo.', level: 'error' });
    else if (row.salePrice === 0) add(row.id, { field: 'salePrice', message: 'Falta el precio de venta.', level: 'error' });
    if (row.wholesalePrice !== null && row.wholesalePrice < 0) add(row.id, { field: 'wholesalePrice', message: 'El precio de mayoreo no puede ser negativo.', level: 'error' });
    if (row.initialStock < 0) add(row.id, { field: 'initialStock', message: 'El stock inicial no puede ser negativo.', level: 'error' });

    if (row.salePrice > 0 && row.purchasePrice > 0 && row.salePrice < row.purchasePrice) {
      add(row.id, { field: 'salePrice', message: 'Vendes por debajo del costo.', level: 'warning' });
    }
    if (row.initialStock > 0 && row.purchasePrice === 0) {
      add(row.id, { field: 'purchasePrice', message: 'Con costo 0 este stock se valora en 0 en el inventario.', level: 'warning' });
    }
  }
  return issues;
}

export const hasBlockingIssues = (issues: Record<string, RowIssue[]>): boolean => Object.values(issues).some((list) => list.some((issue) => issue.level === 'error'));

/** Columnas editables de la tabla, en el orden en que se pegan desde una hoja de cálculo. */
export const PASTE_COLUMNS = ['sku', 'barcode', 'purchasePrice', 'salePrice', 'wholesalePrice', 'initialStock'] as const;
export type PasteColumn = (typeof PASTE_COLUMNS)[number];

/** Número tal como se copia de una hoja de cálculo (admite coma decimal); `null` si no lo es. */
function parseNumber(text: string): number | null {
  const normalized = text.trim().replace(',', '.');
  if (normalized === '') return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/**
 * Pega un bloque copiado de una hoja de cálculo (filas por salto de línea, columnas por tabulador) a partir de una celda.
 * Lo que no cabe (más filas que variantes o más columnas que campos) se ignora; un número ilegible no cambia la celda.
 */
export function applyPaste(rows: readonly WizardVariantRow[], startRow: number, startColumn: PasteColumn, text: string): WizardVariantRow[] {
  const lines = text.replace(/\r/g, '').split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  const firstColumn = PASTE_COLUMNS.indexOf(startColumn);

  return rows.map((row, rowIndex) => {
    const line = lines[rowIndex - startRow];
    if (rowIndex < startRow || line === undefined) return row;
    let next = row;
    line.split('\t').forEach((cell, offset) => {
      const column = PASTE_COLUMNS[firstColumn + offset];
      if (!column) return;
      if (column === 'sku') {
        const sku = cleanSku(cell);
        if (sku) next = { ...next, sku, skuEdited: true };
      } else if (column === 'barcode') {
        next = { ...next, barcode: cell.trim() };
      } else if (column === 'wholesalePrice' && cell.trim() === '') {
        next = { ...next, wholesalePrice: null };
      } else {
        const value = parseNumber(cell);
        if (value !== null) next = { ...next, [column]: value };
      }
    });
    return next;
  });
}

export interface WizardHeader {
  name: string;
  baseSku?: string;
  description?: string;
  categoryId?: string;
}

/** Petición de alta del producto compuesto, con el stock inicial de cada variante en la sucursal elegida. */
export function toVariableProductRequest(header: WizardHeader, rows: WizardVariantRow[], images: WizardImage[], branchId: string) {
  return {
    name: header.name.trim(),
    baseSku: header.baseSku?.trim() ? header.baseSku.trim().toUpperCase() : undefined,
    description: header.description?.trim() || '',
    categoryId: header.categoryId || undefined,
    imageIds: images.map((image) => image.id),
    variants: rows.map((row) => ({
      sku: row.sku.trim(),
      barcode: row.barcode.trim() || undefined,
      purchasePrice: Number(row.purchasePrice) || 0,
      salePrice: Number(row.salePrice) || 0,
      wholesalePrice: row.wholesalePrice !== null && row.wholesalePrice !== undefined ? Number(row.wholesalePrice) : null,
      imageIds: row.images && row.images.length > 0 ? row.images.map((image) => image.id) : (row.imageIds ?? []),
      attributeValues: row.combination.map((c) => ({ attributeValueId: c.valueId })),
      stocks: [{ branchId, quantity: Number(row.initialStock) || 0 }],
    })),
  };
}
