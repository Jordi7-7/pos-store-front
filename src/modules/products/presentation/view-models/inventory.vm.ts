import { roundQuantity } from '@/shared/domain/rules/quantity';
import { InventoryDocumentKind, InventoryMovementReasonLabels, InventoryMovementType, type InventoryMovementReason } from '../../domain/enums';
import type { Formatters } from '@/shared/presentation/formatting/formatters';
import type { InventoryDocumentDetailEntity, InventoryDocumentDetailLineEntity, InventoryDocumentListItemEntity, InventoryLotEntity, InventoryMovementEntity, InventoryMovementHistoryEntity, LotItemEntity, VariantBatchEntity } from '../../domain/entities/inventory.entity';

/** Inventario con los textos listos para mostrar (importes con la moneda de la tienda y fechas en su zona horaria). */

export type InventoryMovementVM = InventoryMovementEntity & { dateFormatted: string };

export type InventoryMovementHistoryVM = InventoryMovementHistoryEntity & {
  dateFormatted: string;
  reasonLabel: string;
  /** Cantidad con signo: `+10` en una entrada, `-2` en una salida. */
  signedQuantity: string;
  /** Existencia tras el movimiento, o un guion en filas anteriores a que el kardex guardara el saldo. */
  balanceText: string;
  /** Sucursal donde ocurrió: la de destino en una entrada, la de origen en una salida. */
  branchName: string;
  /** Número del documento manual (`ENT-000001`), si el movimiento viene de uno. */
  documentNumber: string | null;
  authorName: string | null;
  comment: string | null;
  /** En un traslado, "hacia Norte" (salida) o "desde Matriz" (entrada); si no, `null`. */
  counterpartText: string | null;
};

export type VariantBatchVM = VariantBatchEntity & { dateFormatted: string; unitCostFormatted: string; totalCostFormatted: string };

export type LotItemVM = LotItemEntity & {
  dateFormatted: string;
  unitCostFormatted: string;
  totalCostFormatted: string;
  initialCostFormatted: string;
};

export type InventoryLotVM = Omit<InventoryLotEntity, 'items'> & {
  items: LotItemVM[];
  dateFormatted: string;
  /** Título del lote: su referencia de origen o un nombre por defecto. */
  displayTitle: string;
  /** Porcentaje que queda: con un decimal si casi no se ha consumido (para no mostrar 100 % de un lote ya usado). */
  percentDisplay: string | number;
  totalCostFormatted: string;
  totalInitialCostFormatted: string;
};

export const toInventoryMovementVM = (movement: InventoryMovementEntity, fmt: Formatters): InventoryMovementVM => ({
  ...movement,
  dateFormatted: fmt.dateTime(movement.createdAt),
});

export const toInventoryMovementHistoryVM = (movement: InventoryMovementHistoryEntity, fmt: Formatters): InventoryMovementHistoryVM => {
  const isEntry = movement.type === InventoryMovementType.IN;
  return {
    ...movement,
    dateFormatted: fmt.dateTime(movement.createdAt),
    reasonLabel: InventoryMovementReasonLabels[movement.reason as InventoryMovementReason] ?? movement.reason,
    signedQuantity: `${isEntry ? '+' : '-'}${movement.quantity}`,
    balanceText: movement.balanceAfter === null ? '—' : String(movement.balanceAfter),
    branchName: (isEntry ? movement.destinationBranchName : movement.originBranchName) ?? '—',
    documentNumber: movement.document?.number ?? null,
    authorName: movement.document?.userName ?? null,
    comment: movement.document?.comment ?? null,
    counterpartText: movement.document?.counterpartBranchName ? `${isEntry ? 'desde' : 'hacia'} ${movement.document.counterpartBranchName}` : null,
  };
};

export const toVariantBatchVM = (batch: VariantBatchEntity, fmt: Formatters): VariantBatchVM => ({
  ...batch,
  dateFormatted: fmt.shortDate(batch.createdAt),
  unitCostFormatted: fmt.money(batch.unitCost),
  totalCostFormatted: fmt.money(batch.totalCostValue),
});

export const toLotItemVM = (item: LotItemEntity, fmt: Formatters): LotItemVM => ({
  ...item,
  dateFormatted: fmt.shortDate(item.createdAt),
  unitCostFormatted: fmt.money(item.unitCost),
  totalCostFormatted: fmt.money(item.totalCostValue),
  initialCostFormatted: fmt.money(item.initialCostValue),
});

