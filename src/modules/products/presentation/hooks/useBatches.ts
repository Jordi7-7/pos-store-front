import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFormatters } from '@/modules/auth/presentation/hooks/useFormatters';
import { useIsAuthenticated, useTenantId } from '@/modules/auth/presentation/hooks/useSession';
import type { PaginatedResult } from '@/shared/domain/value-objects/paginated';
import { inventoryRepository } from '../../infrastructure/dependencies';
import type { BatchesQuery } from '../../application/ports/inventory.repository';
import { toInventoryLotVM, type InventoryLotVM } from '../view-models/inventory.vm';

export type UseBatchesParams = BatchesQuery;

type Meta = PaginatedResult<unknown>['meta'];

export interface UseBatchesReturn {
  lots: InventoryLotVM[];
  meta: Meta;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

const DEFAULT_META: Meta = { total: 0, page: 1, limit: 10, totalPages: 1 };

export const useBatches = (params?: UseBatchesParams): UseBatchesReturn => {
  const tenantId = useTenantId();
  const isAuthenticated = useIsAuthenticated();
  const fmt = useFormatters();

  const batchesQuery = useQuery({
    queryKey: ['batches', tenantId, params?.branchId, params?.startDate, params?.endDate, params?.search, params?.page, params?.limit],
    queryFn: () => inventoryRepository.listBatches(params),
    enabled: isAuthenticated && !!tenantId,
  });

  const entities = batchesQuery.data?.data;
  const lots = useMemo(() => (entities ?? []).map((lot) => toInventoryLotVM(lot, fmt)), [entities, fmt]);

  return {
    lots,
    meta: batchesQuery.data?.meta ?? DEFAULT_META,
    isLoading: batchesQuery.isLoading,
    isFetching: batchesQuery.isFetching,
    isError: batchesQuery.isError,
    error: batchesQuery.error,
    refetch: batchesQuery.refetch,
  };
};
