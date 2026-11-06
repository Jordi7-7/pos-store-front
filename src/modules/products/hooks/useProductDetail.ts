import { useQuery } from '@tanstack/react-query';
import { productsService } from '../services/products.service';
import { toProductEntity } from '../mappers/product.mapper';
import type { ProductDTO } from '../types/product.types';
import { useIsAuthenticated, useTenantId } from '@/modules/auth/presentation/hooks/useSession';

export const useProductDetail = (productId?: string, enabled = true) => {
  const tenantId = useTenantId();
  const isAuthenticated = useIsAuthenticated();
  const query = useQuery<ProductDTO>({
    queryKey: ['product-detail', tenantId, productId],
    queryFn: () => productsService.getProductById(productId!),
    enabled: enabled && isAuthenticated && !!tenantId && !!productId,
  });

  const entity = query.data ? toProductEntity(query.data) : null;

  return {
    product: query.data,
    productEntity: entity,
    isLoading: query.isLoading,
    isError: query.isError,
  };
};
