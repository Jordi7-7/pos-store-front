import type { ProductType } from '../../domain/enums';
import type { ProductEntity } from '../../domain/entities/product.entity';
import type { CreatedVariantEntity, PosSearchResult, PosVariantEntity, VariantLookup } from '../../domain/entities/catalog.entity';
import type { PaginatedResult } from '@/shared/domain/value-objects/paginated';

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

/** Variante nueva que se añade a un producto existente. */
export interface NewVariantInput {
  sku: string;
  barcode: string;
  purchasePrice: number;
  salePrice: number;
  wholesalePrice?: number | null;
  imageIds?: string[];
  attributeValues?: Array<{ attributeValueId: string }>;
  stocks?: Array<{ branchId: string; quantity: number }>;
}

export interface ProductsQuery {
  page?: number;
  limit?: number;
  search?: string;
  type?: ProductType;
  branchId?: string;
  inStockOnly?: boolean;
}

/** Puerto de salida: catálogo de productos y variantes en el servidor. */
export interface ProductsRepository {
  list(query?: ProductsQuery): Promise<PaginatedResult<ProductEntity>>;
  getById(id: string): Promise<ProductEntity>;
  remove(id: string): Promise<void>;
  createSimple(input: CreateSimpleProductInput): Promise<ProductEntity>;
  createVariable(input: CreateVariableProductInput): Promise<ProductEntity>;
  update(id: string, input: UpdateProductInput): Promise<ProductEntity>;
  updateSimple(id: string, input: UpdateSimpleProductInput): Promise<ProductEntity>;
  createVariant(productId: string, input: NewVariantInput): Promise<CreatedVariantEntity>;
  updateVariant(variantId: string, input: UpdateVariantInput): Promise<void>;
  deleteVariant(variantId: string): Promise<void>;
  updateVariantTags(variantId: string, tagIds: string[]): Promise<void>;
  findVariantBySku(sku: string): Promise<VariantLookup>;
  /** Busca por SKU, código de barras o SKU base de un producto variable. Sin coincidencias, `variants` viene vacío. */
  searchPos(sku: string, branchId: string): Promise<PosSearchResult>;
  listPosVariants(branchId: string): Promise<PosVariantEntity[]>;
  validateImport(items: ValidateImportItemInput[]): Promise<ValidateImportResult>;
  importProducts(input: BulkImportProductsInput): Promise<BulkImportProductsResult>;
}
