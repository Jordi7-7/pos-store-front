import { InventoryMovementType, BatchStatus } from '../enums';

export interface InventoryMovementEntity {
  id: string;
  quantity: number;
  type: InventoryMovementType;
  reason: string;
  createdAt: Date;
  dateFormatted: string;
  sku: string;
  productName: string;
  originBranchName: string;
  destinationBranchName: string;
}

export interface VariantBatchEntity {
  id: string;
  batchId: string;
  batchCode: string;
  createdAt: Date;
  dateFormatted: string;
  branchId: string;
  branchName: string;
  originLabel: string;
  originReference: string;
  sku: string;
  productName: string;
  initialQuantity: number;
  remainingQuantity: number;
  consumedQuantity: number;
  unitCost: number;
  unitCostFormatted: string;
  totalCostValue: number;
  totalCostFormatted: string;
  status: BatchStatus;
}

export interface LotItemEntity {
  id: string;
  createdAt: Date;
  dateFormatted: string;
  variantId: string;
  productName: string;
  sku: string;
  barcode: string;
  initialQuantity: number;
  remainingQuantity: number;
  consumedQuantity: number;
  percentRemaining: number;
  isAvailable: boolean;
  unitCost: number;
  unitCostFormatted: string;
  totalCostValue: number;
  totalCostFormatted: string;
  initialCostValue: number;
  initialCostFormatted: string;
}

export interface InventoryLotEntity {
  id: string;
  purchaseOrderId: string | null;
  displayTitle: string;
  createdAt: Date;
  dateFormatted: string;
  branchId: string;
  branchName: string;
  originType: string;
  originLabel: string;
  originReference: string;
  totalInitialQuantity: number;
  totalRemainingQuantity: number;
  hasStock: boolean;
  percentRemaining: number;
  percentDisplay: string | number;
  totalCostValue: number;
  totalCostFormatted: string;
  totalInitialCostValue: number;
  totalInitialCostFormatted: string;
  status: BatchStatus;
  items: LotItemEntity[];
}
