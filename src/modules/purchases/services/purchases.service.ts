import { apiClient } from '@/lib/apiClient';
import type {
  Supplier,
  CreateSupplierInput,
  UpdateSupplierInput,
  RegisterPurchaseInput,
  Purchase,
  PaginatedPurchasesResponse,
  GetPurchasesParams,
  ValidateImportPurchasesItemInput,
  ValidateImportPurchasesResult,
  BulkImportPurchasesInput,
} from '../types/purchases.types';


export const purchasesService = {
  getSuppliers: async (): Promise<Supplier[]> => {
    return apiClient.get<Supplier[]>('/purchases/suppliers');
  },

  createSupplier: async (input: CreateSupplierInput): Promise<Supplier> => {
    return apiClient.post<Supplier>('/purchases/suppliers', input);
  },

  updateSupplier: async (id: string, input: UpdateSupplierInput): Promise<Supplier> => {
    return apiClient.put<Supplier>(`/purchases/suppliers/${id}`, input);
  },

  deleteSupplier: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/purchases/suppliers/${id}`);
  },

  registerPurchase: async (input: RegisterPurchaseInput): Promise<Purchase> => {
    return apiClient.post<Purchase>('/purchases', input);
  },

  getPurchases: async (paramsObj?: GetPurchasesParams): Promise<PaginatedPurchasesResponse> => {
    const params = new URLSearchParams();
    if (paramsObj?.branchId) params.set('branchId', paramsObj.branchId);
    if (paramsObj?.startDate) params.set('startDate', paramsObj.startDate);
    if (paramsObj?.endDate) params.set('endDate', paramsObj.endDate);
    if (paramsObj?.supplierId) params.set('supplierId', paramsObj.supplierId);
    if (paramsObj?.page) params.set('page', String(paramsObj.page));
    if (paramsObj?.limit) params.set('limit', String(paramsObj.limit));
    return apiClient.get<PaginatedPurchasesResponse>(`/purchases${params.size ? `?${params}` : ''}`);
  },

  cancelPurchase: async (id: string): Promise<void> => {
    return apiClient.patch<void>(`/purchases/${id}/cancel`, {});
  },

  validateImport: async (
    items: ValidateImportPurchasesItemInput[]
  ): Promise<ValidateImportPurchasesResult> => {
    return apiClient.post<ValidateImportPurchasesResult>('/purchases/validate-import', { items });
  },

  importPurchases: async (
    input: BulkImportPurchasesInput
  ): Promise<Purchase> => {
    return apiClient.post<Purchase>('/purchases/import', input);
  },
};
