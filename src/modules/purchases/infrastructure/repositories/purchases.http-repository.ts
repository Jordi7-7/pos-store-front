import { apiClient } from '@/lib/apiClient';
import type { PaginatedResult } from '@/shared/domain/value-objects/paginated';
import type {
  BulkImportInput,
  ImportValidation,
  ImportValidationItem,
  PurchasesQuery,
  PurchasesRepository,
  RegisterPurchaseInput,
} from '../../application/ports/purchases.repository';
import type { PurchaseEntity } from '../../domain/entities/purchase.entity';
import type { PaginatedPurchasesDto, PurchaseDto } from '../dtos/purchase.dto';
import { toPurchaseEntity } from '../mappers/purchase.mapper';

export class PurchasesHttpRepository implements PurchasesRepository {
  async list(query?: PurchasesQuery): Promise<PaginatedResult<PurchaseEntity>> {
    const params = new URLSearchParams();
    if (query?.branchId) params.set('branchId', query.branchId);
    if (query?.startDate) params.set('startDate', query.startDate);
    if (query?.endDate) params.set('endDate', query.endDate);
    if (query?.supplierId) params.set('supplierId', query.supplierId);
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));
    const res = await apiClient.get<PaginatedPurchasesDto>(`/purchases${params.size ? `?${params}` : ''}`);
    return { data: res.data.map(toPurchaseEntity), meta: res.meta };
  }

  async register(input: RegisterPurchaseInput): Promise<PurchaseEntity> {
    return toPurchaseEntity(await apiClient.post<PurchaseDto>('/purchases', input));
  }

  cancel(id: string): Promise<void> {
    return apiClient.patch<void>(`/purchases/${id}/cancel`, {});
  }

  validateImport(items: ImportValidationItem[]): Promise<ImportValidation> {
    return apiClient.post<ImportValidation>('/purchases/validate-import', { items });
  }

  async import(input: BulkImportInput): Promise<PurchaseEntity> {
    return toPurchaseEntity(await apiClient.post<PurchaseDto>('/purchases/import', input));
  }
}
