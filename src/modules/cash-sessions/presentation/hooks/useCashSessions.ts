import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFormatters } from '@/modules/auth/presentation/hooks/useFormatters';
import { cashSessionsRepository } from '../../infrastructure/dependencies';
import type { CashSessionDetailsEntity, CashSessionHeaderEntity } from '../../domain/entities/cash-session.entity';
import { toCashSessionDetailsVM, toCashSessionHeaderVM } from '../view-models/cash-session.vm';

export const useCashSessionsList = (branchId?: string) => {
  const fmt = useFormatters();
  const { data: entities, isLoading, refetch } = useQuery<CashSessionHeaderEntity[], Error>({
    queryKey: ['cash-sessions', branchId],
    queryFn: () => cashSessionsRepository.list(branchId),
  });
  const sessions = useMemo(() => (entities ?? []).map((entity) => toCashSessionHeaderVM(entity, fmt)), [entities, fmt]);

  return { sessions, isLoading, refetch };
};

/**
 * Resumen de un turno: `entity` para la lógica (cierre, corte Z) y `details` con los textos ya
 * formateados con la moneda y la zona de la tienda para las pantallas.
 */
export const useCashSessionDetailsQuery = (sessionId: string | null, options?: { enabled?: boolean }) => {
  const isEnabled = options?.enabled !== undefined ? Boolean(options.enabled && sessionId) : !!sessionId;
  const fmt = useFormatters();

  const { data, isLoading, isError } = useQuery<CashSessionDetailsEntity | null, Error>({
    queryKey: ['cash-session-details', sessionId],
    queryFn: () => (sessionId ? cashSessionsRepository.getDetails(sessionId) : Promise.resolve(null)),
    enabled: isEnabled,
  });

  const entity = data ?? null;
  const details = useMemo(() => (entity ? toCashSessionDetailsVM(entity, fmt) : null), [entity, fmt]);

  return { details, entity, isLoading, isError };
};

/** Lee el resumen de un turno bajo demanda (p. ej. para imprimir su corte desde el historial). */
export const useFetchCashSessionDetails = () => ({
  fetchDetails: (sessionId: string): Promise<CashSessionDetailsEntity> => cashSessionsRepository.getDetails(sessionId),
});
