import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFormatters } from '@/modules/auth/hooks/useFormatters';
import { toSaleSummaryVM } from '../view-models/sale.vm';
import { salesService } from '../../infrastructure/sales.service';
import type { PaginatedSalesDTO } from '../../infrastructure/dtos/sales.dto';
import { toSaleSummaryEntities } from '../../infrastructure/mappers/sale.mapper';
import type { SaleSummaryEntity } from '../../domain/entities/sale.entity';
import { useIsAuthenticated, useTenantId } from '@/modules/auth/hooks/useSession';

export interface UsePaginatedSalesParams {
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
  branchId?: string;
}

export const usePaginatedSales = (params: UsePaginatedSalesParams) => {
  const tenantId = useTenantId();
  const isAuthenticated = useIsAuthenticated();
  const fmt = useFormatters();

  const salesQuery = useQuery<PaginatedSalesDTO, Error, { items: SaleSummaryEntity[]; meta: PaginatedSalesDTO['meta'] }>({
    queryKey: ['sales-paginated', tenantId, params.startDate, params.endDate, params.page, params.limit, params.branchId],
    queryFn: () => salesService.getPaginatedSales(params),
    select: (res) => ({
      items: toSaleSummaryEntities(res.data),
      meta: res.meta,
    }),
    enabled: isAuthenticated && !!tenantId,
  });

  const entities = salesQuery.data?.items;
  const sales = useMemo(() => (entities ?? []).map((entity) => toSaleSummaryVM(entity, fmt)), [entities, fmt]);

  return {
    sales,
    meta: salesQuery.data?.meta || { total: 0, page: params.page, limit: params.limit, totalPages: 1 },
    isLoading: salesQuery.isLoading,
    isError: salesQuery.isError,
    refetch: salesQuery.refetch,
  };
};
