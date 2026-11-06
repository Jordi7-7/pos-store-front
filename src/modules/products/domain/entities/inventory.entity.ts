import { InventoryMovementType, BatchStatus } from '../enums';

/** Entidades de inventario: solo datos del negocio. Los textos de pantalla van en `presentation/view-models`. */

export interface InventoryMovementEntity {
  id: string;
  quantity: number;
  type: InventoryMovementType;
  reason: string;
  createdAt: Date;
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
  branchId: string;
  branchName: string;
  originName: string;
  originReference: string;
  sku: string;
  productName: string;
  initialQuantity: number;
  remainingQuantity: number;
  consumedQuantity: number;
  unitCost: number;
  totalCostValue: number;
  status: BatchStatus;
}

export interface LotItemEntity {
  id: string;
  createdAt: Date;
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
  totalCostValue: number;
  initialCostValue: number;
}

export interface InventoryLotEntity {
  id: string;
  purchaseOrderId: string | null;
  createdAt: Date;
  branchId: string;
  branchName: string;
  originType: string;
  originName: string;
  originReference: string;
  totalInitialQuantity: number;
  totalRemainingQuantity: number;
  hasStock: boolean;
  /** Porcentaje que queda del lote (0–100, sin redondear). */
  percentRemaining: number;
  totalCostValue: number;
  totalInitialCostValue: number;
  status: BatchStatus;
  items: LotItemEntity[];
}
