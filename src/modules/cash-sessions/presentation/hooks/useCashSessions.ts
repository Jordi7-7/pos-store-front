import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFormatters } from '@/modules/auth/hooks/useFormatters';
import { cashSessionsService } from '../../infrastructure/cash-sessions.service';
import type { CashSessionHeader, CashSessionDetails } from '../../domain/session-types';
import type { CashSessionDetailsEntity, CashSessionHeaderEntity } from '../../domain/entities';
import { toCashSessionDetailsEntity, toCashSessionHeaderEntities } from '../../infrastructure/mappers';
import { toCashSessionDetailsVM, toCashSessionHeaderVM } from '../view-models/cash-session.vm';

export const useCashSessionsList = (branchId?: string) => {
  const fmt = useFormatters();
  const { data: entities, isLoading, refetch } = useQuery<CashSessionHeader[], Error, CashSessionHeaderEntity[]>({
    queryKey: ['cash-sessions', branchId],
    queryFn: () => cashSessionsService.getCashSessions(branchId),
    select: (data) => toCashSessionHeaderEntities(data),
  });
  const sessions = useMemo(() => (entities ?? []).map((entity) => toCashSessionHeaderVM(entity, fmt)), [entities, fmt]);

  return {
    sessions,
    isLoading,
    refetch,
  };
};

export const useCashSessionDetailsQuery = (sessionId: string | null, options?: { enabled?: boolean }) => {
  const isEnabled = options?.enabled !== undefined ? Boolean(options.enabled && sessionId) : !!sessionId;

  const { data: queryResult, isLoading, isError } = useQuery<CashSessionDetails | null, Error, { entity: CashSessionDetailsEntity | null; raw: CashSessionDetails | null }>({
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

  const fmt = useFormatters();
  const entity = queryResult?.entity ?? null;
  const details = useMemo(() => (entity ? toCashSessionDetailsVM(entity, fmt) : null), [entity, fmt]);

  return {
    details,
    rawDetails: queryResult?.raw ?? null,
    isLoading,
    isError,
  };
};

export const useFetchCashSessionDetails = () => {
  const queryClient = useQueryClient();

  const fetchDetails = async (sessionId: string): Promise<CashSessionDetails> => {
    const data = await cashSessionsService.getCashSessionDetails(sessionId);
    queryClient.setQueryData(['cash-session-details', sessionId], data);
    return data;
  };

  return { fetchDetails };
};

