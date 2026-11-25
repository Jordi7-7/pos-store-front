import { apiClient } from '@/lib/apiClient';
import type { PaginatedResult } from '@/shared/domain/value-objects/paginated';
import type { BatchesQuery, CreateInventoryDocumentInput, DocumentsQuery, CreateStockCountInput, CreateStockTransferInput, InventoryRepository, MovementsQuery, StockCountSheetPage, StockCountSheetQuery, VariantHistoryQuery } from '../../application/ports/inventory.repository';
import type { ProductHistoryPurchase, ProductHistorySale } from '../../domain/entities/history.entity';
import type { InventoryLotEntity, InventoryMovementEntity, InventoryDocumentEntity, InventoryDocumentDetailEntity, InventoryDocumentListItemEntity, InventoryMovementHistoryEntity, VariantBatchEntity } from '../../domain/entities/inventory.entity';
import type { InventoryLotDTO, InventoryMovementDTO, InventoryDocumentDTO, InventoryDocumentDetailDTO, InventoryDocumentListItemDTO, InventoryMovementHistoryDTO, VariantBatchItemDTO } from '../dtos/inventory.dto';
import { toInventoryLotEntity, toInventoryMovementEntity, toInventoryDocumentEntity, toInventoryDocumentDetailEntity, toInventoryDocumentListItemEntity, toInventoryMovementHistoryEntity, toVariantBatchEntity } from '../mappers/inventory.mapper';

const page = <TDto, TEntity>(response: PaginatedResult<TDto>, convert: (dto: TDto) => TEntity): PaginatedResult<TEntity> => ({
  data: (response.data || []).map(convert),
  meta: response.meta,
});

/** `?page=1&limit=10&branchId=…` con los valores por defecto del historial. */
const historyPaging = ({ page: pageNumber = 1, limit = 10, branchId }: VariantHistoryQuery): string =>
  `page=${pageNumber}&limit=${limit}${branchId ? `&branchId=${encodeURIComponent(branchId)}` : ''}`;

/** Existencias, lotes y movimientos por HTTP: convierte las respuestas (DTO) en entidades del dominio. */
export class InventoryHttpRepository implements InventoryRepository {
  async createStockCount(input: CreateStockCountInput): Promise<InventoryDocumentEntity> {
    return toInventoryDocumentEntity(await apiClient.post<InventoryDocumentDTO>('/products/stock-counts', input));
  }

  async createTransfer(input: CreateStockTransferInput): Promise<InventoryDocumentEntity> {
    return toInventoryDocumentEntity(await apiClient.post<InventoryDocumentDTO>('/products/stock-transfers', input));
  }

  /** El servidor ya devuelve la lista con la forma que necesita el conteo. */
  stockCountSheet(query: StockCountSheetQuery): Promise<StockCountSheetPage> {
    const params = new URLSearchParams({ branchId: query.branchId });
    if (query.categoryId) params.append('categoryId', query.categoryId);
    if (query.onlyWithStock) params.append('onlyWithStock', 'true');
    if (query.after) params.append('after', query.after);
    if (query.limit) params.append('limit', String(query.limit));
    return apiClient.get<StockCountSheetPage>(`/products/stock-count-sheet?${params.toString()}`);
  }

  async listBatches(query?: BatchesQuery): Promise<PaginatedResult<InventoryLotEntity>> {
    const params = new URLSearchParams();
    if (query?.branchId) params.append('branchId', query.branchId);
    if (query?.startDate) params.append('startDate', query.startDate);
    if (query?.endDate) params.append('endDate', query.endDate);
    if (query?.search) params.append('search', query.search);
    if (query?.originTypes?.length) params.append('originTypes', query.originTypes.join(','));
    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));
    const queryString = params.toString();
    return page(await apiClient.get<PaginatedResult<InventoryLotDTO>>(`/batches${queryString ? `?${queryString}` : ''}`), toInventoryLotEntity);
  }

  async listMovements(query?: MovementsQuery): Promise<PaginatedResult<InventoryMovementHistoryEntity>> {
    const params = new URLSearchParams();
    const filters: Record<string, string | number | undefined> = {
      branchId: query?.branchId,
      type: query?.type,
      category: query?.category,
      variantId: query?.variantId,
      startDate: query?.startDate,
      endDate: query?.endDate,
      search: query?.search,
      page: query?.page,
      limit: query?.limit,
    };
    for (const [key, value] of Object.entries(filters)) if (value !== undefined && value !== '') params.append(key, String(value));
    const queryString = params.toString();
    return page(
      await apiClient.get<PaginatedResult<InventoryMovementHistoryDTO>>(`/products/inventory-movements${queryString ? `?${queryString}` : ''}`),
      toInventoryMovementHistoryEntity,
    );
  }

  async listDocuments(query?: DocumentsQuery): Promise<PaginatedResult<InventoryDocumentListItemEntity>> {
    const params = new URLSearchParams();
    const filters: Record<string, string | number | undefined> = {
      branchId: query?.branchId,
      kind: query?.kind,
      search: query?.search,
      startDate: query?.startDate,
      endDate: query?.endDate,
      page: query?.page,
      limit: query?.limit,
    };
    for (const [key, value] of Object.entries(filters)) if (value !== undefined && value !== '') params.append(key, String(value));
    const queryString = params.toString();
    return page(
      await apiClient.get<PaginatedResult<InventoryDocumentListItemDTO>>(`/products/inventory-documents${queryString ? `?${queryString}` : ''}`),
      toInventoryDocumentListItemEntity,
    );
  }

  async getDocument(id: string): Promise<InventoryDocumentDetailEntity> {
    return toInventoryDocumentDetailEntity(await apiClient.get<InventoryDocumentDetailDTO>(`/products/inventory-documents/${encodeURIComponent(id)}`));
  }

  async createDocument(input: CreateInventoryDocumentInput): Promise<InventoryDocumentEntity> {
    return toInventoryDocumentEntity(await apiClient.post<InventoryDocumentDTO>('/products/inventory-documents', input));
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
