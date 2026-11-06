import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFormatters } from '@/modules/auth/presentation/hooks/useFormatters';
import { useIsAuthenticated, useTenantId } from '@/modules/auth/presentation/hooks/useSession';
import type { PaginatedResult } from '@/shared/domain/value-objects/paginated';
import { inventoryRepository } from '../../infrastructure/dependencies';
import { toInventoryMovementVM, toVariantBatchVM } from '../view-models/inventory.vm';

/** Historial paginado de una variante: lo común de las cuatro pestañas (movimientos, lotes, ventas, compras). */
function useVariantHistory<T>(kind: string, fetch: () => Promise<PaginatedResult<T>>, variantId: string | undefined, page: number, limit: number, branchId?: string) {
  const tenantId = useTenantId();
  const isAuthenticated = useIsAuthenticated();
  const query = useQuery<PaginatedResult<T>>({
    queryKey: [kind, tenantId, variantId, page, limit, branchId],
    queryFn: fetch,
    enabled: isAuthenticated && !!tenantId && !!variantId,
  });
  return {
    items: query.data?.data,
    meta: query.data?.meta || { total: 0, page, limit, totalPages: 1 },
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export const useInventoryMovementsByVariant = (variantId?: string, page = 1, limit = 10, branchId?: string) => {
  const fmt = useFormatters();
  const { items, ...rest } = useVariantHistory('variant-movements', () => inventoryRepository.variantMovements({ variantId: variantId!, page, limit, branchId }), variantId, page, limit, branchId);
  const movements = useMemo(() => (items ?? []).map((movement) => toInventoryMovementVM(movement, fmt)), [items, fmt]);
  return { movements, ...rest };
};

export const useVariantBatches = (variantId?: string, page = 1, limit = 10, branchId?: string) => {
  const fmt = useFormatters();
  const { items, ...rest } = useVariantHistory('variant-batches', () => inventoryRepository.variantBatches({ variantId: variantId!, page, limit, branchId }), variantId, page, limit, branchId);
  const batches = useMemo(() => (items ?? []).map((batch) => toVariantBatchVM(batch, fmt)), [items, fmt]);
  return { batches, ...rest };
};

export const useVariantSales = (variantId?: string, page = 1, limit = 10, branchId?: string) => {
  const { items, ...rest } = useVariantHistory('variant-sales', () => inventoryRepository.variantSales({ variantId: variantId!, page, limit, branchId }), variantId, page, limit, branchId);
  return { sales: items ?? [], ...rest };
};

export const useVariantPurchases = (variantId?: string, page = 1, limit = 10, branchId?: string) => {
  const { items, ...rest } = useVariantHistory('variant-purchases', () => inventoryRepository.variantPurchases({ variantId: variantId!, page, limit, branchId }), variantId, page, limit, branchId);
  return { purchases: items ?? [], ...rest };
};
