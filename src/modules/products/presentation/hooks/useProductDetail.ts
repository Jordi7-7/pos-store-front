import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFormatters } from '@/modules/auth/presentation/hooks/useFormatters';
import { useIsAuthenticated, useTenantId } from '@/modules/auth/presentation/hooks/useSession';
import { productsRepository } from '../../infrastructure/dependencies';
import type { ProductEntity } from '../../domain/entities/product.entity';
import { toProductVM } from '../view-models/product.vm';

export const useProductDetail = (productId?: string, enabled = true) => {
  const tenantId = useTenantId();
  const isAuthenticated = useIsAuthenticated();
  const fmt = useFormatters();
  const query = useQuery<ProductEntity>({
    queryKey: ['product-detail', tenantId, productId],
    queryFn: () => productsRepository.getById(productId!),
    enabled: enabled && isAuthenticated && !!tenantId && !!productId,
  });

  const entity = query.data;
  const product = useMemo(() => (entity ? toProductVM(entity, fmt) : null), [entity, fmt]);

  return { product, isLoading: query.isLoading, isError: query.isError };
};
