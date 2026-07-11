import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesService } from '../services/sales.service';
import type { ProcessSaleInput, OpenCashSessionInput, RegisterExpenseInput } from '../services/sales.service';
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
  const openCashMutation = useMutation({
    mutationFn: (input: OpenCashSessionInput) => salesService.openCashSession(input),
  });

  return {
    openSession: openCashMutation.mutateAsync,
    isOpening: openCashMutation.isPending,
  };
};

export const useCloseCashSession = () => {
  const closeCashMutation = useMutation({
    mutationFn: ({ id, closingBalance }: { id: string; closingBalance: number }) => 
      salesService.closeCashSession(id, closingBalance),
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
      queryClient.invalidateQueries({ queryKey: ['sales', tenantId] });
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
      queryClient.invalidateQueries({ queryKey: ['sales', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['products', tenantId] }); // update stock
    },
  });

  return {
    processSale: processSaleMutation.mutateAsync,
    isProcessing: processSaleMutation.isPending,
  };
};
