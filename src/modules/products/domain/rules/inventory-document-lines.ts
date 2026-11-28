import { roundQuantity } from '@/shared/domain/rules/quantity';
import { InventoryDocumentKind, InventoryMovementReason } from '../enums';

/** Los tipos de movimiento con líneas de cantidad y un mismo formulario; el conteo físico tiene el suyo. */
export type LinesKind = InventoryDocumentKind.ENTRY | InventoryDocumentKind.EXIT | InventoryDocumentKind.TRANSFER;

/** Una línea del formulario de entrada/salida: un producto elegido por su SKU y la cantidad. */
export interface DocumentFormLine {
  variantId: string;
  sku: string;
  productName: string;
  quantity: number;
  /** Solo en entradas: costo escrito a mano; sin él, el servidor usa el costo de compra de la variante. */
  unitCost?: number;
  /** Costo de compra de la variante, para mostrarlo como referencia; sin él, no se pudo consultar. */
  referenceCost: number | undefined;
  /** Existencia en la sucursal cuando se agregó la línea (para avisar antes de confirmar una salida). */
  stock: number;
}

export type NewDocumentLine = Pick<DocumentFormLine, 'variantId' | 'sku' | 'productName' | 'referenceCost' | 'stock'>;

/** Tipos en los que el usuario elige un motivo: el conteo y el traslado llevan uno solo, que pone el sistema. */
export type ReasonKind = InventoryDocumentKind.ENTRY | InventoryDocumentKind.EXIT;

/** Motivos que se ofrecen al usuario en cada tipo (los mismos que acepta el backend). `OTRO` vale en los dos. */
export const DOCUMENT_REASONS: Record<ReasonKind, readonly InventoryMovementReason[]> = {
  [InventoryDocumentKind.ENTRY]: [InventoryMovementReason.DONATION, InventoryMovementReason.PRODUCTION, InventoryMovementReason.OTHER],
  [InventoryDocumentKind.EXIT]: [InventoryMovementReason.DAMAGE, InventoryMovementReason.LOSS, InventoryMovementReason.INTERNAL_USE, InventoryMovementReason.SUPPLIER_RETURN, InventoryMovementReason.OTHER],
};

/** Mismo mínimo que el backend: evita un «.» o un «ok», pero deja pasar «robo», «roto» o «daño». */
export const MIN_COMMENT_LENGTH = 4;

/** Toda salida manual y todo `OTRO` exigen comentario (igual que el backend); el resto no. */
export function isCommentRequired(kind: LinesKind, reason: string | undefined): boolean {
  return kind === InventoryDocumentKind.EXIT || reason === InventoryMovementReason.OTHER;
}

/** Mismo tope que el backend. */
export const MAX_DOCUMENT_LINES = 200;

/** Agrega un producto; si ya estaba en la lista suma una unidad en vez de duplicar la línea (escanear dos veces el mismo SKU). */
export function addDocumentLine(lines: readonly DocumentFormLine[], product: NewDocumentLine): DocumentFormLine[] {
  const index = lines.findIndex((line) => line.variantId === product.variantId);
  if (index >= 0) return lines.map((line, i) => (i === index ? { ...line, quantity: line.quantity + 1 } : line));
  return [...lines, { ...product, quantity: 1 }];
}

export function updateDocumentLine(lines: readonly DocumentFormLine[], variantId: string, fields: Partial<Pick<DocumentFormLine, 'quantity' | 'unitCost'>>): DocumentFormLine[] {
  return lines.map((line) => (line.variantId === variantId ? { ...line, ...fields } : line));
}

export const removeDocumentLine = (lines: readonly DocumentFormLine[], variantId: string): DocumentFormLine[] => lines.filter((line) => line.variantId !== variantId);

/** Líneas de una salida o un traslado que piden más de lo que había en el origen: el servidor rechazaría el documento entero. */
export function lineShortages(lines: readonly DocumentFormLine[], kind: LinesKind): DocumentFormLine[] {
  return kind === InventoryDocumentKind.ENTRY ? [] : lines.filter((line) => line.quantity > line.stock);
}

export function documentSummary(lines: readonly DocumentFormLine[]): { products: number; units: number } {
  return { products: lines.length, units: lines.reduce((sum, line) => roundQuantity(sum + (line.quantity || 0)), 0) };
}

/** Por qué no se puede confirmar todavía, o `null` si está listo. El traslado no lleva motivo. */
export function documentBlocker(kind: LinesKind, lines: readonly DocumentFormLine[], reason: string | undefined, comment: string): string | null {
  if (kind !== InventoryDocumentKind.TRANSFER && !reason) return 'Elige un motivo.';
  if (lines.length === 0) return 'Agrega al menos un producto.';
  if (lines.length > MAX_DOCUMENT_LINES) return `Un movimiento admite hasta ${MAX_DOCUMENT_LINES} productos.`;
  if (lines.some((line) => !(line.quantity > 0))) return 'Todas las cantidades deben ser mayores a 0.';
  if (lines.some((line) => line.unitCost !== undefined && !(line.unitCost >= 0))) return 'El costo no puede ser negativo.';
  if (isCommentRequired(kind, reason) && comment.trim().length < MIN_COMMENT_LENGTH) return 'Escribe un comentario que explique el movimiento.';
  return null;
}

export function toDocumentLines(lines: readonly DocumentFormLine[], kind: LinesKind): { variantId: string; quantity: number; unitCost?: number }[] {
  return lines.map((line) => ({
    variantId: line.variantId,
    quantity: line.quantity,
    ...(kind === InventoryDocumentKind.ENTRY && line.unitCost !== undefined ? { unitCost: line.unitCost } : {}),
  }));
}

/** Por qué un traslado no puede salir todavía por la elección de sucursales, o `null` si está bien. Destino vacío = aún sin elegir. */
export function transferBranchBlocker(originBranchId: string, destinationBranchId: string): string | null {
  if (!destinationBranchId) return 'Elige la sucursal de destino.';
  if (destinationBranchId === originBranchId) return 'El destino debe ser una sucursal distinta del origen.';
  return null;
}
