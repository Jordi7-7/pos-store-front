import { apiClient } from '@/lib/apiClient';
import type { CashSessionHeader, CashSessionDetails } from '../types/cash-sessions.types';

export const cashSessionsService = {
  getCashSessions: async (branchId?: string): Promise<CashSessionHeader[]> => {
    const url = branchId ? `/sales/cash-sessions?branchId=${branchId}` : '/sales/cash-sessions';
    return apiClient.get<CashSessionHeader[]>(url);
  },
  getCashSessionDetails: async (id: string): Promise<CashSessionDetails> => {
    return apiClient.get<CashSessionDetails>(`/sales/cash-sessions/${id}/details`);
  }
};
