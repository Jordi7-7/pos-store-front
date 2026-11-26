import { ProductType } from '../enums';

/** Reglas de existencias y etiquetas de la lista de productos. Reciben solo lo que necesitan, sin pantalla ni formato. */

interface StockedVariant {
  stocks: Array<{ branchId: string; quantity: number }>;
}

/** Existencias de una variante: las de la sucursal indicada, o la suma de todas si no se indica ninguna. */
export function variantStock(variant: StockedVariant, branchId: string): number {
  if (!branchId) return variant.stocks.reduce((sum, stock) => sum + Number(stock.quantity || 0), 0);
  return Number(variant.stocks.find((stock) => stock.branchId === branchId)?.quantity ?? 0);
}

/** Existencias de un producto en la sucursal, o el total de la empresa si no hay sucursal. */
export function productStock(product: { totalStock: number; variants: StockedVariant[] }, branchId: string): number {
  if (!branchId) return product.totalStock;
  return product.variants.reduce((sum, variant) => sum + variantStock(variant, branchId), 0);
}

export interface StockBreakdown {
  positive: number;
  negative: number;
  /** Unas variantes con existencias y otras en negativo: el saldo neto engaña, así que se muestra el desglose. */
  isMixed: boolean;
}

/** Desglose de saldos de un producto con variantes. Un producto simple nunca es "mixto". */
export function stockBreakdown(product: { type: ProductType; variants: StockedVariant[] }, branchId: string): StockBreakdown {
  if (product.type !== ProductType.VARIABLE) return { positive: 0, negative: 0, isMixed: false };
  const quantities = product.variants.map((variant) => variantStock(variant, branchId));
  const positive = quantities.filter((q) => q > 0).reduce((a, b) => a + b, 0);
  const negative = quantities.filter((q) => q < 0).reduce((a, b) => a + b, 0);
  return { positive, negative, isMixed: positive > 0 && negative < 0 };
}

/** ¿Se edita como producto con variantes? Por su tipo o, en datos antiguos, por tener varias variantes o atributos. */
export function isVariableProduct(product: { type: ProductType; variants: Array<{ attributes: unknown[] }> }): boolean {
  return product.type === ProductType.VARIABLE || product.variants.length > 1 || (product.variants[0]?.attributes.length ?? 0) > 0;
}

export interface LabelLine {
  sku: string;
  name: string;
  price: number;
  quantity: number;
  /** Combinación de la variante (`M / Rojo`); vacío si no tiene atributos. */
  detail?: string;
}

interface LabelVariant {
  sku: string;
  salePrice: number | string;
  attributes?: Array<{ value: string }>;
}

/** Línea de etiqueta de una variante: el código de barras es su SKU, así que sin SKU no hay etiqueta (`null`). */
export function labelLineFor(productName: string, variant: LabelVariant): LabelLine | null {
  const sku = (variant.sku ?? '').trim();
  if (!sku) return null;
  const detail = (variant.attributes ?? []).map((attribute) => attribute.value.trim()).filter(Boolean).join(' / ');
  return { sku, name: productName, price: Number(variant.salePrice || 0), quantity: 1, ...(detail ? { detail } : {}) };
}

/**
 * Una etiqueta por variante con SKU (con el precio de venta y su combinación). Las variantes sin SKU no pueden llevar
 * código de barras: se cuentan en `skipped` para avisar, en vez de imprimir una etiqueta que no sirve.
 */
export function labelLinesFor(products: Array<{ name: string; variants: LabelVariant[] }>): { lines: LabelLine[]; skipped: number } {
  const lines: LabelLine[] = [];
  let skipped = 0;
  for (const product of products) {
    if (product.variants.length === 0) skipped += 1;
    for (const variant of product.variants) {
      const line = labelLineFor(product.name, variant);
      if (line) lines.push(line);
      else skipped += 1;
    }
  }
  return { lines, skipped };
}
