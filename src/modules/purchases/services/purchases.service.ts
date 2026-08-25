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
  email: string;
  phone: string;
  address: string;
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
  supplier?: Supplier | null;
  branch?: {
    id: string;
    name: string;
  } | null;
  items: PurchaseItem[];
}

export const purchasesService = {
  getSuppliers: async (): Promise<Supplier[]> => {
    return apiClient.get<Supplier[]>('/purchases/suppliers');
  },

  createSupplier: async (input: CreateSupplierInput): Promise<Supplier> => {
    return apiClient.post<Supplier>('/purchases/suppliers', input);
  },

  registerPurchase: async (input: RegisterPurchaseInput): Promise<Purchase> => {
    return apiClient.post<Purchase>('/purchases', input);
  },

  getPurchases: async (): Promise<Purchase[]> => {
    return apiClient.get<Purchase[]>('/purchases');
  }
};
