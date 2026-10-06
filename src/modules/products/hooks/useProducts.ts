import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsService } from '../services/products.service';
import type { AdjustStockInput, CreateVariableProductInput, CreateSimpleProductInput, UpdateProductInput, UpdateSimpleProductInput, UpdateVariantInput, InventoryMovement, PaginatedResult, Product, ProductHistoryPurchase, ProductHistorySale, VariantBatchItem } from '../services/products.service';
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

export const useInventoryMovementsByVariant = (variantId?: string, page = 1, limit = 10) => {
  const { tenantId, isAuthenticated } = useAuthStore();
  const movementsQuery = useQuery<PaginatedResult<InventoryMovement>>({
    queryKey: ['variant-movements', tenantId, variantId, page, limit],
    queryFn: () => productsService.getInventoryMovementsByVariant(variantId!, page, limit),
    enabled: isAuthenticated && !!tenantId && !!variantId,
  });

  return {
    movements: movementsQuery.data?.data || [],
    meta: movementsQuery.data?.meta || { total: 0, page, limit, totalPages: 1 },
    isLoading: movementsQuery.isLoading,
    isError: movementsQuery.isError,
  };
};

export const useProductDetail = (productId?: string, enabled = true) => {
  const { tenantId, isAuthenticated } = useAuthStore();
  const query = useQuery<Product>({
    queryKey: ['product-detail', tenantId, productId],
    queryFn: () => productsService.getProductById(productId!),
    enabled: enabled && isAuthenticated && !!tenantId && !!productId,
  });

  return {
    product: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
};

export const useProductSales = (productId?: string, page = 1, limit = 10, enabled = true) => {
  const { tenantId, isAuthenticated } = useAuthStore();
  const query = useQuery<PaginatedResult<ProductHistorySale>>({
    queryKey: ['product-sales', tenantId, productId, page, limit],
    queryFn: () => productsService.getProductSales(productId!, page, limit),
    enabled: enabled && isAuthenticated && !!tenantId && !!productId,
  });

  return {
    sales: query.data?.data || [],
    meta: query.data?.meta || { total: 0, page, limit, totalPages: 1 },
    isLoading: query.isLoading,
    isError: query.isError,
  };
};

export const useVariantSales = (variantId?: string, page = 1, limit = 10, enabled = true) => {
  const { tenantId, isAuthenticated } = useAuthStore();
  const query = useQuery<PaginatedResult<ProductHistorySale>>({
    queryKey: ['variant-sales', tenantId, variantId, page, limit],
    queryFn: () => productsService.getVariantSales(variantId!, page, limit),
    enabled: enabled && isAuthenticated && !!tenantId && !!variantId,
  });

  return {
    sales: query.data?.data || [],
    meta: query.data?.meta || { total: 0, page, limit, totalPages: 1 },
    isLoading: query.isLoading,
    isError: query.isError,
  };
};

export const useProductPurchases = (productId?: string, page = 1, limit = 10, enabled = true) => {
  const { tenantId, isAuthenticated } = useAuthStore();
  const query = useQuery<PaginatedResult<ProductHistoryPurchase>>({
    queryKey: ['product-purchases', tenantId, productId, page, limit],
    queryFn: () => productsService.getProductPurchases(productId!, page, limit),
    enabled: enabled && isAuthenticated && !!tenantId && !!productId,
  });

  return {
    purchases: query.data?.data || [],
    meta: query.data?.meta || { total: 0, page, limit, totalPages: 1 },
    isLoading: query.isLoading,
    isError: query.isError,
  };
};

export const useVariantPurchases = (variantId?: string, page = 1, limit = 10, enabled = true) => {
  const { tenantId, isAuthenticated } = useAuthStore();
  const query = useQuery<PaginatedResult<ProductHistoryPurchase>>({
    queryKey: ['variant-purchases', tenantId, variantId, page, limit],
    queryFn: () => productsService.getVariantPurchases(variantId!, page, limit),
    enabled: enabled && isAuthenticated && !!tenantId && !!variantId,
  });

  return {
    purchases: query.data?.data || [],
    meta: query.data?.meta || { total: 0, page, limit, totalPages: 1 },
    isLoading: query.isLoading,
    isError: query.isError,
  };
};

export const useVariantBatches = (variantId?: string, page = 1, limit = 10, branchId?: string, enabled = true) => {
  const { tenantId, isAuthenticated } = useAuthStore();
  const query = useQuery<PaginatedResult<VariantBatchItem>>({
    queryKey: ['variant-batches', tenantId, variantId, page, limit, branchId],
    queryFn: () => productsService.getVariantBatches(variantId!, page, limit, branchId),
    enabled: enabled && isAuthenticated && !!tenantId && !!variantId,
  });

  return {
    batches: query.data?.data || [],
    meta: query.data?.meta || { total: 0, page, limit, totalPages: 1 },
    isLoading: query.isLoading,
    isError: query.isError,
  };
};

export const useAdjustStock = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthStore();
  const mutation = useMutation({
    mutationFn: (input: AdjustStockInput) => productsService.adjustStock(input),
    onSuccess: (_movement, input) => {
      queryClient.invalidateQueries({ queryKey: ['products', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['variant-movements', tenantId, input.variantId] });
    },
  });

  return {
    adjustStock: mutation.mutateAsync,
    isAdjusting: mutation.isPending,
  };
};

export const useCreateSimpleProduct = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthStore();

  const mutation = useMutation({
    mutationFn: (input: CreateSimpleProductInput) => productsService.createSimpleProduct(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', tenantId] });
    },
  });

  return {
    createSimpleProduct: mutation.mutateAsync,
    isCreating: mutation.isPending,
  };
};

export const useCreateVariableProduct = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthStore();

  const mutation = useMutation({
    mutationFn: (input: CreateVariableProductInput) => productsService.createVariableProduct(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', tenantId] });
    },
  });

  return {
    createVariableProduct: mutation.mutateAsync,
    isCreating: mutation.isPending,
  };
};


export const useUpdateSimpleProduct = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthStore();

  const mutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSimpleProductInput }) => 
      productsService.updateSimpleProduct(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['product-detail', tenantId, variables.id] });
    },
  });

  return {
    updateSimpleProduct: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    isError: mutation.isError,
  };
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthStore();

  const updateProductMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductInput }) => 
      productsService.updateProduct(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['product-detail', tenantId, variables.id] });
    },
  });

  return {
    updateProduct: updateProductMutation.mutateAsync,
    isUpdating: updateProductMutation.isPending,
    isError: updateProductMutation.isError,
  };
};

export const useUpdateVariant = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthStore();

  const updateVariantMutation = useMutation({
    mutationFn: ({ variantId, input }: { variantId: string; input: UpdateVariantInput }) => 
      productsService.updateVariant(variantId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['product-detail', tenantId] });
    },
  });

  return {
    updateVariant: updateVariantMutation.mutateAsync,
    isUpdating: updateVariantMutation.isPending,
    isError: updateVariantMutation.isError,
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
