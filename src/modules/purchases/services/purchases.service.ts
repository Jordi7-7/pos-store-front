import { apiClient } from '@/lib/apiClient';

export interface Supplier {
  id: string;
  identityNumber: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface CreateSupplierInput {
  identityNumber: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface UpdateSupplierInput {
  identityNumber?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface RegisterPurchaseInput {
  supplierId?: string;
  branchId: string;
  invoiceNumber?: string;
  items: {
    variantId: string;
    quantity: number;
    purchasePrice: number;
  }[];
}

export interface PurchaseItem {
  id: string;
  quantity: number;
  purchasePrice: number;
  unitCost?: number;
  variant: {
    id: string;
    sku: string;
    product: {
      name: string;
    };
  };
}

export interface Purchase {
  id: string;
  invoiceNumber?: string;
  createdAt: string;
  status: string;
  totalAmount: number;
  /** True only if the order is COMPLETED and no units have been sold yet */
  isCancellable: boolean;
  supplier?: Supplier | null;
  branch?: {
    id: string;
    name: string;
  } | null;
  items: PurchaseItem[];
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedPurchasesResponse {
  data: Purchase[];
  meta: PaginationMeta;
}

export interface GetPurchasesParams {
  branchId?: string;
  startDate?: string;
  endDate?: string;
  supplierId?: string;
  page?: number;
  limit?: number;
}

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
};
