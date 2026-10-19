import { ProductType } from '../enums';

export interface ProductImageDTO {
  id: string;
  url: string;
  description?: string;
}

export interface VariantAttributeDTO {
  name: string;
  value: string;
}

export interface VariantStockDTO {
  branchId: string;
  branchName?: string;
  quantity: number;
}

export interface TagDTO {
  id: string;
  name: string;
}

export interface ProductVariantDTO {
  id?: string;
  sku: string;
  barcode: string;
  purchasePrice: number;
  salePrice: number;
  wholesalePrice?: number | null;
  imageIds?: string[];
  images?: ProductImageDTO[];
  attributeValues?: any[];
  attributes?: VariantAttributeDTO[];
  stocks?: VariantStockDTO[];
  tags?: TagDTO[];
}

export interface ProductDTO {
  id: string;
  name: string;
  description: string;
  type?: ProductType;
  baseSku?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  category?: { id: string; name: string } | null;
  images?: ProductImageDTO[];
  imageIds?: string[];
  variants: ProductVariantDTO[];
}

export interface AttributeValueDTO {
  id: string;
  attributeId: string;
  value: string;
}

export interface AttributeDTO {
  id: string;
  tenantId: string;
  name: string;
  values: AttributeValueDTO[];
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
  baseSku?: string;
  categoryId?: string;
  imageIds?: string[];
  variants: CreateVariableProductVariantInput[];
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  baseSku?: string | null;
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

export interface BulkImportProductItem {
  sku: string;
  name: string;
  barcode?: string;
  purchasePrice: number;
  salePrice: number;
  wholesalePrice?: number;
  quantity: number;
}

export interface ValidateImportItemInput {
  sku: string;
  name: string;
}

export interface ValidateImportResult {
  errors: Record<string, string>;
}

export interface BulkImportProductsInput {
  branchId?: string;
  items: BulkImportProductItem[];
}

export interface BulkImportProductsResult {
  importedCount: number;
}

