import type { PosSearchResult, PosVariableProductEntity, PosVariantEntity } from '@/modules/products/domain/entities/catalog.entity';

/** Qué hacer con un código escaneado en un cambio: agregar la variante, pedir que se elija, o avisar. */
export type ExchangeScan =
  | { kind: 'variant'; variant: PosVariantEntity }
  | { kind: 'choose'; product: PosVariableProductEntity }
  | { kind: 'ambiguous' }
  | { kind: 'not-found' };

/** Nunca elige por el cajero: un SKU base pide elegir, y un código de varias variantes solo vale si es el SKU de una. */
export function readExchangeScan(result: PosSearchResult, code: string): ExchangeScan {
  if (result.kind === 'variable-product') return { kind: 'choose', product: result.product };
  const [first, ...others] = result.variants;
  if (!first) return { kind: 'not-found' };
  if (others.length === 0) return { kind: 'variant', variant: first };
  const exact = result.variants.find((variant) => variant.sku.toUpperCase() === code.trim().toUpperCase());
  return exact ? { kind: 'variant', variant: exact } : { kind: 'ambiguous' };
}

/** La combinación como se lee en la lista: «Base: Rojo / Copa: Negro». */
export const combinationLabel = (attributes: ReadonlyArray<{ name: string; value: string }> = []): string =>
  attributes.map(({ name, value }) => `${name}: ${value}`).join(' / ');
