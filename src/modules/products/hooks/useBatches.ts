import { useQuery } from '@tanstack/react-query';
import { productsService } from '../services/products.service';
import { toInventoryLotEntity } from '../mappers';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';
import type { InventoryLotEntity } from '../entities';
import type { PaginatedResult, InventoryLotDTO } from '../types';

export interface UseBatchesParams {
  branchId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UseBatchesReturn {
  lots: InventoryLotEntity[];
  meta: PaginatedResult<unknown>['meta'];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

const DEFAULT_META: PaginatedResult<unknown>['meta'] = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
};

const EMPTY_LOTS: InventoryLotEntity[] = [];

// Selector con referencia 100% estable fuera del hook:
const transformBatches = (res: PaginatedResult<InventoryLotDTO>) => ({
  lots: (res.data || []).map(toInventoryLotEntity),
  meta: res.meta || DEFAULT_META,
});

export const useBatches = (params?: UseBatchesParams): UseBatchesReturn => {
  const { tenantId, isAuthenticated } = useAuthStore();

  const batchesQuery = useQuery({
    queryKey: [
      'batches',
      tenantId,
      params?.branchId,
      params?.startDate,
      params?.endDate,
      params?.search,
      params?.page,
      params?.limit,
    ],
    queryFn: () => productsService.getBatches(params),
    enabled: isAuthenticated && !!tenantId,
    select: transformBatches,
  });

  return {
    lots: batchesQuery.data?.lots ?? EMPTY_LOTS,
    meta: batchesQuery.data?.meta ?? DEFAULT_META,
    isLoading: batchesQuery.isLoading,
    isFetching: batchesQuery.isFetching,
    isError: batchesQuery.isError,
    error: batchesQuery.error,
    refetch: batchesQuery.refetch,
  };
};
