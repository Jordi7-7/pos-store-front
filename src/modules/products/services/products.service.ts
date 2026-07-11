import { apiClient } from '@/lib/apiClient';

export interface ProductVariant {
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

export const productsService = {
  getProducts: async (): Promise<Product[]> => {
    return apiClient.get<Product[]>('/products');
  },

  createProduct: async (input: CreateProductInput): Promise<Product> => {
    return apiClient.post<Product>('/products', input);
  }
};
