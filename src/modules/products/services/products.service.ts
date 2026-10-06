import { apiClient } from '@/lib/apiClient';

export interface ProductVariant {
  id?: string;
  sku: string;
  barcode: string;
  purchasePrice: number;
  salePrice: number;
  wholesalePrice?: number | null;
  imageIds?: string[];
  images?: { id: string; url: string; description?: string }[];
  attributeValues: { attributeValueId: string }[];
  stocks?: { branchId: string; quantity: number }[];
  tags?: Tag[];
}

export interface Tag {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  variants: ProductVariant[];
  imageIds: string[];
  images?: { id: string; url: string; description?: string }[];
  categoryId: string;
}

export interface InventoryMovement {
  id: string;
  quantity: number;
  type: string;
  reason: string;
  createdAt: string;
  variant?: { sku: string; product?: { name: string } };
  originBranch?: { name: string } | null;
  destinationBranch?: { name: string } | null;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface AdjustStockInput {
  branchId: string;
  variantId: string;
  quantity: number;
  type: 'IN' | 'OUT';
  comment?: string;
}

export interface LotItem {
  id: string;
  createdAt: string;
  variantId: string;
  productName: string;
  sku: string;
  barcode: string;
  initialQuantity: number;
  remainingQuantity: number;
  consumedQuantity: number;
  unitCost: number;
  totalCostValue: number;
  initialCostValue?: number;
}

export interface InventoryLot {
  id: string;
  purchaseOrderId: string | null;
  createdAt: string;
  branchId: string;
  branchName: string;
  originType: 'PURCHASE' | 'INITIAL_STOCK' | 'REFUND' | 'ADJUSTMENT';
  originLabel: string;
  originReference: string;
  totalInitialQuantity: number;
  totalRemainingQuantity: number;
  totalCostValue: number;
  totalInitialCostValue?: number;
  status: 'ACTIVE' | 'DEPLETED' | 'EXHAUSTED' | 'CANCELLED';
  items: LotItem[];
}

export interface ProductBatch {
  id: string;
  createdAt: string;
  branchId: string;
  branchName: string;
  variantId: string;
  productName: string;
  sku: string;
  barcode: string;
  initialQuantity: number;
  remainingQuantity: number;
  consumedQuantity: number;
  unitCost: number;
  totalCostValue: number;
  originType: 'PURCHASE' | 'INITIAL_STOCK' | 'REFUND' | 'ADJUSTMENT';
  originLabel: string;
  originReference: string;
  purchaseOrderId: string | null;
  status: 'ACTIVE' | 'EXHAUSTED';
}

export interface ProductHistorySale {
  id: string;
  invoiceNumber?: string | null;
  createdAt: string;
  total: number;
  customer?: { name?: string } | null;
}

export interface ProductHistoryPurchase {
  id: string;
  invoiceNumber?: string | null;
  createdAt: string;
  totalAmount: number;
  supplier?: { name?: string } | null;
}

export interface CreateVariableProductVariantInput {
  sku: string;
  barcode?: string;
  purchasePrice: number;
  salePrice: number;
  wholesalePrice?: number | null;
  imageIds?: string[];
  attributeValues: { attributeValueId: string }[];
  stocks?: { branchId: string; quantity: number }[];
}

export interface CreateVariableProductInput {
  name: string;
  description: string;
  categoryId?: string;
  imageIds?: string[];
  variants: CreateVariableProductVariantInput[];
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  categoryId?: string | null;
  imageIds?: string[];
}

export interface UpdateVariantInput {
  sku?: string;
  barcode?: string;
  purchasePrice?: number;
  salePrice?: number;
  wholesalePrice?: number | null;
  imageIds?: string[];
}

export interface UpdateSimpleProductInput {
  name?: string;
  description?: string;
  categoryId?: string | null;
  imageIds?: string[];
  sku?: string;
  barcode?: string;
  purchasePrice?: number;
  salePrice?: number;
  wholesalePrice?: number | null;
}

export interface CreateSimpleProductInput {
  name: string;
  description: string;
  sku: string;
  barcode?: string;
  purchasePrice: number;
  salePrice: number;
  wholesalePrice?: number | null;
  categoryId?: string;
  imageIds?: string[];
  stocks?: { branchId: string; quantity: number }[];
}

export interface AttributeValue {
  id: string;
  attributeId: string;
  value: string;
}

export interface Attribute {
  id: string;
  tenantId: string;
  name: string;
  values: AttributeValue[];
}

export const productsService = {
  getProducts: async (params?: { page?: number; limit?: number; search?: string }): Promise<{ data: Product[]; meta: { total: number; page: number; limit: number; totalPages: number } }> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.search) query.append('search', params.search);
    const queryString = query.toString();
    return apiClient.get(`/products${queryString ? `?${queryString}` : ''}`);
  },

  deleteProduct: async (id: string): Promise<void> => {
    return apiClient.delete(`/products/${id}`);
  },

  createSimpleProduct: async (input: CreateSimpleProductInput): Promise<Product> => {
    return apiClient.post<Product>('/products/simple', input);
  },

  createVariableProduct: async (input: CreateVariableProductInput): Promise<Product> => {
    return apiClient.post<Product>('/products/variable', input);
  },

  getAttributes: async (): Promise<Attribute[]> => {
    return apiClient.get<Attribute[]>('/products/attributes');
  },

  createAttribute: async (name: string): Promise<Attribute> => {
    return apiClient.post<Attribute>('/products/attributes', { name });
  },

  createAttributeValue: async (attributeId: string, value: string): Promise<AttributeValue> => {
    return apiClient.post<AttributeValue>('/products/attributes/values', { attributeId, value });
  },

  updateProduct: async (id: string, input: UpdateProductInput): Promise<Product> => {
    return apiClient.put<Product>(`/products/${id}`, input);
  },

  updateSimpleProduct: async (id: string, input: UpdateSimpleProductInput): Promise<Product> => {
    return apiClient.put<Product>(`/products/${id}/simple`, input);
  },

  updateVariant: async (variantId: string, input: UpdateVariantInput): Promise<ProductVariant> => {
    return apiClient.put<ProductVariant>(`/products/variants/${variantId}`, input);
  },

  createVariant: async (productId: string, input: ProductVariant): Promise<ProductVariant> => {
    return apiClient.post<ProductVariant>(`/products/${productId}/variants`, input);
  },

  getTags: async (): Promise<Tag[]> => {
    return apiClient.get<Tag[]>('/products/tags');
  },

  createTag: async (name: string): Promise<Tag> => {
    return apiClient.post<Tag>('/products/tags', { name });
  },

  updateVariantTags: async (variantId: string, tagIds: string[]): Promise<void> => {
    return apiClient.put(`/products/variants/${variantId}/tags`, { tagIds });
  },

  getVariantBySku: async (sku: string): Promise<{ id: string; sku: string; purchasePrice: number; productName: string }> => {
    return apiClient.get(`/products/variant/sku/${sku}`);
  },

  getPosVariantBySku: async (sku: string, branchId: string): Promise<{ id: string; sku: string; purchasePrice: number; salePrice: number; wholesalePrice?: number | null; productName: string; stock: number; attributeValues?: any[]; imageUrl?: string | null }[]> => {
    return apiClient.get(`/products/pos/variant/sku/${sku}?branchId=${branchId}`);
  },

  getPosVariants: async (branchId: string): Promise<{ id: string; sku: string; purchasePrice: number; salePrice: number; wholesalePrice?: number | null; productName: string; stock: number; attributeValues?: any[] }[]> => {
    return apiClient.get(`/products/pos/variants?branchId=${branchId}`);
  },

  getProductById: async (id: string): Promise<Product> => {
    return apiClient.get<Product>(`/products/${id}`);
  },

  getProductSales: async (productId: string, page = 1, limit = 10): Promise<PaginatedResult<ProductHistorySale>> => {
    return apiClient.get(`/sales/by-product/${productId}?page=${page}&limit=${limit}`);
  },

  getProductPurchases: async (productId: string, page = 1, limit = 10): Promise<PaginatedResult<ProductHistoryPurchase>> => {
    return apiClient.get(`/purchases/by-product/${productId}?page=${page}&limit=${limit}`);
  },

  getInventoryMovementsByVariant: async (variantId: string, page = 1, limit = 10): Promise<PaginatedResult<InventoryMovement>> => {
    return apiClient.get(`/products/inventory-movements-by-variant?variantId=${encodeURIComponent(variantId)}&page=${page}&limit=${limit}`);
  },

  adjustStock: async (input: AdjustStockInput): Promise<InventoryMovement> => {
    return apiClient.post<InventoryMovement>('/products/stock-adjustments', input);
  },

  getBatches: async (params?: {
    branchId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<InventoryLot>> => {
    const query = new URLSearchParams();
    if (params?.branchId) query.append('branchId', params.branchId);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    const qs = query.toString();
    return apiClient.get<PaginatedResult<InventoryLot>>(`/batches${qs ? `?${qs}` : ''}`);
  },
};

