import { apiClient } from '@/lib/apiClient';
import type { PaginatedResult } from '@/shared/domain/value-objects/paginated';
import type {
  BulkImportProductsInput,
  BulkImportProductsResult,
  CreateSimpleProductInput,
  CreateVariableProductInput,
  NewVariantInput,
  ProductsQuery,
  ProductsRepository,
  UpdateProductInput,
  UpdateSimpleProductInput,
  UpdateVariantInput,
  ValidateImportItemInput,
  ValidateImportResult,
} from '../../application/ports/products.repository';
import type { CreatedVariantEntity, PosSearchResult, PosVariableProductEntity, PosVariantEntity, VariantLookup } from '../../domain/entities/catalog.entity';
import type { ProductEntity } from '../../domain/entities/product.entity';
import type { ProductDTO, ProductVariantDTO } from '../dtos/product.dto';
import { toCreatedVariantEntity, toProductEntities, toProductEntity } from '../mappers/product.mapper';

/** Catálogo de productos por HTTP: convierte las respuestas (DTO) en entidades del dominio. */
export class ProductsHttpRepository implements ProductsRepository {
  async list(query?: ProductsQuery): Promise<PaginatedResult<ProductEntity>> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));
    if (query?.search) params.append('search', query.search);
    if (query?.type) params.append('type', query.type);
    if (query?.branchId) params.append('branchId', query.branchId);
    if (query?.inStockOnly) params.append('inStockOnly', 'true');
    const queryString = params.toString();
    const response = await apiClient.get<PaginatedResult<ProductDTO>>(`/products${queryString ? `?${queryString}` : ''}`);
    return { data: toProductEntities(response.data), meta: response.meta };
  }

  async getById(id: string): Promise<ProductEntity> {
    return toProductEntity(await apiClient.get<ProductDTO>(`/products/${id}`));
  }

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  }

  async createSimple(input: CreateSimpleProductInput): Promise<ProductEntity> {
    return toProductEntity(await apiClient.post<ProductDTO>('/products/simple', input));
  }

  async createVariable(input: CreateVariableProductInput): Promise<ProductEntity> {
    return toProductEntity(await apiClient.post<ProductDTO>('/products/variable', input));
  }

  async update(id: string, input: UpdateProductInput): Promise<ProductEntity> {
    return toProductEntity(await apiClient.put<ProductDTO>(`/products/${id}`, input));
  }

  async updateSimple(id: string, input: UpdateSimpleProductInput): Promise<ProductEntity> {
    return toProductEntity(await apiClient.put<ProductDTO>(`/products/${id}/simple`, input));
  }

  async createVariant(productId: string, input: NewVariantInput): Promise<CreatedVariantEntity> {
    return toCreatedVariantEntity(await apiClient.post<ProductVariantDTO>(`/products/${productId}/variants`, input));
  }

  async updateVariant(variantId: string, input: UpdateVariantInput): Promise<void> {
    await apiClient.put(`/products/variants/${variantId}`, input);
  }

  async deleteVariant(variantId: string): Promise<void> {
    await apiClient.delete(`/products/variants/${variantId}`);
  }

  async updateVariantTags(variantId: string, tagIds: string[]): Promise<void> {
    await apiClient.put(`/products/variants/${variantId}/tags`, { tagIds });
  }

  findVariantBySku(sku: string): Promise<VariantLookup> {
    return apiClient.get<VariantLookup>(`/products/variant/sku/${encodeURIComponent(sku)}`);
  }

  async searchPos(sku: string, branchId: string): Promise<PosSearchResult> {
    const response = await apiClient.get<PosVariantEntity[] | PosVariableProductEntity | null>(`/products/pos/variant/sku/${encodeURIComponent(sku)}?branchId=${branchId}`);
    if (Array.isArray(response)) return { kind: 'variants', variants: response };
    if (response && Array.isArray(response.variants)) return { kind: 'variable-product', product: response };
    return { kind: 'variants', variants: [] };
  }

  listPosVariants(branchId: string): Promise<PosVariantEntity[]> {
    return apiClient.get<PosVariantEntity[]>(`/products/pos/variants?branchId=${branchId}`);
  }

  validateImport(items: ValidateImportItemInput[]): Promise<ValidateImportResult> {
    return apiClient.post<ValidateImportResult>('/products/validate-import', { items });
  }

  importProducts(input: BulkImportProductsInput): Promise<BulkImportProductsResult> {
    return apiClient.post<BulkImportProductsResult>('/products/import', input);
  }
}
