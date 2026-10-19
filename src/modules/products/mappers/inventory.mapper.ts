import type {
  InventoryMovementDTO,
  VariantBatchItemDTO,
  InventoryLotDTO,
  LotItemDTO,
} from '../types/inventory.types';
import type {
  InventoryMovementEntity,
  VariantBatchEntity,
  InventoryLotEntity,
  LotItemEntity,
} from '../entities/inventory.entity';
import { InventoryMovementType, BatchStatus } from '../enums';

export const toInventoryMovementEntity = (dto: InventoryMovementDTO): InventoryMovementEntity => {
  const dateObj = new Date(dto.createdAt);
  const dateFormatted = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString('es-EC', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-';

  return {
    id: dto.id,
    quantity: Number(dto.quantity || 0),
    type: dto.type === InventoryMovementType.IN ? InventoryMovementType.IN : InventoryMovementType.OUT,
    reason: dto.reason || 'Sin motivo',
    createdAt: dateObj,
    dateFormatted,
    sku: dto.variant?.sku || '',
    productName: dto.variant?.product?.name || 'Producto',
    originBranchName: dto.originBranch?.name || '-',
    destinationBranchName: dto.destinationBranch?.name || '-',
  };
};

export const toVariantBatchEntity = (dto: VariantBatchItemDTO): VariantBatchEntity => {
  const dateObj = new Date(dto.createdAt);
  const dateFormatted = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString('es-EC', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '-';

  const unitCost = Number(dto.unitCost || 0);
  const totalCostValue = Number(dto.totalCostValue || 0);

  return {
    id: dto.id,
    batchId: dto.batchId,
    batchCode: dto.batchCode || 'S/C',
    createdAt: dateObj,
    dateFormatted,
    branchId: dto.branchId,
    branchName: dto.branchName || 'Sucursal',
    originLabel: dto.originLabel || 'Origen',
    originReference: dto.originReference || '-',
    sku: dto.sku || '',
    productName: dto.productName || 'Producto',
    initialQuantity: Number(dto.initialQuantity || 0),
    remainingQuantity: Number(dto.remainingQuantity || 0),
    consumedQuantity: Number(dto.consumedQuantity || 0),
    unitCost,
    unitCostFormatted: `$${unitCost.toFixed(2)}`,
    totalCostValue,
    totalCostFormatted: `$${totalCostValue.toFixed(2)}`,
    status: dto.status === BatchStatus.DEPLETED ? BatchStatus.DEPLETED : BatchStatus.ACTIVE,
  };
};

export const toLotItemEntity = (dto: LotItemDTO): LotItemEntity => {
  const dateObj = new Date(dto.createdAt);
  const dateFormatted = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString('es-EC', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '-';

  const initialQuantity = Number(dto.initialQuantity || 0);
  const remainingQuantity = Number(dto.remainingQuantity || 0);
  const consumedQuantity = Number(dto.consumedQuantity || 0);
  const unitCost = Number(dto.unitCost || 0);
  const totalCostValue = Number(dto.totalCostValue || 0);
  const initialCostValue = dto.initialCostValue !== undefined
    ? Number(dto.initialCostValue)
    : (initialQuantity * unitCost);

  const isAvailable = remainingQuantity > 0;
  const percentRemaining = initialQuantity > 0
    ? Math.round((remainingQuantity / initialQuantity) * 100)
    : 0;

  return {
    id: dto.id,
    createdAt: dateObj,
    dateFormatted,
    variantId: dto.variantId,
    productName: dto.productName || 'Producto',
    sku: dto.sku || '',
    barcode: dto.barcode || '',
    initialQuantity,
    remainingQuantity,
    consumedQuantity,
    percentRemaining,
    isAvailable,
    unitCost,
    unitCostFormatted: `$${unitCost.toFixed(2)}`,
    totalCostValue,
    totalCostFormatted: `$${totalCostValue.toFixed(2)}`,
    initialCostValue,
    initialCostFormatted: `$${initialCostValue.toFixed(2)}`,
  };
};

export const toInventoryLotEntity = (dto: InventoryLotDTO): InventoryLotEntity => {
  const dateObj = new Date(dto.createdAt);
  const dateFormatted = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString('es-EC', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '-';

  const totalInitialQuantity = Number(dto.totalInitialQuantity || 0);
  const totalRemainingQuantity = Number(dto.totalRemainingQuantity || 0);
  const totalCostValue = Number(dto.totalCostValue || 0);
  const items = Array.isArray(dto.items) ? dto.items.map(toLotItemEntity) : [];
  const totalInitialCostValue = dto.totalInitialCostValue !== undefined
    ? Number(dto.totalInitialCostValue)
    : items.reduce((acc, it) => acc + it.initialCostValue, 0);

  const hasStock = totalRemainingQuantity > 0;
  const percentLeftRaw = totalInitialQuantity > 0
    ? (totalRemainingQuantity / totalInitialQuantity) * 100
    : 0;
  const percentDisplay = (totalRemainingQuantity < totalInitialQuantity && percentLeftRaw > 99)
    ? percentLeftRaw.toFixed(1)
    : Math.round(percentLeftRaw);

  const displayTitle = dto.originReference || (dto.purchaseOrderId ? `Lote Compra #${dto.purchaseOrderId.slice(0, 8)}` : 'Lote Inventario Directo');

  return {
    id: dto.id,
    purchaseOrderId: dto.purchaseOrderId || null,
    displayTitle,
    createdAt: dateObj,
    dateFormatted,
    branchId: dto.branchId,
    branchName: dto.branchName || 'Sucursal',
    originType: dto.originType,
    originLabel: dto.originLabel || 'Origen',
    originReference: dto.originReference || '',
    totalInitialQuantity,
    totalRemainingQuantity,
    hasStock,
    percentRemaining: percentLeftRaw,
    percentDisplay,
    totalCostValue,
    totalCostFormatted: `$${totalCostValue.toFixed(2)}`,
    totalInitialCostValue,
    totalInitialCostFormatted: `$${totalInitialCostValue.toFixed(2)}`,
    status: dto.status === BatchStatus.CANCELLED
      ? BatchStatus.CANCELLED
      : dto.status === BatchStatus.DEPLETED
      ? BatchStatus.DEPLETED
      : BatchStatus.ACTIVE,
    items,
  };
};
