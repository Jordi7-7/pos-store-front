import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchasesService } from '../services/purchases.service';
import type { CreateSupplierInput, UpdateSupplierInput, RegisterPurchaseInput } from '../services/purchases.service';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';

export const useSuppliers = (options?: { enabled?: boolean }) => {
  const { tenantId, isAuthenticated } = useAuthStore();

  const suppliersQuery = useQuery({
    queryKey: ['suppliers', tenantId],
    queryFn: () => purchasesService.getSuppliers(),
    enabled: (options?.enabled ?? true) && isAuthenticated && !!tenantId,
  });

  return {
    suppliers: suppliersQuery.data || [],
    isLoading: suppliersQuery.isLoading,
    isError: suppliersQuery.isError,
    refetch: suppliersQuery.refetch,
  };
};

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthStore();

  const createSupplierMutation = useMutation({
    mutationFn: (input: CreateSupplierInput) => purchasesService.createSupplier(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', tenantId] });
    },
  });

  return {
    createSupplier: createSupplierMutation.mutateAsync,
    isCreating: createSupplierMutation.isPending,
  };
};

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthStore();

  const updateSupplierMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSupplierInput }) =>
      purchasesService.updateSupplier(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', tenantId] });
    },
  });

  return {
    updateSupplier: updateSupplierMutation.mutateAsync,
    isUpdating: updateSupplierMutation.isPending,
  };
};

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthStore();

  const deleteSupplierMutation = useMutation({
    mutationFn: (id: string) => purchasesService.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', tenantId] });
    },
  });

  return {
    deleteSupplier: deleteSupplierMutation.mutateAsync,
    isDeleting: deleteSupplierMutation.isPending,
  };
};

export const useRegisterPurchase = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthStore();

  const registerPurchaseMutation = useMutation({
    mutationFn: (input: RegisterPurchaseInput) => purchasesService.registerPurchase(input),
    onSuccess: () => {
      // Invalidate products inventory/stock after purchasing
      queryClient.invalidateQueries({ queryKey: ['products', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['purchases', tenantId] });
    },
  });

  return {
    registerPurchase: registerPurchaseMutation.mutateAsync,
    isRegistering: registerPurchaseMutation.isPending,
  };
};

export const usePurchases = (branchId?: string) => {
  const { tenantId, isAuthenticated } = useAuthStore();

  const purchasesQuery = useQuery({
    queryKey: ['purchases', tenantId, branchId],
    queryFn: () => purchasesService.getPurchases(branchId),
    enabled: isAuthenticated && !!tenantId,
  });

  return {
    purchases: purchasesQuery.data || [],
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
      // Invalidate purchases list so isCancellable and status refresh
      queryClient.invalidateQueries({ queryKey: ['purchases', tenantId] });
      // Also invalidate products since stock was reversed
      queryClient.invalidateQueries({ queryKey: ['products', tenantId] });
    },
  });

  return {
    cancelPurchase: cancelMutation.mutateAsync,
    isCancelling: cancelMutation.isPending,
    cancellingId: cancelMutation.variables,
  };
};
