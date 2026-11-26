import type { AttributeEntity, AttributeValueEntity, CategoryEntity, TagEntity } from '../../domain/entities/catalog.entity';

/** Puerto de salida: categorías, atributos y etiquetas de los productos. */
export interface CatalogRepository {
  listCategories(): Promise<CategoryEntity[]>;
  createCategory(name: string): Promise<CategoryEntity>;
  listAttributes(): Promise<AttributeEntity[]>;
  createAttribute(name: string): Promise<AttributeEntity>;
  createAttributeValue(attributeId: string, value: string): Promise<AttributeValueEntity>;
  /** Elimina un atributo con sus opciones; el servidor lo rechaza (`ATTRIBUTE_IN_USE`) si alguna variante vigente lo usa. */
  deleteAttribute(attributeId: string): Promise<void>;
  deleteAttributeValue(valueId: string): Promise<void>;
  /** Fija el orden de las opciones; debe traer todas las del atributo (`ATTRIBUTE_ORDER_STALE` si la lista cambió). */
  reorderAttributeValues(attributeId: string, valueIds: string[]): Promise<void>;
  listTags(): Promise<TagEntity[]>;
  createTag(name: string): Promise<TagEntity>;
}