export const toInventoryLotVM = (lot: InventoryLotEntity, fmt: Formatters): InventoryLotVM => {
  const nearlyFull = lot.totalRemainingQuantity < lot.totalInitialQuantity && lot.percentRemaining > 99;
  return {
    ...lot,
    items: lot.items.map((item) => toLotItemVM(item, fmt)),
    dateFormatted: fmt.shortDate(lot.createdAt),
    displayTitle: lot.originReference || (lot.purchaseOrderId ? `Lote Compra #${lot.purchaseOrderId.slice(0, 8)}` : 'Lote Inventario Directo'),
    percentDisplay: nearlyFull ? lot.percentRemaining.toFixed(1) : Math.round(lot.percentRemaining),
    totalCostFormatted: fmt.money(lot.totalCostValue),
    totalInitialCostFormatted: fmt.money(lot.totalInitialCostValue),
  };
};

export type InventoryDocumentDetailLineVM = InventoryDocumentDetailLineEntity & {
  /** `+10` en una entrada, `-2` en una salida. */
  signedQuantity: string;
  unitCostText: string;
  balanceText: string;
};

export type InventoryDocumentDetailVM = Omit<InventoryDocumentDetailEntity, 'lines'> & {
  dateFormatted: string;
  /** Lo que el usuario reconoce: «Entrada», «Salida», «Conteo físico» o «Traslado». */
  kindLabel: string;
  /** El motivo elegido; el conteo y el traslado no tienen (lo pone el sistema) y se omite. */
  reasonLabel: string | null;
  lines: InventoryDocumentDetailLineVM[];
  productsText: string;
  unitsText: string;
};

export const DOCUMENT_KIND_LABELS: Record<InventoryDocumentKind, string> = {
  [InventoryDocumentKind.ENTRY]: 'Entrada de inventario',
  [InventoryDocumentKind.EXIT]: 'Salida de inventario',
  [InventoryDocumentKind.COUNT]: 'Conteo físico',
  [InventoryDocumentKind.TRANSFER]: 'Traslado entre sucursales',
};

export const toInventoryDocumentDetailVM = (document: InventoryDocumentDetailEntity, fmt: Formatters): InventoryDocumentDetailVM => {
  const lines = document.lines.map((line) => ({
    ...line,
    signedQuantity: `${line.type === InventoryMovementType.IN ? '+' : '-'}${line.quantity}`,
    unitCostText: line.unitCost === null ? '—' : fmt.money(line.unitCost),
    balanceText: line.balanceAfter === null ? '—' : String(line.balanceAfter),
  }));
  // Un traslado repite cada producto (salida y entrada): se cuenta una sola vez
  const products = new Set(document.lines.map((line) => line.variantId)).size;
  const units = document.lines.filter((line) => document.kind !== InventoryDocumentKind.TRANSFER || line.type === InventoryMovementType.OUT).reduce((sum, line) => roundQuantity(sum + line.quantity), 0);
  const hasChosenReason = document.kind === InventoryDocumentKind.ENTRY || document.kind === InventoryDocumentKind.EXIT;
  return {
    ...document,
    dateFormatted: fmt.dateTime(document.createdAt),
    kindLabel: DOCUMENT_KIND_LABELS[document.kind],
    reasonLabel: hasChosenReason ? (InventoryMovementReasonLabels[document.reason as InventoryMovementReason] ?? document.reason) : null,
    lines,
    productsText: `${products} producto(s)`,
    unitsText: `${units} unidad(es)`,
  };
};

export type InventoryDocumentListItemVM = InventoryDocumentListItemEntity & {
  dateFormatted: string;
  kindLabel: string;
  /** El motivo elegido; el conteo y el traslado no tienen (lo pone el sistema) y se omite. */
  reasonLabel: string | null;
  /** La sucursal, o «Matriz → Norte» en un traslado. */
  branchText: string;
  productsText: string;
  unitsText: string;
};

export const toInventoryDocumentListItemVM = (document: InventoryDocumentListItemEntity, fmt: Formatters): InventoryDocumentListItemVM => {
  const hasChosenReason = document.kind === InventoryDocumentKind.ENTRY || document.kind === InventoryDocumentKind.EXIT;
  return {
    ...document,
    dateFormatted: fmt.dateTime(document.createdAt),
    kindLabel: DOCUMENT_KIND_LABELS[document.kind],
    reasonLabel: hasChosenReason ? (InventoryMovementReasonLabels[document.reason as InventoryMovementReason] ?? document.reason) : null,
    branchText: document.destinationBranchName ? `${document.branchName} → ${document.destinationBranchName}` : document.branchName,
    productsText: String(document.productsCount),
    unitsText: String(document.unitsCount),
  };
};
