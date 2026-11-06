import { apiClient } from '@/lib/apiClient';
import type { PaginatedResult } from '@/shared/domain/value-objects/paginated';
import type { AdjustStockInput, BatchesQuery, InventoryRepository, VariantHistoryQuery } from '../../application/ports/inventory.repository';
import type { ProductHistoryPurchase, ProductHistorySale } from '../../domain/entities/history.entity';
import type { InventoryLotEntity, InventoryMovementEntity, VariantBatchEntity } from '../../domain/entities/inventory.entity';
import type { InventoryLotDTO, InventoryMovementDTO, VariantBatchItemDTO } from '../dtos/inventory.dto';
import { toInventoryLotEntity, toInventoryMovementEntity, toVariantBatchEntity } from '../mappers/inventory.mapper';

const page = <TDto, TEntity>(response: PaginatedResult<TDto>, convert: (dto: TDto) => TEntity): PaginatedResult<TEntity> => ({
  data: (response.data || []).map(convert),
  meta: response.meta,
});

/** `?page=1&limit=10&branchId=…` con los valores por defecto del historial. */
const historyPaging = ({ page: pageNumber = 1, limit = 10, branchId }: VariantHistoryQuery): string =>
  `page=${pageNumber}&limit=${limit}${branchId ? `&branchId=${encodeURIComponent(branchId)}` : ''}`;

/** Existencias, lotes y movimientos por HTTP: convierte las respuestas (DTO) en entidades del dominio. */
export class InventoryHttpRepository implements InventoryRepository {
  async listBatches(query?: BatchesQuery): Promise<PaginatedResult<InventoryLotEntity>> {
    const params = new URLSearchParams();
    if (query?.branchId) params.append('branchId', query.branchId);
    if (query?.startDate) params.append('startDate', query.startDate);
    if (query?.endDate) params.append('endDate', query.endDate);
    if (query?.search) params.append('search', query.search);
    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));
    const queryString = params.toString();
    return page(await apiClient.get<PaginatedResult<InventoryLotDTO>>(`/batches${queryString ? `?${queryString}` : ''}`), toInventoryLotEntity);
  }

  async adjustStock(input: AdjustStockInput): Promise<InventoryMovementEntity> {
    return toInventoryMovementEntity(await apiClient.post<InventoryMovementDTO>('/products/stock-adjustments', input));
  }

  async variantMovements(query: VariantHistoryQuery): Promise<PaginatedResult<InventoryMovementEntity>> {
    const response = await apiClient.get<PaginatedResult<InventoryMovementDTO>>(
      `/products/inventory-movements-by-variant?variantId=${encodeURIComponent(query.variantId)}&${historyPaging(query)}`,
    );
    return page(response, toInventoryMovementEntity);
  }

  async variantBatches(query: VariantHistoryQuery): Promise<PaginatedResult<VariantBatchEntity>> {
    const response = await apiClient.get<PaginatedResult<VariantBatchItemDTO>>(`/batches/by-variant/${encodeURIComponent(query.variantId)}?${historyPaging(query)}`);
    return page(response, toVariantBatchEntity);
  }

  /** El servidor ya devuelve el historial con la forma de la entidad. */
  variantSales(query: VariantHistoryQuery): Promise<PaginatedResult<ProductHistorySale>> {
    return apiClient.get<PaginatedResult<ProductHistorySale>>(`/sales/by-variant/${encodeURIComponent(query.variantId)}?${historyPaging(query)}`);
  }

  variantPurchases(query: VariantHistoryQuery): Promise<PaginatedResult<ProductHistoryPurchase>> {
    return apiClient.get<PaginatedResult<ProductHistoryPurchase>>(`/purchases/by-variant/${encodeURIComponent(query.variantId)}?${historyPaging(query)}`);
  }
}
