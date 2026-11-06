import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchasesRepository } from '../../infrastructure/dependencies';
import type { PurchasesQuery, RegisterPurchaseInput } from '../../application/ports/purchases.repository';
import type { PaginatedResult } from '@/shared/domain/value-objects/paginated';
import type { PurchaseEntity } from '../../domain/entities/purchase.entity';
import { toPurchaseVM } from '../view-models/purchase.vm';
import { useFormatters } from '@/modules/auth/presentation/hooks/useFormatters';
import { useIsAuthenticated, useTenantId } from '@/modules/auth/presentation/hooks/useSession';

export const useRegisterPurchase = () => {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();

  const mutation = useMutation({
    mutationFn: (input: RegisterPurchaseInput) => purchasesRepository.register(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['purchases', tenantId] });
    },
  });

  return { registerPurchase: mutation.mutateAsync, isRegistering: mutation.isPending };
};

export const usePurchases = (params?: PurchasesQuery | string) => {
  const tenantId = useTenantId();
  const isAuthenticated = useIsAuthenticated();
  const fmt = useFormatters();
  const query: PurchasesQuery | undefined = typeof params === 'string' ? { branchId: params } : params;

  const purchasesQuery = useQuery<PaginatedResult<PurchaseEntity>, Error>({
    queryKey: ['purchases', tenantId, query?.branchId, query?.startDate, query?.endDate, query?.supplierId, query?.page, query?.limit],
    queryFn: () => purchasesRepository.list(query),
    enabled: isAuthenticated && !!tenantId,
  });

  const purchases = useMemo(() => (purchasesQuery.data?.data ?? []).map((purchase) => toPurchaseVM(purchase, fmt)), [purchasesQuery.data, fmt]);

  return {
    purchases,
    meta: purchasesQuery.data?.meta || { total: 0, page: query?.page || 1, limit: query?.limit || 10, totalPages: 1 },
    isLoading: purchasesQuery.isLoading,
    isError: purchasesQuery.isError,
    refetchPurchases: purchasesQuery.refetch,
  };
};

export const useCancelPurchase = () => {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();

  const mutation = useMutation({
    mutationFn: (purchaseOrderId: string) => purchasesRepository.cancel(purchaseOrderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['products', tenantId] });
    },
  });

  return { cancelPurchase: mutation.mutateAsync, isCancelling: mutation.isPending, cancellingId: mutation.variables };
};
