import { describe, expect, it } from 'vitest';
import type { AttributeEntity } from '../entities/catalog.entity';
import type { ProductVariantEntity } from '../entities/product.entity';
import { attributesUsedBy } from './product-attributes';

const catalog: AttributeEntity[] = [
  { id: 'talla', name: 'Talla', values: [] },
  { id: 'color', name: 'Color', values: [] },
];
const variant = (attributeIds: string[]): ProductVariantEntity => ({ attributes: attributeIds.map((attributeId) => ({ name: '', value: '', attributeId })) }) as ProductVariantEntity;

describe('atributos que usa un producto', () => {
  it('solo los de sus variantes', () => {
    expect(attributesUsedBy([variant(['talla']), variant(['talla'])], catalog).map((a) => a.id)).toEqual(['talla']);
    expect(attributesUsedBy([variant(['talla', 'color'])], catalog)).toHaveLength(2);
  });

  it('sin atributos declarados se ofrece todo el catálogo', () => {
    expect(attributesUsedBy([variant([])], catalog)).toBe(catalog);
    expect(attributesUsedBy([], catalog)).toBe(catalog);
  });
});
