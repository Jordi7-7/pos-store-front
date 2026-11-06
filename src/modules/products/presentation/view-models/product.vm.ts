import type { Formatters } from '@/shared/presentation/formatting/formatters';
import type { ProductEntity, ProductVariantEntity } from '../../domain/entities/product.entity';

/** Producto con los textos listos para mostrar (precios con la moneda de la tienda, rangos y atributos). */

export type ProductVariantVM = ProductVariantEntity & {
  purchasePriceFormatted: string;
  salePriceFormatted: string;
  wholesalePriceFormatted: string;
  /** `Talla: M / Color: Rojo` */
  attributesLabel: string;
};

export type ProductVM = Omit<ProductEntity, 'variants'> & {
  variants: ProductVariantVM[];
  priceRangeFormatted: string;
  purchasePriceRangeFormatted: string;
  wholesalePriceRangeFormatted: string;
};

/** `$10.00` si todos valen lo mismo, `$10.00 - $25.00` si varían, `—` si ninguno tiene precio. */
function priceRange(values: ReadonlyArray<number | null>, fmt: Formatters): string {
  const valid = values.filter((value): value is number => value !== null && value > 0);
  if (valid.length === 0) return '—';
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  return min === max ? fmt.money(min) : `${fmt.money(min)} - ${fmt.money(max)}`;
}

export const toProductVariantVM = (variant: ProductVariantEntity, fmt: Formatters): ProductVariantVM => ({
  ...variant,
  purchasePriceFormatted: fmt.money(variant.purchasePrice),
  salePriceFormatted: fmt.money(variant.salePrice),
  wholesalePriceFormatted: variant.wholesalePrice !== null ? fmt.money(variant.wholesalePrice) : 'N/A',
  attributesLabel: variant.attributes.map((attribute) => `${attribute.name}: ${attribute.value}`).join(' / '),
});

export const toProductVM = (product: ProductEntity, fmt: Formatters): ProductVM => ({
  ...product,
  variants: product.variants.map((variant) => toProductVariantVM(variant, fmt)),
  priceRangeFormatted: priceRange(product.variants.map((v) => v.salePrice), fmt),
  purchasePriceRangeFormatted: priceRange(product.variants.map((v) => v.purchasePrice), fmt),
  wholesalePriceRangeFormatted: priceRange(product.variants.map((v) => v.wholesalePrice), fmt),
});
