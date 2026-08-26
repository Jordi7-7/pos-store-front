import { useQuery } from '@tanstack/react-query';
import { cashSessionsService } from '../services/cash-sessions.service';
import type { CashSessionHeader, CashSessionDetails } from '../types/cash-sessions.types';

export const useCashSessionsList = (branchId?: string) => {
  const { data: sessions = [], isLoading, refetch } = useQuery<CashSessionHeader[]>({
    queryKey: ['cash-sessions', branchId],
    queryFn: () => cashSessionsService.getCashSessions(branchId),
  });

  return {
    sessions,
    isLoading,
    refetch,
  };
};

export const useCashSessionDetailsQuery = (sessionId: string | null) => {
  const { data: details = null, isLoading } = useQuery<CashSessionDetails | null>({
    queryKey: ['cash-session-details', sessionId],
    queryFn: () => {
      if (!sessionId) return Promise.resolve(null);
      return cashSessionsService.getCashSessionDetails(sessionId);
    },
    enabled: !!sessionId,
  });

  return {
    details,
    isLoading,
  };
};
