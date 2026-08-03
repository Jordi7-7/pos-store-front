import { apiClient } from '@/lib/apiClient';

export interface ProductVariant {
  id?: string;
  sku: string;
  barcode: string;
  purchasePrice: number;
  salePrice: number;
  imageIds?: string[];
  attributeValues: { attributeValueId: string }[];
  stocks?: { branchId: string; quantity: number }[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  variants: ProductVariant[];
  imageIds: string[];
  categoryId: string;
}

export interface CreateProductInput {
  name: string;
  description: string;
  categoryId?: string;
  imageIds?: string[];
  variants: ProductVariant[];
}

export interface CreateSimpleProductInput {
  name: string;
  description: string;
  sku: string;
  barcode?: string;
  purchasePrice: number;
  salePrice: number;
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

  createProduct: async (input: CreateProductInput): Promise<Product> => {
    return apiClient.post<Product>('/products', input);
  },

  createSimpleProduct: async (input: CreateSimpleProductInput): Promise<Product> => {
    return apiClient.post<Product>('/products/simple', input);
  },

  createVariableProduct: async (input: CreateProductInput): Promise<Product> => {
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

  updateProduct: async (id: string, input: Partial<CreateProductInput>): Promise<Product> => {
    return apiClient.put<Product>(`/products/${id}`, input);
  },

  createVariant: async (productId: string, input: ProductVariant): Promise<ProductVariant> => {
    return apiClient.post<ProductVariant>(`/products/${productId}/variants`, input);
  }
};

