import { InventoryMovementType, BatchOriginType, BatchStatus } from '../../domain/enums';

export interface InventoryMovementDTO {
  id: string;
  quantity: number;
  type: InventoryMovementType | string;
  reason: string;
  createdAt: string;
  variant?: { sku: string; product?: { name: string } };
  originBranch?: { name: string } | null;
  destinationBranch?: { name: string } | null;
}

export interface LotItemDTO {
  id: string;
  createdAt: string;
  variantId: string;
  productName: string;
  sku: string;
  barcode: string;
  initialQuantity: number;
  remainingQuantity: number;
  consumedQuantity: number;
  unitCost: number;
  totalCostValue: number;
  initialCostValue?: number;
}

export interface InventoryLotDTO {
  id: string;
  purchaseOrderId: string | null;
  createdAt: string;
  branchId: string;
  branchName: string;
  originType: BatchOriginType | string;
  originLabel: string;
  originReference: string;
  totalInitialQuantity: number;
  totalRemainingQuantity: number;
  totalCostValue: number;
  totalInitialCostValue?: number;
  status: BatchStatus | string;
  items: LotItemDTO[];
}

export interface VariantBatchItemDTO {
  id: string;
  batchId: string;
  batchCode: string;
  createdAt: string;
  branchId: string;
  branchName: string;
  originType: BatchOriginType | string;
  originLabel: string;
  originReference: string;
  sku: string;
  productName: string;
  initialQuantity: number;
  remainingQuantity: number;
  consumedQuantity: number;
  unitCost: number;
  totalCostValue: number;
  status: BatchStatus | string;
}
