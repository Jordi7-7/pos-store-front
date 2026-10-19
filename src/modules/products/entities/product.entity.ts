import { ProductType } from '../enums';

export interface ProductImageEntity {
  id: string;
  url: string;
  description?: string;
}

export interface ProductVariantEntity {
  id: string;
  sku: string;
  barcode: string;
  purchasePrice: number;
  purchasePriceFormatted: string;
  salePrice: number;
  salePriceFormatted: string;
  wholesalePrice: number | null;
  wholesalePriceFormatted: string;
  images: ProductImageEntity[];
  primaryImageUrl: string;
  attributes: Array<{ name: string; value: string }>;
  attributesLabel: string;
  stocks: Array<{ branchId: string; branchName: string; quantity: number }>;
  totalStock: number;
}

export interface ProductEntity {
  id: string;
  name: string;
  description: string;
  type: ProductType;
  baseSku: string;
  categoryId: string | null;
  categoryName: string;
  images: ProductImageEntity[];
  primaryImageUrl: string;
  variants: ProductVariantEntity[];
  totalVariants: number;
  totalStock: number;
  minPrice: number;
  maxPrice: number;
  priceRangeFormatted: string;
  purchasePriceRangeFormatted: string;
  wholesalePriceRangeFormatted: string;
}
