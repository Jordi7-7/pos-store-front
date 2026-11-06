import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { closeCashSession } from '@/modules/cash-sessions/infrastructure/dependencies';
import { salesService } from '../../infrastructure/sales.service';
import type { OpenCashSessionInput } from '../../infrastructure/dtos/sales.dto';
import { useIsAuthenticated, useUser } from '@/modules/auth/hooks/useSession';

export const useActiveCashSession = (branchId?: string, cashRegisterId?: string) => {
  const isAuthenticated = useIsAuthenticated();
  const user = useUser();
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
      queryClient.invalidateQueries({ queryKey: ['my-cash-registers'] });
      queryClient.invalidateQueries({ queryKey: ['cash-registers'] });
      queryClient.invalidateQueries({ queryKey: ['cash-sessions'] });
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
    mutationFn: ({ id, countedCash }: { id: string; countedCash: string }) =>
      closeCashSession.execute({ sessionId: id, countedCash }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['active-cash-session'] });
      queryClient.invalidateQueries({ queryKey: ['my-cash-registers'] });
      queryClient.invalidateQueries({ queryKey: ['cash-registers'] });
      queryClient.invalidateQueries({ queryKey: ['cash-sessions'] });
      if (variables?.id) {
        queryClient.removeQueries({ queryKey: ['cash-session-details', variables.id] });
      }
    },
  });

  return {
    closeSession: closeCashMutation.mutateAsync,
    isClosing: closeCashMutation.isPending,
  };
};
