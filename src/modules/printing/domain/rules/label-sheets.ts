import type { LabelItem } from '../entities/label';

/** Qué lleva la etiqueta: todo (tienda, código, nombre, precio) o solo el código de barras con su número. */
export type LabelContent = 'FULL' | 'BARCODE';

export interface LabelStyle {
  /** Franja negra con el nombre de la tienda (solo en la etiqueta completa). */
  showStore: boolean;
  content: LabelContent;
  /** Dos códigos en cada etiqueta, uno arriba y otro abajo, para cortarla por la mitad (solo con `BARCODE`). */
  twoPerLabel: boolean;
}

export type CodesPerLabel = 1 | 2;

export const codesPerLabel = ({ content, twoPerLabel }: Pick<LabelStyle, 'content' | 'twoPerLabel'>): CodesPerLabel => (content === 'BARCODE' && twoPerLabel ? 2 : 1);

/** Una etiqueta física: los códigos que lleva (de arriba abajo) y cuántas copias iguales se imprimen. */
export interface LabelSheet {
  items: LabelItem[];
  copies: number;
}

const quantityOf = (item: LabelItem): number => Math.max(1, Math.floor(Number(item.quantity) || 1));

/**
 * Reparte la cola en etiquetas físicas. Con dos códigos por etiqueta no se desperdicia ninguna mitad: la que sobra de un
 * producto se completa con el siguiente, y solo la última puede quedar con una mitad vacía.
 */
export function buildSheets(queue: readonly LabelItem[], perLabel: CodesPerLabel): LabelSheet[] {
  if (perLabel === 1) return queue.map((item) => ({ items: [item], copies: quantityOf(item) }));

  const sheets: LabelSheet[] = [];
  let pending: LabelItem | null = null;
  for (const item of queue) {
    let remaining = quantityOf(item);
    if (pending) {
      sheets.push({ items: [pending, item], copies: 1 });
      pending = null;
      remaining -= 1;
    }
    if (remaining >= 2) sheets.push({ items: [item, item], copies: Math.floor(remaining / 2) });
    if (remaining % 2 === 1) pending = item;
  }
  if (pending) sheets.push({ items: [pending], copies: 1 });
  return sheets;
}

export const countLabels = (sheets: readonly LabelSheet[]): number => sheets.reduce((total, sheet) => total + sheet.copies, 0);

/**
 * Parte las etiquetas físicas en tandas de como mucho `size`, dividiendo las copias cuando hace falta: así la impresora
 * recibe poco de cada vez y alcanza a imprimirlo antes de la siguiente tanda.
 */
export function splitIntoBatches(sheets: readonly LabelSheet[], size: number): LabelSheet[][] {
  const batches: LabelSheet[][] = [];
  let current: LabelSheet[] = [];
  let room = size;
  for (const sheet of sheets) {
    let remaining = sheet.copies;
    while (remaining > 0) {
      const copies = Math.min(remaining, room);
      current.push({ items: sheet.items, copies });
      remaining -= copies;
      room -= copies;
      if (room === 0) {
        batches.push(current);
        current = [];
        room = size;
      }
    }
  }
  if (current.length > 0) batches.push(current);
  return batches;
}
