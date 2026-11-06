import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFormatters } from '@/modules/auth/presentation/hooks/useFormatters';
import { toSaleSummaryVM } from '../view-models/sale.vm';
import { salesRepository } from '../../infrastructure/dependencies';
import type { SalesPage } from '../../application/ports/sales.repository';
import { useIsAuthenticated, useTenantId } from '@/modules/auth/presentation/hooks/useSession';

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

  const salesQuery = useQuery<SalesPage, Error>({
    queryKey: ['sales-paginated', tenantId, params.startDate, params.endDate, params.page, params.limit, params.branchId],
    queryFn: () => salesRepository.list(params),
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
