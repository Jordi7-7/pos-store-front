import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesService } from '../services/sales.service';
import type { OpenCashSessionInput } from '../types/sales.types';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';

export const useActiveCashSession = (branchId?: string, cashRegisterId?: string) => {
  const { isAuthenticated, user } = useAuthStore();
  const activeSessionQuery = useQuery({
    queryKey: ['active-cash-session', user?.id, branchId, cashRegisterId || 'default'],
    queryFn: () => salesService.getActiveCashSession(branchId, cashRegisterId),
    enabled: isAuthenticated && !!branchId,
    staleTime: 1000 * 30, // 30s cache to avoid rapid duplicate background re-fetches
  });

  return {
    activeSession: activeSessionQuery.data || null,
    isLoading: activeSessionQuery.isLoading,
    refetchActiveSession: activeSessionQuery.refetch,
  };
};

export const useOpenCashSession = () => {
  const queryClient = useQueryClient();
  const openCashMutation = useMutation({
    mutationFn: (input: OpenCashSessionInput) => salesService.openCashSession(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-cash-session'] });
    },
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
    },
  });

  return {
    closeSession: closeCashMutation.mutateAsync,
    isClosing: closeCashMutation.isPending,
  };
};
