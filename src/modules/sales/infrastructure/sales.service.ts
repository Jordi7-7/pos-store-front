import { apiClient } from '@/lib/apiClient';
import type { ActiveCashSession } from '@/modules/cash-sessions/domain/session-types';
import type { ProcessSaleInput, SaleReceipt } from '../application/ports/sales.repository';
import type {
  PaginatedSalesDTO,
  SaleDetailDTO,
  OpenCashSessionInput,
  RegisterExpenseInput,
  ProcessRefundInput,
} from './dtos/sales.dto';

export const salesService = {
  getPaginatedSales: async (params: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    branchId?: string;
  }): Promise<PaginatedSalesDTO> => {
    const query = new URLSearchParams();
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.branchId) query.set('branchId', params.branchId);
    query.set('page', String(params.page || 1));
    query.set('limit', String(params.limit || 10));
    return apiClient.get<PaginatedSalesDTO>(`/sales/paginated?${query.toString()}`);
  },

  getSaleByInvoice: async (invoiceNumber: string): Promise<SaleDetailDTO> => {
    return apiClient.get<SaleDetailDTO>(`/sales/invoice/${encodeURIComponent(invoiceNumber)}`);
  },

  processSale: async (input: ProcessSaleInput): Promise<SaleReceipt> => {
    return apiClient.post<SaleReceipt>('/sales', input);
  },

  openCashSession: async (input: OpenCashSessionInput): Promise<ActiveCashSession> => {
    return apiClient.post<ActiveCashSession>('/sales/cash-sessions/open', input);
  },

  registerExpense: async (input: RegisterExpenseInput): Promise<any> => {
    return apiClient.post('/sales/expenses', input);
  },

  processRefund: async (input: ProcessRefundInput): Promise<any> => {
    return apiClient.post('/sales/refunds', input);
  },

  getActiveCashSession: async (branchId?: string, cashRegisterId?: string): Promise<ActiveCashSession | null> => {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);
    if (cashRegisterId) params.append('cashRegisterId', cashRegisterId);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<ActiveCashSession | null>(`/sales/cash-sessions/active${queryString}`);
  },

  getExpenses: async (params?: { cashSessionId?: string; branchId?: string }): Promise<any[]> => {
    const query = new URLSearchParams();
    if (params?.cashSessionId) query.append('cashSessionId', params.cashSessionId);
    if (params?.branchId) query.append('branchId', params.branchId);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get<any[]>(`/sales/expenses${queryString}`);
  },

  getRefunds: async (params?: { cashSessionId?: string; saleId?: string }): Promise<any[]> => {
    const query = new URLSearchParams();
    if (params?.cashSessionId) query.append('cashSessionId', params?.cashSessionId);
    if (params?.saleId) query.append('saleId', params?.saleId);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get<any[]>(`/sales/refunds${queryString}`);
  },
};

