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

export interface RegisterPurchaseItemInput {
  variantId: string;
  quantity: number;
  purchasePrice: number;
}

export interface RegisterPurchaseInput {
  supplierId?: string;
  branchId: string;
  invoiceNumber?: string;
  items: RegisterPurchaseItemInput[];
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
