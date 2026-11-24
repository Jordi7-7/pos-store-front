/** Lo mínimo que hace falta de una variante para reconocerla por lo que escribió el usuario. */
export interface SkuCandidate {
  sku: string;
  barcode?: string | null;
}

export type SkuMatch<T extends SkuCandidate> = { kind: 'found'; variant: T } | { kind: 'not-found' } | { kind: 'ambiguous' };

/**
 * Qué variante quiso decir el usuario al escribir un SKU o escanear un código de barras: la que coincide exacta
 * (sin importar mayúsculas en el SKU) o, si el buscador devolvió una sola, esa. Varias sin coincidencia exacta es ambiguo.
 */
export function matchSku<T extends SkuCandidate>(variants: readonly T[], typed: string): SkuMatch<T> {
  const exact = variants.find((variant) => variant.sku.toUpperCase() === typed.toUpperCase() || variant.barcode === typed);
  const only = variants.length === 1 ? variants[0] : undefined;
  const variant = exact ?? only;
  if (variant) return { kind: 'found', variant };
  return { kind: variants.length === 0 ? 'not-found' : 'ambiguous' };
}
