import type { AttributeEntity } from '../entities/catalog.entity';
import type { ProductVariantEntity } from '../entities/product.entity';

/**
 * Atributos del catálogo que ya usa un producto (los de sus variantes): una variante nueva solo puede
 * combinar esos. Si el producto no declara ninguno, se ofrece todo el catálogo.
 */
export function attributesUsedBy(variants: ProductVariantEntity[], catalog: AttributeEntity[]): AttributeEntity[] {
  const usedIds = new Set(variants.flatMap((variant) => variant.attributes.map((attribute) => attribute.attributeId)).filter((id): id is string => Boolean(id)));
  return usedIds.size === 0 ? catalog : catalog.filter((attribute) => usedIds.has(attribute.id));
}
