import { apiClient } from '@/lib/apiClient';

export interface CashRegisterItem {
  id: string;
  code: number;
  name: string;
  branchId: string;
  branchName: string;
  nextInvoiceNumber: number;
  isActive: boolean;
  isOpen: boolean;
  activeSession: {
    id: string;
    userId: string;
    userName: string;
    openedAt: string;
    openingBalance: number;
  } | null;
  assignedUserIds: string[];
}

export interface MyCashRegisterItem {
  id: string;
  code: number;
  name: string;
  branchId: string;
  branchName: string;
  isOpen: boolean;
}

export interface CreateCashRegisterInput {
  branchId: string;
  name: string;
}

export interface UpdateCashRegisterInput {
  name?: string;
  isActive?: boolean;
}

export const cashRegistersService = {
  getMyCashRegisters: async (branchId?: string): Promise<MyCashRegisterItem[]> => {
    const url = branchId ? `/cash-registers/me?branchId=${branchId}` : '/cash-registers/me';
    return apiClient.get<MyCashRegisterItem[]>(url);
  },

  getCashRegisters: async (branchId?: string): Promise<CashRegisterItem[]> => {
    const url = branchId ? `/cash-registers?branchId=${branchId}` : '/cash-registers';
    return apiClient.get<CashRegisterItem[]>(url);
  },

  createCashRegister: async (input: CreateCashRegisterInput): Promise<CashRegisterItem> => {
    return apiClient.post<CashRegisterItem>('/cash-registers', input);
  },

  updateCashRegister: async (id: string, input: UpdateCashRegisterInput): Promise<CashRegisterItem> => {
    return apiClient.put<CashRegisterItem>(`/cash-registers/${id}`, input);
  },

  assignUsers: async (id: string, userIds: string[]): Promise<{ success: boolean; message: string }> => {
    return apiClient.put<{ success: boolean; message: string }>(`/cash-registers/${id}/assign-users`, { userIds });
  },
};
