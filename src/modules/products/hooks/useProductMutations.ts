import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsService } from '../services/products.service';
import type {
  CreateSimpleProductInput,
  CreateVariableProductInput,
  UpdateProductInput,
  UpdateSimpleProductInput,
  UpdateVariantInput,
  ProductVariantDTO,
} from '../types/product.types';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';

export const useProductMutations = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthStore();

  const invalidateProductQueries = (productId?: string) => {
    queryClient.invalidateQueries({ queryKey: ['products', tenantId] });
    if (productId) {
      queryClient.invalidateQueries({ queryKey: ['product-detail', tenantId, productId] });
    }
  };

  const createSimpleProduct = useMutation({
    mutationFn: (input: CreateSimpleProductInput) => productsService.createSimpleProduct(input),
    onSuccess: () => invalidateProductQueries(),
  });

  const createVariableProduct = useMutation({
    mutationFn: (input: CreateVariableProductInput) => productsService.createVariableProduct(input),
    onSuccess: () => invalidateProductQueries(),
  });

  const updateSimpleProduct = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSimpleProductInput }) =>
      productsService.updateSimpleProduct(id, input),
    onSuccess: (_data, variables) => invalidateProductQueries(variables.id),
  });

  const updateProduct = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductInput }) =>
      productsService.updateProduct(id, input),
    onSuccess: (_data, variables) => invalidateProductQueries(variables.id),
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) => productsService.deleteProduct(id),
    onSuccess: () => invalidateProductQueries(),
  });

  const createVariant = useMutation({
    mutationFn: ({ productId, input }: { productId: string; input: ProductVariantDTO }) =>
      productsService.createVariant(productId, input),
    onSuccess: (_data, variables) => invalidateProductQueries(variables.productId),
  });

  const updateVariant = useMutation({
    mutationFn: ({ variantId, input }: { variantId: string; input: UpdateVariantInput }) =>
      productsService.updateVariant(variantId, input),
    onSuccess: () => invalidateProductQueries(),
  });

  const deleteVariant = useMutation({
    mutationFn: (variantId: string) => productsService.deleteVariant(variantId),
    onSuccess: () => invalidateProductQueries(),
  });

  return {
    createSimpleProduct: createSimpleProduct.mutateAsync,
    isCreatingSimple: createSimpleProduct.isPending,
    createVariableProduct: createVariableProduct.mutateAsync,
    isCreatingVariable: createVariableProduct.isPending,
    updateSimpleProduct: updateSimpleProduct.mutateAsync,
    isUpdatingSimple: updateSimpleProduct.isPending,
    updateProduct: updateProduct.mutateAsync,
    isUpdatingProduct: updateProduct.isPending,
    deleteProduct: deleteProduct.mutateAsync,
    isDeletingProduct: deleteProduct.isPending,
    createVariant: createVariant.mutateAsync,
    isCreatingVariant: createVariant.isPending,
    updateVariant: updateVariant.mutateAsync,
    isUpdatingVariant: updateVariant.isPending,
    deleteVariant: deleteVariant.mutateAsync,
    isDeletingVariant: deleteVariant.isPending,
  };
};
