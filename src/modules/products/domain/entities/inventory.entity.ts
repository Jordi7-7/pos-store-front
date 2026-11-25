import { InventoryDocumentKind, InventoryMovementCategory, InventoryMovementType, BatchStatus } from '../enums';

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

/** Una fila del historial global de movimientos (kardex) de la tienda. */
export interface InventoryMovementHistoryEntity {
  id: string;
  createdAt: Date;
  type: InventoryMovementType;
  /** Clase de operación; nula en filas escritas por una versión anterior de la API. */
  category: InventoryMovementCategory | null;
  /** Código del motivo tal como lo guarda el backend. */
  reason: string;
  quantity: number;
  /** Costo unitario con el que se movió y existencia tras el movimiento; nulos en filas anteriores. */
  unitCost: number | null;
  balanceAfter: number | null;
  variantId: string;
  sku: string;
  productName: string;
  originBranchName: string | null;
  destinationBranchName: string | null;
  document: MovementDocumentRef | null;
}

export interface InventoryDocumentEntity {
  id: string;
  number: string;
  kind: InventoryDocumentKind;
  reason: string;
  comment: string | null;
  branchId: string;
  /** Solo en traslados: la sucursal que recibe (`branchId` es la que envía). */
  destinationBranchId: string | null;
  createdAt: Date;
  lines: { variantId: string; sku: string; quantity: number; type: InventoryMovementType }[];
}

/** Una fila de la lista de documentos de inventario, con cuántos productos y unidades movió. */
export interface InventoryDocumentListItemEntity {
  id: string;
  number: string;
  kind: InventoryDocumentKind;
  reason: string;
  comment: string | null;
  createdAt: Date;
  userName: string | null;
  branchName: string;
  /** Solo en traslados: la sucursal que recibe (`branchName` es la que envía). */
  destinationBranchName: string | null;
  productsCount: number;
  unitsCount: number;
}

/** Una línea del kardex de un documento abierto, con el costo y el saldo con los que quedó. */
export interface InventoryDocumentDetailLineEntity {
  variantId: string;
  sku: string;
  productName: string;
  type: InventoryMovementType;
  quantity: number;
  /** La sucursal donde se movió el stock. */
  branchName: string | null;
  unitCost: number | null;
  balanceAfter: number | null;
}

/** Un documento de inventario con su cabecera completa y todas sus líneas. */
export interface InventoryDocumentDetailEntity {
  id: string;
  number: string;
  kind: InventoryDocumentKind;
  reason: string;
  comment: string | null;
  createdAt: Date;
  userName: string | null;
  branchName: string;
  /** Solo en traslados: la sucursal que recibe (`branchName` es la que envía). */
  destinationBranchName: string | null;
  lines: InventoryDocumentDetailLineEntity[];
}

/** Documento manual (entrada/salida) al que pertenece un movimiento del historial. */
export interface MovementDocumentRef {
  id: string;
  number: string;
  comment: string | null;
  userName: string | null;
  kind: InventoryDocumentKind;
  /** En un traslado, la otra sucursal: a dónde fue (si es la salida) o de dónde vino (si es la entrada). */
  counterpartBranchName: string | null;
}
