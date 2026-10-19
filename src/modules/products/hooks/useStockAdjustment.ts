import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsService } from '../services/products.service';
import type { AdjustStockInput } from '../types/inventory.types';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';

export const useStockAdjustment = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthStore();

  const mutation = useMutation({
    mutationFn: (input: AdjustStockInput) => productsService.adjustStock(input),
    onSuccess: (_movement, input) => {
      queryClient.invalidateQueries({ queryKey: ['products', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['variant-movements', tenantId, input.variantId] });
      queryClient.invalidateQueries({ queryKey: ['product-detail', tenantId] });
    },
  });

  return {
    adjustStock: mutation.mutateAsync,
    isAdjusting: mutation.isPending,
    isError: mutation.isError,
  };
};
