import { useQuery } from '@tanstack/react-query';
import { cashSessionsService } from '../services/cash-sessions.service';
import type { CashSessionHeader, CashSessionDetails } from '../types/cash-sessions.types';
import type { CashSessionDetailsEntity } from '../entities';
import { toCashSessionDetailsEntity } from '../mappers';

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

export const useCashSessionDetailsQuery = (sessionId: string | null, options?: { enabled?: boolean }) => {
  const isEnabled = options?.enabled !== undefined ? Boolean(options.enabled && sessionId) : !!sessionId;

  const { data: queryResult, isLoading } = useQuery<CashSessionDetails | null, Error, { entity: CashSessionDetailsEntity | null; raw: CashSessionDetails | null }>({
    queryKey: ['cash-session-details', sessionId],
    queryFn: () => {
      if (!sessionId) return Promise.resolve(null);
      return cashSessionsService.getCashSessionDetails(sessionId);
    },
    select: (data) => ({
      entity: data ? toCashSessionDetailsEntity(data) : null,
      raw: data,
    }),
    enabled: isEnabled,
  });

  return {
    details: queryResult?.entity ?? null,
    rawDetails: queryResult?.raw ?? null,
    isLoading,
  };
};

