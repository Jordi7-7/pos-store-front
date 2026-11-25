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

export interface InventoryMovementHistoryDTO {
  id: string;
  createdAt: string;
  type: InventoryMovementType | string;
  category?: string | null;
  reason: string;
  quantity: number;
  unitCost?: number | null;
  balanceAfter?: number | null;
  variantId: string;
  sku: string;
  productName: string;
  originBranch: { id: string; name: string } | null;
  destinationBranch: { id: string; name: string } | null;
  document?: { id: string; number: string; comment: string | null; userName: string | null; kind: string; counterpartBranchName: string | null } | null;
}

export interface InventoryDocumentListItemDTO {
  id: string;
  number: string;
  kind: string;
  reason: string;
  comment: string | null;
  createdAt: string;
  userName: string | null;
  branch: { id: string; name: string };
  destinationBranch: { id: string; name: string } | null;
  productsCount: number | string;
  unitsCount: number | string;
}

export interface InventoryDocumentDetailDTO {
  id: string;
  number: string;
  kind: string;
  reason: string;
  comment: string | null;
  createdAt: string;
  userName: string | null;
  branch: { id: string; name: string };
  destinationBranch: { id: string; name: string } | null;
  lines: Array<{ variantId: string; sku: string; productName: string; type: string; quantity: number | string; branchName: string | null; unitCost?: number | string | null; balanceAfter?: number | string | null }>;
}

export interface InventoryDocumentDTO {
  id: string;
  number: string;
  kind: string;
  reason: string;
  comment: string | null;
  branchId: string;
  destinationBranchId?: string | null;
  createdAt: string;
  lines: { variantId: string; sku: string; quantity: number | string; type: string }[];
}
