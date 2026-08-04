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

export const purchasesService = {
  getSuppliers: async (): Promise<Supplier[]> => {
    return apiClient.get<Supplier[]>('/purchases/suppliers');
  },

  createSupplier: async (input: CreateSupplierInput): Promise<Supplier> => {
    return apiClient.post<Supplier>('/purchases/suppliers', input);
  },

  registerPurchase: async (input: RegisterPurchaseInput): Promise<any> => {
    return apiClient.post<any>('/purchases', input);
  },

  getPurchases: async (): Promise<any[]> => {
    return apiClient.get<any[]>('/purchases');
  }
};
