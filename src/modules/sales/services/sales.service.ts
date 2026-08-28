import { apiClient } from '@/lib/apiClient';

export const PaymentMethod = {
  EFECTIVO: 'EFECTIVO',
  TARJETA: 'TARJETA',
} as const;

export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

export interface PaginatedSaleSummary {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  total: number;
  discountAmount: number;
  status: string;
  customer?: { id?: string; name?: string } | null;
}

export interface PaginatedSales {
  data: PaginatedSaleSummary[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface SaleItem {
  variantId: string;
  quantity: number;
  price: number;
  discountType?: string;
  discountRate?: number;
  discountAmount?: number;
}

export interface SaleItemResponse {
  id?: string;
  variantId: string;
  variant?: {
    sku?: string;
    product?: { name?: string };
    attributeValues?: Array<{ value: string; attribute?: { name?: string } }>;
  };
  // These fields are returned by GET /sales/invoice/:invoiceNumber.
  sku?: string;
  variantSku?: string;
  productName?: string;
  variantName?: string;
  attributes?: string;
  quantity: number;
  price: number;
  discountAmount?: number;
}

export interface SalePayment {
  id?: string;
  paymentMethod: PaymentMethod;
  amount: number;
}

export interface SaleDetailItem {
  saleItemId: string;
  variantId: string;
  productName: string;
  sku: string;
  attributes: string;
  quantity: number;
  refundedQty: number;
  refundableQty: number;
  price: number;
  cost: number;
  discountAmount: number;
  lineTotal: number;
}

export interface SaleRefund {
  id: string;
  createdAt: string;
  reason: string;
  totalRefunded: number;
  items: Array<{ id: string; variantId: string; sku: string; productName: string; quantity: number; priceRefunded: number }>;
}

export interface SaleDetail {
  id: string;
  invoiceNumber: string;
  total: number;
  subtotal: number;
  discountAmount: number;
  status: string;
  branch?: { id: string; name: string; address?: string } | null;
  customer?: { id: string; name: string } | null;
  user?: { id: string; name: string } | null;
  createdAt: string;
  items: SaleDetailItem[];
  payments: SalePayment[];
  refunds: SaleRefund[];
}

export interface ProcessSaleInput {
  branchId: string;
  cashSessionId: string;
  customerId?: string;
  discountType?: string;
  discountRate?: number;
  discountAmount?: number;
  items: SaleItem[];
  payments: SalePayment[];
}

export interface Sale {
  id: string;
  tenantId: string;
  branchId: string;
  cashSessionId: string;
  customerId: string | null;
  subtotal: number;
  total: number;
  discountType: string | null;
  discountRate: number | null;
  discountAmount: number;
  status: string;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
  invoiceNumber: string;
  items?: SaleItemResponse[];
  payments?: SalePayment[];
  branch?: { name?: string; address?: string };
  customer?: { name?: string; identityNumber?: string } | null;
  user?: { name?: string } | null;
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

export interface RefundItem {
  variantId: string;
  quantity: number;
}

export interface ProcessRefundInput {
  branchId: string;
  saleId: string;
  cashSessionId: string;
  reason: string;
  items: RefundItem[];
}

export const salesService = {
  getSales: async (): Promise<Sale[]> => {
    return apiClient.get<Sale[]>('/sales');
  },

  getPaginatedSales: async (params: { startDate?: string; endDate?: string; page?: number; limit?: number }): Promise<PaginatedSales> => {
    const query = new URLSearchParams();
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    query.set('page', String(params.page || 1));
    query.set('limit', String(params.limit || 10));
    return apiClient.get<PaginatedSales>(`/sales/paginated?${query.toString()}`);
  },

  getSaleByInvoice: async (invoiceNumber: string): Promise<SaleDetail> => {
    return apiClient.get<SaleDetail>(`/sales/invoice/${encodeURIComponent(invoiceNumber)}`);
  },

  processSale: async (input: ProcessSaleInput): Promise<Sale> => {
    return apiClient.post<Sale>('/sales', input);
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
  },

  processRefund: async (input: ProcessRefundInput): Promise<any> => {
    return apiClient.post<any>('/sales/refunds', input);
  },

  getRefunds: async (params?: { cashSessionId?: string; saleId?: string }): Promise<any[]> => {
    let url = '/sales/refunds';
    const queryParams: string[] = [];
    if (params?.cashSessionId) queryParams.push(`cashSessionId=${params.cashSessionId}`);
    if (params?.saleId) queryParams.push(`saleId=${params.saleId}`);
    if (queryParams.length > 0) url += `?${queryParams.join('&')}`;
    return apiClient.get<any[]>(url);
  },

};
