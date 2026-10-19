import { useQuery } from '@tanstack/react-query';
import { salesService } from '../services/sales.service';
import type { PaginatedSalesDTO } from '../types/sales.types';
import { toSaleSummaryEntities } from '../mappers/sale.mapper';
import type { SaleSummaryEntity } from '../entities/sale.entity';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';

export interface UsePaginatedSalesParams {
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
  branchId?: string;
}

export const usePaginatedSales = (params: UsePaginatedSalesParams) => {
  const { tenantId, isAuthenticated } = useAuthStore();

  const salesQuery = useQuery<PaginatedSalesDTO, Error, { items: SaleSummaryEntity[]; meta: PaginatedSalesDTO['meta'] }>({
    queryKey: ['sales-paginated', tenantId, params.startDate, params.endDate, params.page, params.limit, params.branchId],
    queryFn: () => salesService.getPaginatedSales(params),
    select: (res) => ({
      items: toSaleSummaryEntities(res.data),
      meta: res.meta,
    }),
    enabled: isAuthenticated && !!tenantId,
  });

  return {
    sales: salesQuery.data?.items || [],
    meta: salesQuery.data?.meta || { total: 0, page: params.page, limit: params.limit, totalPages: 1 },
    isLoading: salesQuery.isLoading,
    isError: salesQuery.isError,
    refetch: salesQuery.refetch,
  };
};
