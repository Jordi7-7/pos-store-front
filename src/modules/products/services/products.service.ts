import { apiClient } from '@/lib/apiClient';
import { ProductType } from '../enums';
import type {
  ProductDTO,
  ProductVariantDTO,
  AttributeDTO,
  AttributeValueDTO,
  TagDTO,
  CreateSimpleProductInput,
  CreateVariableProductInput,
  UpdateProductInput,
  UpdateSimpleProductInput,
  UpdateVariantInput,
  ValidateImportItemInput,
  ValidateImportResult,
  BulkImportProductsInput,
  BulkImportProductsResult,
} from '../types/product.types';
import type {
  InventoryMovementDTO,
  AdjustStockInput,
  InventoryLotDTO,
  VariantBatchItemDTO,
  ProductHistorySaleDTO,
  ProductHistoryPurchaseDTO,
  PaginatedResult,
} from '../types/inventory.types';

export const productsService = {
  getProducts: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: ProductType;
  }): Promise<{ data: ProductDTO[]; meta: { total: number; page: number; limit: number; totalPages: number } }> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.search) query.append('search', params.search);
    if (params?.type) query.append('type', params.type);
    const queryString = query.toString();
    return apiClient.get(`/products${queryString ? `?${queryString}` : ''}`);
  },

  deleteProduct: async (id: string): Promise<void> => {
    return apiClient.delete(`/products/${id}`);
  },

  createSimpleProduct: async (input: CreateSimpleProductInput): Promise<ProductDTO> => {
    return apiClient.post<ProductDTO>('/products/simple', input);
  },

  createVariableProduct: async (input: CreateVariableProductInput): Promise<ProductDTO> => {
    return apiClient.post<ProductDTO>('/products/variable', input);
  },

  getAttributes: async (): Promise<AttributeDTO[]> => {
    return apiClient.get<AttributeDTO[]>('/products/attributes');
  },

  createAttribute: async (name: string): Promise<AttributeDTO> => {
    return apiClient.post<AttributeDTO>('/products/attributes', { name });
  },

  createAttributeValue: async (attributeId: string, value: string): Promise<AttributeValueDTO> => {
    return apiClient.post<AttributeValueDTO>('/products/attributes/values', { attributeId, value });
  },

  updateProduct: async (id: string, input: UpdateProductInput): Promise<ProductDTO> => {
    return apiClient.put<ProductDTO>(`/products/${id}`, input);
  },

  updateSimpleProduct: async (id: string, input: UpdateSimpleProductInput): Promise<ProductDTO> => {
    return apiClient.put<ProductDTO>(`/products/${id}/simple`, input);
  },

  updateVariant: async (variantId: string, input: UpdateVariantInput): Promise<ProductVariantDTO> => {
    return apiClient.put<ProductVariantDTO>(`/products/variants/${variantId}`, input);
  },

  createVariant: async (productId: string, input: ProductVariantDTO): Promise<ProductVariantDTO> => {
    return apiClient.post<ProductVariantDTO>(`/products/${productId}/variants`, input);
  },

  deleteVariant: async (variantId: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete(`/products/variants/${variantId}`);
  },

  getTags: async (): Promise<TagDTO[]> => {
    return apiClient.get<TagDTO[]>('/products/tags');
  },

  createTag: async (name: string): Promise<TagDTO> => {
    return apiClient.post<TagDTO>('/products/tags', { name });
  },

  updateVariantTags: async (variantId: string, tagIds: string[]): Promise<void> => {
    return apiClient.put(`/products/variants/${variantId}/tags`, { tagIds });
  },

  getVariantBySku: async (sku: string): Promise<{ id: string; sku: string; purchasePrice: number; productName: string }> => {
    return apiClient.get(`/products/variant/sku/${sku}`);
  },

  getPosVariantBySku: async (sku: string, branchId: string): Promise<any> => {
    return apiClient.get(`/products/pos/variant/sku/${sku}?branchId=${branchId}`);
  },

  getPosVariants: async (branchId: string): Promise<{ id: string; sku: string; purchasePrice: number; salePrice: number; wholesalePrice?: number | null; productName: string; stock: number; attributeValues?: any[] }[]> => {
    return apiClient.get(`/products/pos/variants?branchId=${branchId}`);
  },

  getProductById: async (id: string): Promise<ProductDTO> => {
    return apiClient.get<ProductDTO>(`/products/${id}`);
  },

  getVariantSales: async (variantId: string, page = 1, limit = 10, branchId?: string): Promise<PaginatedResult<ProductHistorySaleDTO>> => {
    const branchQuery = branchId ? `&branchId=${encodeURIComponent(branchId)}` : '';
    return apiClient.get(`/sales/by-variant/${encodeURIComponent(variantId)}?page=${page}&limit=${limit}${branchQuery}`);
  },

  getVariantPurchases: async (variantId: string, page = 1, limit = 10, branchId?: string): Promise<PaginatedResult<ProductHistoryPurchaseDTO>> => {
    const branchQuery = branchId ? `&branchId=${encodeURIComponent(branchId)}` : '';
    return apiClient.get(`/purchases/by-variant/${encodeURIComponent(variantId)}?page=${page}&limit=${limit}${branchQuery}`);
  },

  getVariantBatches: async (variantId: string, page = 1, limit = 10, branchId?: string): Promise<PaginatedResult<VariantBatchItemDTO>> => {
    const branchQuery = branchId ? `&branchId=${encodeURIComponent(branchId)}` : '';
    return apiClient.get(`/batches/by-variant/${encodeURIComponent(variantId)}?page=${page}&limit=${limit}${branchQuery}`);
  },

  getInventoryMovementsByVariant: async (variantId: string, page = 1, limit = 10, branchId?: string): Promise<PaginatedResult<InventoryMovementDTO>> => {
    const branchQuery = branchId ? `&branchId=${encodeURIComponent(branchId)}` : '';
    return apiClient.get(`/products/inventory-movements-by-variant?variantId=${encodeURIComponent(variantId)}&page=${page}&limit=${limit}${branchQuery}`);
  },

  adjustStock: async (input: AdjustStockInput): Promise<InventoryMovementDTO> => {
    return apiClient.post<InventoryMovementDTO>('/products/stock-adjustments', input);
  },

  getBatches: async (params?: {
    branchId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<InventoryLotDTO>> => {
    const query = new URLSearchParams();
    if (params?.branchId) query.append('branchId', params.branchId);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    const qs = query.toString();
    return apiClient.get<PaginatedResult<InventoryLotDTO>>(`/batches${qs ? `?${qs}` : ''}`);
  },

  validateImport: async (items: ValidateImportItemInput[]): Promise<ValidateImportResult> => {
    return apiClient.post<ValidateImportResult>('/products/validate-import', { items });
  },

  importProducts: async (input: BulkImportProductsInput): Promise<BulkImportProductsResult> => {
    return apiClient.post<BulkImportProductsResult>('/products/import', input);
  },
};
