import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsService } from '../services/products.service';
import type { CreateProductInput, CreateSimpleProductInput } from '../services/products.service';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';

export const useProducts = (params?: { page?: number; limit?: number; search?: string }) => {
  const { tenantId, isAuthenticated } = useAuthStore();

  const productsQuery = useQuery({
    queryKey: ['products', tenantId, params?.page, params?.limit, params?.search],
    queryFn: () => productsService.getProducts(params),
    enabled: isAuthenticated && !!tenantId,
  });

  return {
    products: productsQuery.data?.data || [],
    meta: productsQuery.data?.meta || { total: 0, page: 1, limit: 10, totalPages: 1 },
    isLoading: productsQuery.isLoading,
    isError: productsQuery.isError,
    refetch: productsQuery.refetch,
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

  const createSimpleProductMutation = useMutation({
    mutationFn: (input: CreateSimpleProductInput) => productsService.createSimpleProduct(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', tenantId] });
    },
  });

  const createVariableProductMutation = useMutation({
    mutationFn: (input: CreateProductInput) => productsService.createVariableProduct(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', tenantId] });
    },
  });

  return {
    createProduct: createProductMutation.mutateAsync,
    isCreating: createProductMutation.isPending,
    createSimpleProduct: createSimpleProductMutation.mutateAsync,
    isCreatingSimple: createSimpleProductMutation.isPending,
    createVariableProduct: createVariableProductMutation.mutateAsync,
    isCreatingVariable: createVariableProductMutation.isPending,
    isError: createProductMutation.isError,
  };
};


export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthStore();

  const updateProductMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: any }) => 
      productsService.updateProduct(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', tenantId] });
    },
  });

  return {
    updateProduct: updateProductMutation.mutateAsync,
    isUpdating: updateProductMutation.isPending,
    isError: updateProductMutation.isError,
  };
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthStore();

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => productsService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', tenantId] });
    },
  });

  return {
    deleteProduct: deleteProductMutation.mutateAsync,
    isDeleting: deleteProductMutation.isPending,
    isError: deleteProductMutation.isError,
  };
};

export const useCreateVariant = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthStore();

  const createVariantMutation = useMutation({
    mutationFn: ({ productId, input }: { productId: string; input: any }) =>
      productsService.createVariant(productId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', tenantId] });
    },
  });

  return {
    createVariant: createVariantMutation.mutateAsync,
    isCreating: createVariantMutation.isPending,
    isError: createVariantMutation.isError,
  };
};
