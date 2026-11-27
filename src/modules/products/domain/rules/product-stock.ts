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

interface LabelVariant extends StockedVariant {
  sku: string;
  salePrice: number | string;
  attributes?: Array<{ value: string }>;
}

/** Línea de etiqueta de una variante: el código de barras es su SKU, así que sin SKU no hay etiqueta (`null`). */
function labelLineFor(productName: string, variant: Omit<LabelVariant, 'stocks'>): LabelLine | null {
  const sku = (variant.sku ?? '').trim();
  if (!sku) return null;
  const detail = (variant.attributes ?? []).map((attribute) => attribute.value.trim()).filter(Boolean).join(' / ');
  return { sku, name: productName, price: Number(variant.salePrice || 0), quantity: 1, ...(detail ? { detail } : {}) };
}

/**
 * Etiquetas que pide una cantidad de unidades: una por unidad, hacia arriba si hay decimales (una etiqueta no se parte) y
 * ninguna sin unidades o en negativo. Se pasa a centésimas antes para que una suma como 0.1 + 0.2 + 2.7 no pida una de más.
 */
const labelUnits = (quantity: number): number => Math.max(0, Math.ceil(Math.round(quantity * 100) / 100));

/** Línea de una variante con tantas etiquetas como existencias tiene en la sucursal (o en todas); al menos una. */
export function stockedLabelLineFor(productName: string, variant: LabelVariant, branchId: string): LabelLine | null {
  const line = labelLineFor(productName, variant);
  return line && { ...line, quantity: Math.max(1, labelUnits(variantStock(variant, branchId))) };
}

export interface StockLabels {
  lines: LabelLine[];
  /** Variantes sin SKU (o productos sin variantes): no pueden llevar código de barras. */
  skipped: number;
  /** Variantes que quedaron fuera por no tener existencias. */
  withoutStock: number;
  /** Nada de lo elegido tiene existencias: sale una etiqueta de cada uno para poder imprimirlas igualmente. */
  noneInStock: boolean;
}

/**
 * Etiquetas de los productos elegidos: por cada variante, tantas como existencias tiene en la sucursal (sin sucursal, la
 * suma de todas), con el precio de venta y su combinación. Las que no tienen existencias no salen, salvo que no las tenga
 * ninguna. Las variantes sin SKU se cuentan en `skipped` para avisar, en vez de imprimir una etiqueta que no sirve.
 */
export function labelLinesFor(products: Array<{ name: string; variants: LabelVariant[] }>, branchId: string): StockLabels {
  const inStock: LabelLine[] = [];
  const outOfStock: LabelLine[] = [];
  let skipped = 0;
  for (const product of products) {
    if (product.variants.length === 0) skipped += 1;
    for (const variant of product.variants) {
      const line = labelLineFor(product.name, variant);
      if (!line) {
        skipped += 1;
        continue;
      }
      const units = labelUnits(variantStock(variant, branchId));
      if (units > 0) inStock.push({ ...line, quantity: units });
      else outOfStock.push(line);
    }
  }
  if (inStock.length === 0) return { lines: outOfStock, skipped, withoutStock: 0, noneInStock: outOfStock.length > 0 };
  return { lines: inStock, skipped, withoutStock: outOfStock.length, noneInStock: false };
}

interface ArrivedItem {
  sku: string;
  productName: string;
  salePrice: number;
  attributes: string[];
  quantity: number;
}

/**
 * Etiquetas de lo que llegó en un lote: tantas por producto como unidades entraron. Las cantidades con decimales se
 * redondean hacia arriba (una etiqueta no se parte) y las líneas sin unidades no salen. Como en `labelLinesFor`, lo que no
 * tiene SKU se cuenta en `skipped`.
 */
export function labelLinesForArrival(items: readonly ArrivedItem[]): { lines: LabelLine[]; skipped: number } {
  const lines: LabelLine[] = [];
  let skipped = 0;
  for (const item of items) {
    const units = labelUnits(item.quantity);
    if (units === 0) continue;
    const line = labelLineFor(item.productName, { sku: item.sku, salePrice: item.salePrice, attributes: item.attributes.map((value) => ({ value })) });
    if (line) lines.push({ ...line, quantity: units });
    else skipped += 1;
  }
  return { lines, skipped };
}
