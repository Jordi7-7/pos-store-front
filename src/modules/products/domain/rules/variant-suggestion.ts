export interface VariantSuggestionInput {
  /** SKU de las variantes que ya tiene el producto, en orden. */
  skus: string[];
  productName: string;
  /** Precios de la primera variante (se proponen para la nueva). */
  firstPrices?: { purchasePrice: number | string; salePrice: number | string; wholesalePrice: number | string | null };
}

export interface VariantSuggestion {
  sku: string;
  purchasePrice: string;
  salePrice: string;
  wholesalePrice: string;
}

/**
 * Propuesta para la variante nueva de un producto: el SKU sigue el prefijo de las existentes
 * (`CAM-AZU-3` tras `CAM-AZU-2`), o se deriva del nombre si no hay prefijo; los precios copian los de la primera.
 */
export function suggestNewVariant({ skus, productName, firstPrices }: VariantSuggestionInput): VariantSuggestion {
  const firstSku = skus[0] ?? '';
  const prefix = firstSku.includes('-')
    ? firstSku.split('-').slice(0, -1).join('-') || firstSku.split('-')[0]
    : productName.slice(0, 8).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'VAR';

  // El siguiente número de serie: el mayor sufijo numérico existente (o la cantidad de variantes) más uno
  const lastSerial = skus.reduce((max, sku) => {
    const parts = sku.split('-');
    const serial = Number(parts[parts.length - 1]);
    return !Number.isNaN(serial) && serial > max ? serial : max;
  }, skus.length);

  return {
    sku: `${prefix}-${lastSerial + 1}`,
    purchasePrice: firstPrices ? String(firstPrices.purchasePrice) : '0',
    salePrice: firstPrices ? String(firstPrices.salePrice) : '0',
    wholesalePrice: firstPrices?.wholesalePrice ? String(firstPrices.wholesalePrice) : '',
  };
}
