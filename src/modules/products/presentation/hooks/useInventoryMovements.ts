import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFormatters } from '@/modules/auth/presentation/hooks/useFormatters';
import { useIsAuthenticated, useTenantId } from '@/modules/auth/presentation/hooks/useSession';
import type { PaginatedResult } from '@/shared/domain/value-objects/paginated';
import { inventoryRepository } from '../../infrastructure/dependencies';
import type { MovementsQuery } from '../../application/ports/inventory.repository';
import { toInventoryMovementHistoryVM, type InventoryMovementHistoryVM } from '../view-models/inventory.vm';

type Meta = PaginatedResult<unknown>['meta'];

const DEFAULT_META: Meta = { total: 0, page: 1, limit: 20, totalPages: 1 };

/** Historial global de movimientos de inventario (kardex), con los filtros pedidos. */
export const useInventoryMovements = (params: MovementsQuery) => {
  const tenantId = useTenantId();
  const isAuthenticated = useIsAuthenticated();
  const fmt = useFormatters();

  const query = useQuery({
    queryKey: ['inventory-movements', tenantId, params],
    queryFn: () => inventoryRepository.listMovements(params),
    enabled: isAuthenticated && !!tenantId,
  });

  const entities = query.data?.data;
  const movements: InventoryMovementHistoryVM[] = useMemo(() => (entities ?? []).map((movement) => toInventoryMovementHistoryVM(movement, fmt)), [entities, fmt]);

  return {
    movements,
    meta: query.data?.meta ?? DEFAULT_META,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
};
