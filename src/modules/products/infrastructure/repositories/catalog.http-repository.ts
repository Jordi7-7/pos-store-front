import { apiClient } from '@/lib/apiClient';
import type { CatalogRepository } from '../../application/ports/catalog.repository';
import type { AttributeEntity, AttributeValueEntity, CategoryEntity, TagEntity } from '../../domain/entities/catalog.entity';
import type { AttributeDTO, AttributeValueDTO, TagDTO } from '../dtos/product.dto';

/** Categorías, atributos y etiquetas por HTTP. */
export class CatalogHttpRepository implements CatalogRepository {
  listCategories(): Promise<CategoryEntity[]> {
    return apiClient.get<CategoryEntity[]>('/products/categories');
  }

  createCategory(name: string): Promise<CategoryEntity> {
    return apiClient.post<CategoryEntity>('/products/categories', { name });
  }

  async listAttributes(): Promise<AttributeEntity[]> {
    const attributes = await apiClient.get<AttributeDTO[]>('/products/attributes');
    return attributes.map((attribute) => ({ id: attribute.id, name: attribute.name, values: attribute.values ?? [] }));
  }

  async createAttribute(name: string): Promise<AttributeEntity> {
    const attribute = await apiClient.post<AttributeDTO>('/products/attributes', { name });
    return { id: attribute.id, name: attribute.name, values: attribute.values ?? [] };
  }

  createAttributeValue(attributeId: string, value: string): Promise<AttributeValueEntity> {
    return apiClient.post<AttributeValueDTO>('/products/attributes/values', { attributeId, value });
  }

  listTags(): Promise<TagEntity[]> {
    return apiClient.get<TagDTO[]>('/products/tags');
  }

  createTag(name: string): Promise<TagEntity> {
    return apiClient.post<TagDTO>('/products/tags', { name });
  }
}
