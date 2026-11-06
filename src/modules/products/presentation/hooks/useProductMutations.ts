import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsRepository } from '../../infrastructure/dependencies';
import type {
  CreateSimpleProductInput,
  CreateVariableProductInput,
  NewVariantInput,
  UpdateProductInput,
  UpdateSimpleProductInput,
  UpdateVariantInput,
} from '../../application/ports/products.repository';
import { useTenantId } from '@/modules/auth/presentation/hooks/useSession';

export const useProductMutations = () => {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();

  const invalidateProductQueries = (productId?: string) => {
    queryClient.invalidateQueries({ queryKey: ['products', tenantId] });
    if (productId) {
      queryClient.invalidateQueries({ queryKey: ['product-detail', tenantId, productId] });
    }
  };

  const createSimpleProduct = useMutation({
    mutationFn: (input: CreateSimpleProductInput) => productsRepository.createSimple(input),
    onSuccess: () => invalidateProductQueries(),
  });

  const createVariableProduct = useMutation({
    mutationFn: (input: CreateVariableProductInput) => productsRepository.createVariable(input),
    onSuccess: () => invalidateProductQueries(),
  });

  const updateSimpleProduct = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSimpleProductInput }) =>
      productsRepository.updateSimple(id, input),
    onSuccess: (_data, variables) => invalidateProductQueries(variables.id),
  });

  const updateProduct = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductInput }) =>
      productsRepository.update(id, input),
    onSuccess: (_data, variables) => invalidateProductQueries(variables.id),
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) => productsRepository.remove(id),
    onSuccess: () => invalidateProductQueries(),
  });

  const createVariant = useMutation({
    mutationFn: ({ productId, input }: { productId: string; input: NewVariantInput }) =>
      productsRepository.createVariant(productId, input),
    onSuccess: (_data, variables) => invalidateProductQueries(variables.productId),
  });

  const updateVariant = useMutation({
    mutationFn: ({ variantId, input }: { variantId: string; input: UpdateVariantInput }) =>
      productsRepository.updateVariant(variantId, input),
    onSuccess: () => invalidateProductQueries(),
  });

  const deleteVariant = useMutation({
    mutationFn: (variantId: string) => productsRepository.deleteVariant(variantId),
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
