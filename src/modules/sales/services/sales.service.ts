import { apiClient } from '@/lib/apiClient';

export const PaymentMethod = {
  EFECTIVO: 'EFECTIVO',
  TRANSFERENCIA: 'TRANSFERENCIA',
  TARJETA: 'TARJETA',
  BILLETERA_DIGITAL: 'BILLETERA_DIGITAL',
} as const;

export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

export interface SaleItem {
  variantId: string;
  quantity: number;
  price: number;
}

export interface SalePayment {
  paymentMethod: PaymentMethod;
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
  cashSessionId?: string;
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
  },

  getActiveCashSession: async (branchId?: string): Promise<any> => {
    const url = branchId ? `/sales/cash-sessions/active?branchId=${branchId}` : '/sales/cash-sessions/active';
    return apiClient.get<any>(url);
  },

  getExpenses: async (params?: { cashSessionId?: string; branchId?: string }): Promise<any[]> => {
    let url = '/sales/expenses';
    const queryParams: string[] = [];
    if (params?.cashSessionId) queryParams.push(`cashSessionId=${params.cashSessionId}`);
    if (params?.branchId) queryParams.push(`branchId=${params.branchId}`);
    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`;
    }
    return apiClient.get<any[]>(url);
  }
};
