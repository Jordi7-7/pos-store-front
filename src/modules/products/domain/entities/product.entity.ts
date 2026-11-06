import { ProductType } from '../enums';

/** Entidades de catálogo: solo datos del negocio. Los textos de pantalla van en `presentation/view-models`. */

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
  salePrice: number;
  wholesalePrice: number | null;
  images: ProductImageEntity[];
  primaryImageUrl: string;
  attributes: Array<{ name: string; value: string }>;
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
  /** Precio de venta más bajo y más alto entre las variantes con precio (0 si ninguna lo tiene). */
  minPrice: number;
  maxPrice: number;
}
