import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useIsAuthenticated, useUser } from '@/modules/auth/presentation/hooks/useSession';
import { cashSessionsRepository, closeCashSession, openCashSession, registerExpense } from '../../infrastructure/dependencies';
import type { OpenCashSessionCommand } from '../../application/open-cash-session';
import type { RegisterExpenseCommand } from '../../application/register-expense';

/** Turno de caja abierto del usuario en la sucursal (y caja) indicadas. */
export const useActiveCashSession = (branchId?: string, cashRegisterId?: string) => {
  const isAuthenticated = useIsAuthenticated();
  const user = useUser();
  const activeSessionQuery = useQuery({
    queryKey: ['active-cash-session', user?.id, branchId, cashRegisterId || 'default'],
    queryFn: () => cashSessionsRepository.getActive(branchId, cashRegisterId),
    enabled: isAuthenticated && !!branchId,
    staleTime: 1000 * 30, // 30s cache to avoid rapid duplicate background re-fetches
  });

  return {
    activeSession: activeSessionQuery.data || null,
    isLoading: activeSessionQuery.isLoading,
    refetchActiveSession: activeSessionQuery.refetch,
  };
};

/** Tras abrir o cerrar un turno cambian el turno activo, las cajas y el historial. */
const useRefreshShiftData = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['active-cash-session'] });
    queryClient.invalidateQueries({ queryKey: ['my-cash-registers'] });
    queryClient.invalidateQueries({ queryKey: ['cash-registers'] });
    queryClient.invalidateQueries({ queryKey: ['cash-sessions'] });
  };
};

export const useOpenCashSession = () => {
  const refresh = useRefreshShiftData();
  const mutation = useMutation({
    mutationFn: (command: OpenCashSessionCommand) => openCashSession.execute(command),
    onSuccess: refresh,
  });
  return { openSession: mutation.mutateAsync, isOpening: mutation.isPending };
};

export const useCloseCashSession = () => {
  const queryClient = useQueryClient();
  const refresh = useRefreshShiftData();
  const mutation = useMutation({
    mutationFn: ({ id, countedCash }: { id: string; countedCash: string }) => closeCashSession.execute({ sessionId: id, countedCash }),
    onSuccess: (_data, variables) => {
      refresh();
      if (variables?.id) queryClient.removeQueries({ queryKey: ['cash-session-details', variables.id] });
    },
  });
  return { closeSession: mutation.mutateAsync, isClosing: mutation.isPending };
};

export const useRegisterExpense = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (command: RegisterExpenseCommand) => registerExpense.execute(command),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cash-session-details'] }),
  });
  return { registerExpense: mutation.mutateAsync, isRegistering: mutation.isPending };
};
