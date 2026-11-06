import { ProductType } from '../../domain/enums';

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

/** Valor de atributo tal como lo devuelve el detalle de un producto (`GET /products/:id`). */
export interface VariantAttributeValueDTO {
  id?: string;
  attributeId?: string;
  value?: string;
  attribute?: { id?: string; name?: string };
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
  attributeValues?: VariantAttributeValueDTO[];
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
