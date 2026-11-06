import type { Formatters } from '@/shared/presentation/formatting/formatters';
import type { InventoryLotEntity, InventoryMovementEntity, LotItemEntity, VariantBatchEntity } from '../../domain/entities/inventory.entity';

/** Inventario con los textos listos para mostrar (importes con la moneda de la tienda y fechas en su zona horaria). */

export type InventoryMovementVM = InventoryMovementEntity & { dateFormatted: string };

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
