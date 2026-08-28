import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsService } from '../services/products.service';
import type { CreateProductInput, CreateSimpleProductInput, InventoryMovement, PaginatedResult, Product, ProductHistoryPurchase, ProductHistorySale } from '../services/products.service';
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
