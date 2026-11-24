import type { PaginatedResult } from '@/shared/domain/value-objects/paginated';
import type { InventoryLotEntity, InventoryMovementEntity, InventoryDocumentEntity, InventoryDocumentDetailEntity, InventoryMovementHistoryEntity, VariantBatchEntity } from '../../domain/entities/inventory.entity';
import type { ProductHistoryPurchase, ProductHistorySale } from '../../domain/entities/history.entity';
import type { BatchOriginType, InventoryDocumentKind, InventoryMovementCategory, InventoryMovementType } from '../../domain/enums';

export interface BatchesQuery {
  branchId?: string;
  /** Solo lotes de estos orígenes; vacío o ausente = todos. */
  originTypes?: readonly BatchOriginType[];
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateInventoryDocumentInput {
  branchId: string;
  kind: InventoryDocumentKind;
  reason: string;
  comment?: string;
  /** Identificador del intento: reenviarlo no repite la operación. */
  clientRequestId: string;
  /** `unitCost` solo en entradas; si falta, el servidor usa el costo de compra de la variante. */
  lines: { variantId: string; quantity: number; unitCost?: number }[];
}

export interface CreateStockCountInput {
  branchId: string;
  comment?: string;
  clientRequestId: string;
  /** Confirma que se aplique aunque el stock haya cambiado desde que se vio. */
  acceptStockChanges?: boolean;
  /** `counted` es lo contado; `expected` lo que el sistema decía al agregar la línea. */
  lines: { variantId: string; counted: number; expected: number; unitCost?: number }[];
}

export interface StockCountSheetQuery {
  branchId: string;
  categoryId?: string;
  onlyWithStock?: boolean;
  /** SKU de la última fila de la página anterior. */
  after?: string;
  limit?: number;
}

export interface StockCountSheetPage {
  items: { variantId: string; sku: string; productName: string; stock: number; purchasePrice: number }[];
  /** SKU desde el que pedir la siguiente página; `null` si no hay más. */
  nextAfter: string | null;
}

export interface CreateStockTransferInput {
  originBranchId: string;
  destinationBranchId: string;
  comment?: string;
  clientRequestId: string;
  lines: { variantId: string; quantity: number }[];
}

/** Filtros del historial global de movimientos. */
export interface MovementsQuery {
  branchId?: string;
  type?: InventoryMovementType;
  /** Clase de operación (`SALE`, `PURCHASE`, `TRANSFER`…). */
  category?: InventoryMovementCategory;
  variantId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/** Consulta paginada de lo que le pasó a una variante (opcionalmente en una sucursal). */
export interface VariantHistoryQuery {
  variantId: string;
  page?: number;
  limit?: number;
  branchId?: string;
}

/** Puerto de salida: existencias, lotes y movimientos de inventario. */
export interface InventoryRepository {
  listBatches(query?: BatchesQuery): Promise<PaginatedResult<InventoryLotEntity>>;
  listMovements(query?: MovementsQuery): Promise<PaginatedResult<InventoryMovementHistoryEntity>>;
  createDocument(input: CreateInventoryDocumentInput): Promise<InventoryDocumentEntity>;
  /** Un documento con todas sus líneas, para abrirlo desde el historial. */
  getDocument(id: string): Promise<InventoryDocumentDetailEntity>;
  createStockCount(input: CreateStockCountInput): Promise<InventoryDocumentEntity>;
  createTransfer(input: CreateStockTransferInput): Promise<InventoryDocumentEntity>;
  stockCountSheet(query: StockCountSheetQuery): Promise<StockCountSheetPage>;
  variantMovements(query: VariantHistoryQuery): Promise<PaginatedResult<InventoryMovementEntity>>;
  variantBatches(query: VariantHistoryQuery): Promise<PaginatedResult<VariantBatchEntity>>;
  variantSales(query: VariantHistoryQuery): Promise<PaginatedResult<ProductHistorySale>>;
  variantPurchases(query: VariantHistoryQuery): Promise<PaginatedResult<ProductHistoryPurchase>>;
}
