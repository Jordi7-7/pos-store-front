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
}

/** Valores escritos en el panel "aplicar a todas" (texto tal como se teclea; vacío = no tocar). */
export interface BulkValues {
  skuPrefix: string;
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

/** SKU base de las variantes: el escrito en la ficha, si no el prefijo en bloque, si no las primeras letras del nombre. */
export function resolveBaseSku(headerSku: string | undefined, bulkPrefix: string, productName: string): string {
  const raw = headerSku?.trim() || bulkPrefix.trim();
  if (raw) return cleanSku(raw);
  return (productName || 'PROD').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'PROD';
}

const numberOrZero = (text: string) => (text ? Number(text) : 0);

/** Una fila por combinación, con SKU `BASE-1`, `BASE-2`… y los valores en bloque ya escritos como punto de partida. */
export function generateVariantRows(combinations: Combination[][], baseSku: string, bulk: BulkValues, idSeed: number): WizardVariantRow[] {
  return combinations.map((combination, index) => ({
    id: `var-${idSeed}-${index}`,
    sku: `${baseSku}-${index + 1}`,
    barcode: '',
    purchasePrice: numberOrZero(bulk.purchasePrice),
    salePrice: numberOrZero(bulk.salePrice),
    wholesalePrice: bulk.wholesalePrice ? Number(bulk.wholesalePrice) : null,
    initialStock: numberOrZero(bulk.stock),
    combination,
  }));
}

/** Aplica el panel en bloque: un prefijo renumera los SKU; cada valor escrito sustituye al de todas las filas, los vacíos no tocan nada. */
export function applyBulkValues(rows: WizardVariantRow[], bulk: BulkValues): WizardVariantRow[] {
  const prefix = cleanSku(bulk.skuPrefix);
  return rows.map((row, index) => ({
    ...row,
    sku: prefix ? `${prefix}-${index + 1}` : row.sku,
    purchasePrice: bulk.purchasePrice !== '' ? Number(bulk.purchasePrice) : row.purchasePrice,
    salePrice: bulk.salePrice !== '' ? Number(bulk.salePrice) : row.salePrice,
    wholesalePrice: bulk.wholesalePrice !== '' ? Number(bulk.wholesalePrice) : row.wholesalePrice,
    initialStock: bulk.stock !== '' ? Number(bulk.stock) : row.initialStock,
  }));
}

/** Primer problema con los SKU (vacío o repetido, sin distinguir mayúsculas), o `null` si todo está bien. */
export function findSkuProblem(rows: WizardVariantRow[]): string | null {
  const seen = new Set<string>();
  for (const row of rows) {
    const sku = row.sku.trim().toUpperCase();
    if (!sku) return 'Todas las variantes deben tener un SKU válido.';
    if (seen.has(sku)) return `El SKU "${row.sku}" está repetido en la lista.`;
    seen.add(sku);
  }
  return null;
}

export interface WizardHeader {
  name: string;
  baseSku?: string;
  description?: string;
  categoryId?: string;
}

/** Petición de alta del producto compuesto, con el stock inicial de cada variante en la sucursal elegida. */
export function toVariableProductRequest(header: WizardHeader, rows: WizardVariantRow[], images: WizardImage[], branchId: string, bulkPrefix: string) {
  const baseSku = header.baseSku?.trim() ? header.baseSku.trim().toUpperCase() : bulkPrefix.trim() ? bulkPrefix.trim().toUpperCase() : undefined;
  return {
    name: header.name.trim(),
    baseSku,
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
