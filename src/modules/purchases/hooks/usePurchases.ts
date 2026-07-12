import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchasesService } from '../services/purchases.service';
import type { CreateSupplierInput, RegisterPurchaseInput } from '../services/purchases.service';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';

export const useSuppliers = () => {
  const { tenantId, isAuthenticated } = useAuthStore();

  const suppliersQuery = useQuery({
    queryKey: ['suppliers', tenantId],
    queryFn: () => purchasesService.getSuppliers(),
    enabled: isAuthenticated && !!tenantId,
  });

  return {
    suppliers: suppliersQuery.data || [],
    isLoading: suppliersQuery.isLoading,
    isError: suppliersQuery.isError,
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

export const usePurchases = () => {
  const { tenantId, isAuthenticated } = useAuthStore();

  const purchasesQuery = useQuery({
    queryKey: ['purchases', tenantId],
    queryFn: () => purchasesService.getPurchases(),
    enabled: isAuthenticated && !!tenantId,
  });

  return {
    purchases: purchasesQuery.data || [],
    isLoading: purchasesQuery.isLoading,
    isError: purchasesQuery.isError,
    refetchPurchases: purchasesQuery.refetch,
  };
};
