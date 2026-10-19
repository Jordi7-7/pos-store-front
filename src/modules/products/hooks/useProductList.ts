import { useQuery } from '@tanstack/react-query';
import { productsService } from '../services/products.service';
import { toProductEntities } from '../mappers/product.mapper';
import type { ProductType } from '../enums';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';

export const useProductList = (params?: { page?: number; limit?: number; search?: string; type?: ProductType }) => {
  const { tenantId, isAuthenticated } = useAuthStore();

  const productsQuery = useQuery({
    queryKey: ['products', tenantId, params?.page, params?.limit, params?.search, params?.type],
    queryFn: () => productsService.getProducts(params),
    enabled: isAuthenticated && !!tenantId,
    select: (response) => ({
      data: toProductEntities(response.data),
      raw: response.data,
      meta: response.meta,
    }),
  });

  return {
    products: productsQuery.data?.data || [],
    rawProducts: productsQuery.data?.raw || [],
    meta: productsQuery.data?.meta || { total: 0, page: 1, limit: 10, totalPages: 1 },
    isLoading: productsQuery.isLoading,
    isError: productsQuery.isError,
    refetch: productsQuery.refetch,
  };
};
