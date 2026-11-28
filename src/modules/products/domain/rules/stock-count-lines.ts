import { roundQuantity } from '@/shared/domain/rules/quantity';

/** Una línea del conteo: el producto, lo que el sistema decía al agregarla y lo que el usuario contó. */
export interface CountFormLine {
  variantId: string;
  sku: string;
  productName: string;
  /** Existencia que mostraba el sistema cuando se agregó la línea. */
  expected: number;
  /** `undefined` mientras el usuario no ha escrito lo contado. */
  counted: number | undefined;
  /** Solo si sobra mercancía: costo de lo que se suma; sin él, el servidor usa el costo de compra. */
  unitCost?: number;
  /** Costo de compra de la variante, para mostrarlo como referencia; sin él, no se pudo consultar. */
  referenceCost: number | undefined;
}

export type NewCountLine = Pick<CountFormLine, 'variantId' | 'sku' | 'productName' | 'expected' | 'referenceCost'>;

/** Mismo tope que el backend. */
export const MAX_COUNT_LINES = 200;

/** Agrega un producto; si ya estaba, no lo duplica (un conteo no puede tener dos cantidades para el mismo producto). */
export function addCountLine(lines: readonly CountFormLine[], product: NewCountLine): { lines: CountFormLine[]; added: boolean } {
  if (lines.some((line) => line.variantId === product.variantId)) return { lines: [...lines], added: false };
  return { lines: [...lines, { ...product, counted: undefined }], added: true };
}

/** Un producto de la lista que trae el servidor para armar el conteo. */
export interface SheetItem {
  variantId: string;
  sku: string;
  productName: string;
  stock: number;
  purchasePrice: number;
}

/**
 * Agrega a las líneas los productos de la lista que aún no están, sin pasar del tope de líneas. Los ya presentes no se
 * duplican ni se tocan (conservan lo contado). `full` indica que se llegó al tope y quedaron productos sin agregar.
 */
export function mergeSheetItems(lines: readonly CountFormLine[], items: readonly SheetItem[]): { lines: CountFormLine[]; added: number; skipped: number; full: boolean } {
  const present = new Set(lines.map((line) => line.variantId));
  const next = [...lines];
  let added = 0;
  let skipped = 0;
  let full = false;
  for (const item of items) {
    if (present.has(item.variantId)) {
      skipped += 1;
      continue;
    }
    if (next.length >= MAX_COUNT_LINES) {
      full = true;
      break;
    }
    next.push({ variantId: item.variantId, sku: item.sku, productName: item.productName, expected: item.stock, referenceCost: item.purchasePrice, counted: undefined });
    present.add(item.variantId);
    added += 1;
  }
  return { lines: next, added, skipped, full };
}

export function updateCountLine(lines: readonly CountFormLine[], variantId: string, fields: Partial<Pick<CountFormLine, 'counted' | 'unitCost'>>): CountFormLine[] {
  return lines.map((line) => (line.variantId === variantId ? { ...line, ...fields } : line));
}

/** Quita los productos que aún no se contaron (útil tras cargar muchos y contar solo algunos). */
export const removeUncountedLines = (lines: readonly CountFormLine[]): CountFormLine[] => lines.filter((line) => countDifference(line) !== null);

export const removeCountLine = (lines: readonly CountFormLine[], variantId: string): CountFormLine[] => lines.filter((line) => line.variantId !== variantId);

/** Lo contado menos lo que decía el sistema: positivo si sobra, negativo si falta; `null` si aún no se ha contado. */
export function countDifference(line: CountFormLine): number | null {
  return line.counted === undefined || Number.isNaN(line.counted) ? null : roundQuantity(line.counted - line.expected);
}

export interface CountSummary {
  /** Productos con lo contado ya escrito. */
  counted: number;
  /** Productos aún sin contar: no se envían ni se tocan. */
  pending: number;
  /** Unidades que sobran (suman) y que faltan (restan). */
  surplus: number;
  shortage: number;
  /** Líneas contadas cuya diferencia es 0. */
  matching: number;
}

export function countSummary(lines: readonly CountFormLine[]): CountSummary {
  const summary: CountSummary = { counted: 0, pending: 0, surplus: 0, shortage: 0, matching: 0 };
  for (const line of lines) {
    const difference = countDifference(line);
    if (difference === null) {
      summary.pending += 1;
      continue;
    }
    summary.counted += 1;
    if (difference > 0) summary.surplus = roundQuantity(summary.surplus + difference);
    else if (difference < 0) summary.shortage = roundQuantity(summary.shortage - difference);
    else summary.matching += 1;
  }
  return summary;
}

/** Por qué no se puede confirmar todavía, o `null` si está listo. */
export function countBlocker(lines: readonly CountFormLine[]): string | null {
  if (lines.length === 0) return 'Agrega al menos un producto.';
  if (lines.length > MAX_COUNT_LINES) return `Un conteo admite hasta ${MAX_COUNT_LINES} productos.`;
  if (lines.every((line) => countDifference(line) === null)) return 'Escribe lo contado de al menos un producto.';
  if (lines.some((line) => line.counted !== undefined && line.counted < 0)) return 'Lo contado no puede ser negativo.';
  if (lines.some((line) => line.unitCost !== undefined && !(line.unitCost >= 0))) return 'El costo no puede ser negativo.';
  const { surplus, shortage } = countSummary(lines);
  if (surplus === 0 && shortage === 0) return 'Lo contado coincide con el sistema: no hay nada que ajustar.';
  return null;
}

/** Líneas listas para enviar: solo las contadas; el costo viaja únicamente cuando sobra mercancía y se escribió. */
export function toCountLines(lines: readonly CountFormLine[]): { variantId: string; counted: number; expected: number; unitCost?: number }[] {
  return lines.flatMap((line) => {
    const difference = countDifference(line);
    if (difference === null || line.counted === undefined) return [];
    return [{ variantId: line.variantId, counted: line.counted, expected: line.expected, ...(difference > 0 && line.unitCost !== undefined ? { unitCost: line.unitCost } : {}) }];
  });
}
