import type {
  InventoryMovementDTO,
  InventoryMovementHistoryDTO,
  InventoryDocumentDTO,
  InventoryDocumentDetailDTO,
  InventoryDocumentListItemDTO,
  VariantBatchItemDTO,
  InventoryLotDTO,
  LotItemDTO,
} from '../dtos/inventory.dto';
import type {
  InventoryMovementEntity,
  InventoryMovementHistoryEntity,
  InventoryDocumentEntity,
  InventoryDocumentDetailEntity,
  InventoryDocumentListItemEntity,
  VariantBatchEntity,
  InventoryLotEntity,
  LotItemEntity,
} from '../../domain/entities/inventory.entity';
import { InventoryDocumentKind, InventoryMovementCategory, InventoryMovementType, BatchStatus } from '../../domain/enums';

export const toInventoryMovementEntity = (dto: InventoryMovementDTO): InventoryMovementEntity => {
  const dateObj = new Date(dto.createdAt);
  return {
    id: dto.id,
    quantity: Number(dto.quantity || 0),
    type: dto.type === InventoryMovementType.IN ? InventoryMovementType.IN : InventoryMovementType.OUT,
    reason: dto.reason || 'Sin motivo',
    createdAt: dateObj,
    sku: dto.variant?.sku || '',
    productName: dto.variant?.product?.name || 'Producto',
    originBranchName: dto.originBranch?.name || '-',
    destinationBranchName: dto.destinationBranch?.name || '-',
  };
};

const toDocumentKind = (kind: string): InventoryDocumentKind => Object.values(InventoryDocumentKind).find((candidate) => candidate === kind) ?? InventoryDocumentKind.EXIT;

const toCategory = (category: string | null | undefined): InventoryMovementCategory | null => Object.values(InventoryMovementCategory).find((candidate) => candidate === category) ?? null;

const toNumberOrNull = (value: number | string | null | undefined): number | null => (value === null || value === undefined ? null : Number(value));

export const toInventoryMovementHistoryEntity = (dto: InventoryMovementHistoryDTO): InventoryMovementHistoryEntity => ({
  id: dto.id,
  createdAt: new Date(dto.createdAt),
  type: dto.type === InventoryMovementType.IN ? InventoryMovementType.IN : InventoryMovementType.OUT,
  category: toCategory(dto.category),
  reason: dto.reason,
  quantity: Number(dto.quantity || 0),
  unitCost: toNumberOrNull(dto.unitCost),
  balanceAfter: toNumberOrNull(dto.balanceAfter),
  variantId: dto.variantId,
  sku: dto.sku,
  productName: dto.productName,
  originBranchName: dto.originBranch?.name ?? null,
  destinationBranchName: dto.destinationBranch?.name ?? null,
  document: dto.document ? { ...dto.document, kind: toDocumentKind(dto.document.kind) } : null,
});

export const toInventoryDocumentListItemEntity = (dto: InventoryDocumentListItemDTO): InventoryDocumentListItemEntity => ({
  id: dto.id,
  number: dto.number,
  kind: toDocumentKind(dto.kind),
  reason: dto.reason,
  comment: dto.comment,
  createdAt: new Date(dto.createdAt),
  userName: dto.userName,
  branchName: dto.branch.name,
  destinationBranchName: dto.destinationBranch?.name ?? null,
  productsCount: Number(dto.productsCount || 0),
  unitsCount: Number(dto.unitsCount || 0),
});

export const toInventoryDocumentDetailEntity = (dto: InventoryDocumentDetailDTO): InventoryDocumentDetailEntity => ({
  id: dto.id,
  number: dto.number,
  kind: toDocumentKind(dto.kind),
  reason: dto.reason,
  comment: dto.comment,
  createdAt: new Date(dto.createdAt),
  userName: dto.userName,
  branchName: dto.branch.name,
  destinationBranchName: dto.destinationBranch?.name ?? null,
  lines: dto.lines.map((line) => ({
    variantId: line.variantId,
    sku: line.sku,
    productName: line.productName,
    type: line.type === InventoryMovementType.IN ? InventoryMovementType.IN : InventoryMovementType.OUT,
    quantity: Number(line.quantity || 0),
    branchName: line.branchName,
    unitCost: toNumberOrNull(line.unitCost),
    balanceAfter: toNumberOrNull(line.balanceAfter),
  })),
});

export const toInventoryDocumentEntity = (dto: InventoryDocumentDTO): InventoryDocumentEntity => ({
  id: dto.id,
  number: dto.number,
  kind: toDocumentKind(dto.kind),
  reason: dto.reason,
  comment: dto.comment,
  branchId: dto.branchId,
  destinationBranchId: dto.destinationBranchId ?? null,
  createdAt: new Date(dto.createdAt),
  lines: dto.lines.map((line) => ({ variantId: line.variantId, sku: line.sku, quantity: Number(line.quantity), type: line.type === InventoryMovementType.IN ? InventoryMovementType.IN : InventoryMovementType.OUT })),
});

export const toVariantBatchEntity = (dto: VariantBatchItemDTO): VariantBatchEntity => {
  const dateObj = new Date(dto.createdAt);
  const unitCost = Number(dto.unitCost || 0);
  const totalCostValue = Number(dto.totalCostValue || 0);

  return {
    id: dto.id,
    batchId: dto.batchId,
    batchCode: dto.batchCode || 'S/C',
    createdAt: dateObj,
    branchId: dto.branchId,
    branchName: dto.branchName || 'Sucursal',
    originName: dto.originLabel || 'Origen',
    originReference: dto.originReference || '-',
    sku: dto.sku || '',
    productName: dto.productName || 'Producto',
    initialQuantity: Number(dto.initialQuantity || 0),
    remainingQuantity: Number(dto.remainingQuantity || 0),
    consumedQuantity: Number(dto.consumedQuantity || 0),
    unitCost,
    totalCostValue,
    status: dto.status === BatchStatus.DEPLETED ? BatchStatus.DEPLETED : BatchStatus.ACTIVE,
  };
};

export const toLotItemEntity = (dto: LotItemDTO): LotItemEntity => {
  const dateObj = new Date(dto.createdAt);
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
    totalCostValue,
    initialCostValue,
  };
};

export const toInventoryLotEntity = (dto: InventoryLotDTO): InventoryLotEntity => {
  const dateObj = new Date(dto.createdAt);
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
  return {
    id: dto.id,
    purchaseOrderId: dto.purchaseOrderId || null,
    createdAt: dateObj,
    branchId: dto.branchId,
    branchName: dto.branchName || 'Sucursal',
    originType: dto.originType,
    originName: dto.originLabel || 'Origen',
    originReference: dto.originReference || '',
    totalInitialQuantity,
    totalRemainingQuantity,
    hasStock,
    percentRemaining: percentLeftRaw,
    totalCostValue,
    totalInitialCostValue,
    status: dto.status === BatchStatus.CANCELLED
      ? BatchStatus.CANCELLED
      : dto.status === BatchStatus.DEPLETED
      ? BatchStatus.DEPLETED
      : BatchStatus.ACTIVE,
    items,
  };
};
