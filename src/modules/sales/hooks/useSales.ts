import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesService } from '../services/sales.service';
import type { ProcessSaleInput, OpenCashSessionInput, RegisterExpenseInput, ProcessRefundInput } from '../services/sales.service';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';

export const useSales = () => {
  const { tenantId, isAuthenticated } = useAuthStore();

  const salesQuery = useQuery({
    queryKey: ['sales', tenantId],
    queryFn: () => salesService.getSales(),
    enabled: isAuthenticated && !!tenantId,
  });

  return {
    sales: salesQuery.data || [],
    isLoading: salesQuery.isLoading,
    isError: salesQuery.isError,
  };
};

export const useOpenCashSession = () => {
  const queryClient = useQueryClient();
  const openCashMutation = useMutation({
    mutationFn: (input: OpenCashSessionInput) => salesService.openCashSession(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-cash-session'] });
    }
  });

  return {
    openSession: openCashMutation.mutateAsync,
    isOpening: openCashMutation.isPending,
  };
};

export const useCloseCashSession = () => {
  const queryClient = useQueryClient();
  const closeCashMutation = useMutation({
    mutationFn: ({ id, closingBalance }: { id: string; closingBalance: number }) =>
      salesService.closeCashSession(id, closingBalance),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-cash-session'] });
    }
  });

  return {
    closeSession: closeCashMutation.mutateAsync,
    isClosing: closeCashMutation.isPending,
  };
};

export const useRegisterExpense = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthStore();

  const expenseMutation = useMutation({
    mutationFn: (input: RegisterExpenseInput) => salesService.registerExpense(input),
    onSuccess: () => {
      // Invalidate sales metrics/expenses on success
      queryClient.invalidateQueries({ queryKey: ['cash-session-details'] });
    },
  });

  return {
    registerExpense: expenseMutation.mutateAsync,
    isRegistering: expenseMutation.isPending,
  };
};

export const useProcessSale = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthStore();

  const processSaleMutation = useMutation({
    mutationFn: (input: ProcessSaleInput) => salesService.processSale(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', tenantId] }); // update stock
      queryClient.invalidateQueries({ queryKey: ['cash-session-details'] });
    },
  });

  return {
    processSale: processSaleMutation.mutateAsync,
    isProcessing: processSaleMutation.isPending,
  };
};

export const useActiveCashSession = (branchId?: string) => {
  const { isAuthenticated } = useAuthStore();
  const activeSessionQuery = useQuery({
    queryKey: ['active-cash-session', branchId],
    queryFn: () => salesService.getActiveCashSession(branchId),
    enabled: isAuthenticated && !!branchId,
  });

  return {
    activeSession: activeSessionQuery.data || null,
    isLoading: activeSessionQuery.isLoading,
    refetchActiveSession: activeSessionQuery.refetch,
  };
};

export const useExpenses = (params?: { cashSessionId?: string; branchId?: string }) => {
  const { tenantId, isAuthenticated } = useAuthStore();

  const expensesQuery = useQuery({
    queryKey: ['expenses', tenantId, params?.cashSessionId, params?.branchId],
    queryFn: () => salesService.getExpenses(params),
    enabled: isAuthenticated && !!tenantId,
  });

  return {
    expenses: expensesQuery.data || [],
    isLoading: expensesQuery.isLoading,
    isError: expensesQuery.isError,
    refetchExpenses: expensesQuery.refetch,
  };
};

export const useProcessRefund = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthStore();

  const processRefundMutation = useMutation({
    mutationFn: (input: ProcessRefundInput) => salesService.processRefund(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', tenantId] }); // restore stock
      queryClient.invalidateQueries({ queryKey: ['cash-session-details'] });
    },
  });

  return {
    processRefund: processRefundMutation.mutateAsync,
    isProcessing: processRefundMutation.isPending,
  };
};

export const useRefunds = (params?: { cashSessionId?: string; saleId?: string }) => {
  const { tenantId, isAuthenticated } = useAuthStore();

  const refundsQuery = useQuery({
    queryKey: ['refunds', tenantId, params?.cashSessionId, params?.saleId],
    queryFn: () => salesService.getRefunds(params),
    enabled: isAuthenticated && !!tenantId,
  });

  return {
    refunds: refundsQuery.data || [],
    isLoading: refundsQuery.isLoading,
    refetchRefunds: refundsQuery.refetch,
  };
};
