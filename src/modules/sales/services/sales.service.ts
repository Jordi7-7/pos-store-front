import { apiClient } from '@/lib/apiClient';

export interface SaleItem {
  variantId: string;
  quantity: number;
  unitPrice: number;
}

export interface SalePayment {
  method: string; // CASH, CARD, etc.
  amount: number;
}

export interface ProcessSaleInput {
  branchId: string;
  cashSessionId: string;
  customerId?: string;
  items: SaleItem[];
  payments: SalePayment[];
}

export interface OpenCashSessionInput {
  branchId: string;
  openingBalance: number;
}

export interface RegisterExpenseInput {
  branchId: string;
  description: string;
  amount: number;
  category: string;
}

export const salesService = {
  getSales: async (): Promise<any[]> => {
    return apiClient.get<any[]>('/sales');
  },

  processSale: async (input: ProcessSaleInput): Promise<any> => {
    return apiClient.post<any>('/sales', input);
  },

  openCashSession: async (input: OpenCashSessionInput): Promise<any> => {
    return apiClient.post<any>('/sales/cash-sessions/open', input);
  },

  closeCashSession: async (id: string, closingBalance: number): Promise<any> => {
    return apiClient.post<any>(`/sales/cash-sessions/${id}/close`, { closingBalance });
  },

  registerExpense: async (input: RegisterExpenseInput): Promise<any> => {
    return apiClient.post<any>('/sales/expenses', input);
  }
};
