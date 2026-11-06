import type { AttributeEntity, AttributeValueEntity, CategoryEntity, TagEntity } from '../../domain/entities/catalog.entity';

/** Puerto de salida: categorías, atributos y etiquetas de los productos. */
export interface CatalogRepository {
  listCategories(): Promise<CategoryEntity[]>;
  createCategory(name: string): Promise<CategoryEntity>;
  listAttributes(): Promise<AttributeEntity[]>;
  createAttribute(name: string): Promise<AttributeEntity>;
  createAttributeValue(attributeId: string, value: string): Promise<AttributeValueEntity>;
  listTags(): Promise<TagEntity[]>;
  createTag(name: string): Promise<TagEntity>;
}
