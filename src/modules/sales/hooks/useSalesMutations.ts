import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesService } from '../services/sales.service';
import type { ProcessSaleInput, RegisterExpenseInput, ProcessRefundInput } from '../types/sales.types';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';

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

export const useRegisterExpense = () => {
  const queryClient = useQueryClient();

  const expenseMutation = useMutation({
    mutationFn: (input: RegisterExpenseInput) => salesService.registerExpense(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-session-details'] });
    },
  });

  return {
    registerExpense: expenseMutation.mutateAsync,
    isRegistering: expenseMutation.isPending,
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
