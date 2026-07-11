import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsService } from '../services/products.service';
import type { CreateProductInput } from '../services/products.service';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';

export const useProducts = () => {
  const { tenantId, isAuthenticated } = useAuthStore();

  const productsQuery = useQuery({
    queryKey: ['products', tenantId],
    queryFn: () => productsService.getProducts(),
    enabled: isAuthenticated && !!tenantId,
  });

  return {
    products: productsQuery.data || [],
    isLoading: productsQuery.isLoading,
    isError: productsQuery.isError,
  };
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthStore();

  const createProductMutation = useMutation({
    mutationFn: (input: CreateProductInput) => productsService.createProduct(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', tenantId] });
    },
  });

  return {
    createProduct: createProductMutation.mutateAsync,
    isCreating: createProductMutation.isPending,
    isError: createProductMutation.isError,
  };
};
