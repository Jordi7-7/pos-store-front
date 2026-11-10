import type { PaginatedResult } from '@/shared/domain/value-objects/paginated';
import type { InventoryLotEntity, InventoryMovementEntity, VariantBatchEntity } from '../../domain/entities/inventory.entity';
import type { ProductHistoryPurchase, ProductHistorySale } from '../../domain/entities/history.entity';
import type { BatchOriginType, InventoryMovementType } from '../../domain/enums';

export interface AdjustStockInput {
  branchId: string;
  variantId: string;
  quantity: number;
  type: InventoryMovementType;
  comment?: string;
}

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
  adjustStock(input: AdjustStockInput): Promise<InventoryMovementEntity>;
  variantMovements(query: VariantHistoryQuery): Promise<PaginatedResult<InventoryMovementEntity>>;
  variantBatches(query: VariantHistoryQuery): Promise<PaginatedResult<VariantBatchEntity>>;
  variantSales(query: VariantHistoryQuery): Promise<PaginatedResult<ProductHistorySale>>;
  variantPurchases(query: VariantHistoryQuery): Promise<PaginatedResult<ProductHistoryPurchase>>;
}
