import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchasesService } from '../services/purchases.service';
import type { RegisterPurchaseInput, GetPurchasesParams, PaginatedPurchasesResponse } from '../types/purchases.types';
import { toPurchaseEntities } from '../mappers/purchase.mapper';
import type { PurchaseEntity } from '../entities/purchase.entity';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';

export const useRegisterPurchase = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthStore();

  const registerPurchaseMutation = useMutation({
    mutationFn: (input: RegisterPurchaseInput) => purchasesService.registerPurchase(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['purchases', tenantId] });
    },
  });

  return {
    registerPurchase: registerPurchaseMutation.mutateAsync,
    isRegistering: registerPurchaseMutation.isPending,
  };
};

export const usePurchases = (params?: GetPurchasesParams | string) => {
  const { tenantId, isAuthenticated } = useAuthStore();
  const normalizedParams: GetPurchasesParams | undefined =
    typeof params === 'string'
      ? { branchId: params }
      : params;

  const purchasesQuery = useQuery<PaginatedPurchasesResponse, Error, { items: PurchaseEntity[]; meta: PaginatedPurchasesResponse['meta'] }>({
    queryKey: [
      'purchases',
      tenantId,
      normalizedParams?.branchId,
      normalizedParams?.startDate,
      normalizedParams?.endDate,
      normalizedParams?.supplierId,
      normalizedParams?.page,
      normalizedParams?.limit,
    ],
    queryFn: () => purchasesService.getPurchases(normalizedParams),
    select: (res) => ({
      items: toPurchaseEntities(res.data),
      meta: res.meta,
    }),
    enabled: isAuthenticated && !!tenantId,
  });

  return {
    purchases: purchasesQuery.data?.items || [],
    meta: purchasesQuery.data?.meta || {
      total: 0,
      page: normalizedParams?.page || 1,
      limit: normalizedParams?.limit || 10,
      totalPages: 1,
    },
    isLoading: purchasesQuery.isLoading,
    isError: purchasesQuery.isError,
    refetchPurchases: purchasesQuery.refetch,
  };
};

export const useCancelPurchase = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthStore();

  const cancelMutation = useMutation({
    mutationFn: (purchaseOrderId: string) =>
      purchasesService.cancelPurchase(purchaseOrderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['products', tenantId] });
    },
  });

  return {
    cancelPurchase: cancelMutation.mutateAsync,
    isCancelling: cancelMutation.isPending,
    cancellingId: cancelMutation.variables,
  };
};
