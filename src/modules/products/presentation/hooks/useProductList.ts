import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFormatters } from '@/modules/auth/presentation/hooks/useFormatters';
import { useIsAuthenticated, useTenantId } from '@/modules/auth/presentation/hooks/useSession';
import { productsRepository } from '../../infrastructure/dependencies';
import type { ProductsQuery } from '../../application/ports/products.repository';
import { toProductVM } from '../view-models/product.vm';

export const useProductList = (params?: ProductsQuery) => {
  const tenantId = useTenantId();
  const isAuthenticated = useIsAuthenticated();
  const fmt = useFormatters();

  const productsQuery = useQuery({
    queryKey: ['products', tenantId, params?.page, params?.limit, params?.search, params?.type, params?.branchId, params?.inStockOnly],
    queryFn: () => productsRepository.list(params),
    enabled: isAuthenticated && !!tenantId,
  });

  const entities = productsQuery.data?.data;
  const products = useMemo(() => (entities ?? []).map((entity) => toProductVM(entity, fmt)), [entities, fmt]);

  return {
    products,
    meta: productsQuery.data?.meta || { total: 0, page: 1, limit: 10, totalPages: 1 },
    isLoading: productsQuery.isLoading,
    isError: productsQuery.isError,
    refetch: productsQuery.refetch,
  };
};
