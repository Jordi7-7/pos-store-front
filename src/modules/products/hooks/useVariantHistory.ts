import { useQuery } from '@tanstack/react-query';
import { productsService } from '../services/products.service';
import { toInventoryMovementEntity, toVariantBatchEntity } from '../mappers/inventory.mapper';
import type {
  InventoryMovementDTO,
  VariantBatchItemDTO,
  ProductHistoryPurchaseDTO,
  ProductHistorySaleDTO,
  PaginatedResult,
} from '../types/inventory.types';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';

export const useInventoryMovementsByVariant = (
  variantId?: string,
  page = 1,
  limit = 10,
  branchId?: string,
) => {
  const { tenantId, isAuthenticated } = useAuthStore();
  const movementsQuery = useQuery<PaginatedResult<InventoryMovementDTO>>({
    queryKey: ['variant-movements', tenantId, variantId, page, limit, branchId],
    queryFn: () => productsService.getInventoryMovementsByVariant(variantId!, page, limit, branchId),
    enabled: isAuthenticated && !!tenantId && !!variantId,
  });

  const rawMovements = movementsQuery.data?.data || [];
  const movementEntities = rawMovements.map(toInventoryMovementEntity);

  return {
    movements: rawMovements,
    movementEntities,
    meta: movementsQuery.data?.meta || { total: 0, page, limit, totalPages: 1 },
    isLoading: movementsQuery.isLoading,
    isError: movementsQuery.isError,
  };
};

export const useVariantBatches = (
  variantId?: string,
  page = 1,
  limit = 10,
  branchId?: string,
) => {
  const { tenantId, isAuthenticated } = useAuthStore();
  const query = useQuery<PaginatedResult<VariantBatchItemDTO>>({
    queryKey: ['variant-batches', tenantId, variantId, page, limit, branchId],
    queryFn: () => productsService.getVariantBatches(variantId!, page, limit, branchId),
    enabled: isAuthenticated && !!tenantId && !!variantId,
  });

  const rawBatches = query.data?.data || [];
  const batchEntities = rawBatches.map(toVariantBatchEntity);

  return {
    batches: rawBatches,
    batchEntities,
    meta: query.data?.meta || { total: 0, page, limit, totalPages: 1 },
    isLoading: query.isLoading,
    isError: query.isError,
  };
};

export const useVariantSales = (
  variantId?: string,
  page = 1,
  limit = 10,
  branchId?: string,
) => {
  const { tenantId, isAuthenticated } = useAuthStore();
  const query = useQuery<PaginatedResult<ProductHistorySaleDTO>>({
    queryKey: ['variant-sales', tenantId, variantId, page, limit, branchId],
    queryFn: () => productsService.getVariantSales(variantId!, page, limit, branchId),
    enabled: isAuthenticated && !!tenantId && !!variantId,
  });

  return {
    sales: query.data?.data || [],
    meta: query.data?.meta || { total: 0, page, limit, totalPages: 1 },
    isLoading: query.isLoading,
    isError: query.isError,
  };
};

export const useVariantPurchases = (
  variantId?: string,
  page = 1,
  limit = 10,
  branchId?: string,
) => {
  const { tenantId, isAuthenticated } = useAuthStore();
  const query = useQuery<PaginatedResult<ProductHistoryPurchaseDTO>>({
    queryKey: ['variant-purchases', tenantId, variantId, page, limit, branchId],
    queryFn: () => productsService.getVariantPurchases(variantId!, page, limit, branchId),
    enabled: isAuthenticated && !!tenantId && !!variantId,
  });

  return {
    purchases: query.data?.data || [],
    meta: query.data?.meta || { total: 0, page, limit, totalPages: 1 },
    isLoading: query.isLoading,
    isError: query.isError,
  };
};
