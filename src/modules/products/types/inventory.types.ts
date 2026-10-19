import { InventoryMovementType, BatchOriginType, BatchStatus } from '../enums';

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

export interface AdjustStockInput {
  branchId: string;
  variantId: string;
  quantity: number;
  type: InventoryMovementType;
  comment?: string;
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

export interface ProductHistorySaleItemDTO {
  id: string;
  quantity: number;
  price: number;
  subtotal?: number;
  total?: number;
  variant?: {
    id: string;
    sku: string;
    attributeValues?: { id?: string; value: string }[];
    product?: { name: string };
  };
}

export interface ProductHistorySaleDTO {
  id: string;
  invoiceNumber?: string | null;
  createdAt: string;
  total: number;
  customer?: { name?: string } | null;
  payments?: { paymentMethod?: string; amount?: number }[];
  items?: ProductHistorySaleItemDTO[];
}

export interface ProductHistoryPurchaseItemDTO {
  id: string;
  quantity: number;
  unitPrice: number;
  total?: number;
  variant?: {
    id: string;
    sku: string;
    attributeValues?: { id?: string; value: string }[];
    product?: { name: string };
  };
}

export interface ProductHistoryPurchaseDTO {
  id: string;
  invoiceNumber?: string | null;
  createdAt: string;
  totalAmount: number;
  supplier?: { name?: string } | null;
  branch?: { name?: string } | null;
  items?: ProductHistoryPurchaseItemDTO[];
}

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
