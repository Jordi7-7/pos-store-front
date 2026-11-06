import type { CartProductRef, CartVariantRef } from '../entities/cart-item';
import { DiscountType } from '@/modules/sales/domain/enums';
import { Money } from '@/shared/domain/value-objects/money';

/**
 * Reglas puras del carrito (sin React ni avisos): todo el dinero pasa por `Money`, igual que en el
 * backend, así que el total que ve el cajero es el que el servidor valida. Los avisos al usuario
 * los decide la capa de presentación a partir del resultado.
 */


export interface PricedCartLine {
  price: number;
  unitSalePrice: number;
  wholesalePrice?: number | null;
  isWholesale?: boolean;
  quantity: number;
  discountType?: DiscountType;
  discountRate?: number;
  discountAmount?: number;
}

export const hasWholesalePrice = (line: Pick<PricedCartLine, 'wholesalePrice'>): boolean =>
  line.wholesalePrice !== null && line.wholesalePrice !== undefined && Number(line.wholesalePrice) > 0;

const money = (value: number): number => Money.of(value).toNumber();

export interface LineDiscountResult {
  discountType: DiscountType;
  /** Lo que se muestra: el porcentaje, o el precio final por unidad si el descuento es por monto. */
  discountRate: number;
  /** Descuento por unidad. */
  discountAmount: number;
  /** El valor escrito se recortó: `MAX_PERCENT` (>100 %) o `ABOVE_PRICE` (precio mayor al original). */
  clamped: 'MAX_PERCENT' | 'ABOVE_PRICE' | null;
}

/**
 * Descuento de una línea. Por porcentaje: `input` es el % (máx. 100). Por monto: `input` es el
 * precio final por unidad (no puede superar el precio original) y el descuento es la diferencia.
 */
export function computeLineDiscount(price: number, type: DiscountType, input: number): LineDiscountResult {
  let value = Number.isFinite(input) ? money(input) : 0;
  if (value < 0) value = 0;

  let clamped: LineDiscountResult['clamped'] = null;
  let amount: number;
  if (type === DiscountType.PERCENTAGE) {
    if (value > 100) {
      value = 100;
      clamped = 'MAX_PERCENT';
    }
    amount = Money.of(price).fraction(value, 100).toNumber();
  } else {
    if (value > price) {
      value = price;
      clamped = 'ABOVE_PRICE';
    }
    amount = Money.of(price).minus(Money.of(value)).toNumber();
  }
  return { discountType: type, discountRate: value, discountAmount: Math.max(0, Math.min(price, amount)), clamped };
}

/** Descuento por unidad que corresponde a un precio nuevo, conservando el tipo de descuento de la línea. */
export function discountForPrice(line: Pick<PricedCartLine, 'discountType' | 'discountRate' | 'discountAmount'>, newPrice: number): number {
  if (line.discountType === DiscountType.PERCENTAGE) {
    return Money.of(newPrice).fraction(line.discountRate || 0, 100).toNumber();
  }
  if (line.discountType === DiscountType.AMOUNT && (line.discountAmount || 0) > 0) {
    const discount = Money.of(newPrice).minus(Money.of(line.discountRate || 0));
    return discount.isNegative() ? 0 : discount.toNumber();
  }
  return 0;
}

/** La línea con precio de mayoreo o regular (si no tiene mayoreo configurado, se queda regular). */
export function withWholesale<T extends PricedCartLine>(line: T, wholesale: boolean): T {
  const useWholesale = wholesale && hasWholesalePrice(line);
  const price = useWholesale ? Number(line.wholesalePrice) : line.unitSalePrice;
  return { ...line, isWholesale: useWholesale, price, discountAmount: discountForPrice(line, price) };
}

export interface GlobalDiscountResult {
  rate: number;
  clamped: 'MAX_PERCENT' | 'ABOVE_SUBTOTAL' | null;
}

/** Descuento global permitido: no negativo, ≤ 100 % (o ≤ subtotal neto si es por monto). */
export function clampGlobalDiscount(type: DiscountType, rate: number, netSubtotal: number): GlobalDiscountResult {
  let value = Number.isFinite(rate) ? money(rate) : 0;
  if (value < 0) value = 0;
  if (type === DiscountType.PERCENTAGE && value > 100) return { rate: 100, clamped: 'MAX_PERCENT' };
  if (type === DiscountType.AMOUNT && value > netSubtotal) return { rate: netSubtotal, clamped: 'ABOVE_SUBTOTAL' };
  return { rate: value, clamped: null };
}

export interface CartTotals {
  grossSubtotal: number;
  totalItemDiscounts: number;
  netSubtotal: number;
  globalDiscountAmount: number;
  total: number;
}

export function computeCartTotals(
  lines: readonly Pick<PricedCartLine, 'price' | 'quantity' | 'discountAmount'>[],
  globalType: DiscountType,
  globalRate: number,
): CartTotals {
  const gross = Money.sum(lines.map((line) => Money.ofLine(line.price, line.quantity)));
  const itemDiscounts = Money.sum(lines.map((line) => Money.ofLine(line.discountAmount || 0, line.quantity)));
  const net = gross.minus(itemDiscounts);

  const requested = globalType === DiscountType.PERCENTAGE ? net.fraction(globalRate, 100) : Money.of(globalRate);
  const global = requested.greaterThan(net) ? net : requested;

  return {
    grossSubtotal: gross.toNumber(),
    totalItemDiscounts: itemDiscounts.toNumber(),
    netSubtotal: net.toNumber(),
    globalDiscountAmount: global.toNumber(),
    total: net.minus(global).toNumber(),
  };
}

/** Variante del buscador del POS en el formato que pide el carrito: precios como número y mayoreo ausente como `null`. */
export function cartRefsFromPosVariant(found: {
  id: string;
  sku: string;
  productName: string;
  productType?: string;
  salePrice: number;
  wholesalePrice?: number | null;
  attributes?: Array<{ name: string; value: string }>;
  imageUrl?: string | null;
}): { product: CartProductRef; variant: CartVariantRef } {
  return {
    product: { id: found.id, name: found.productName, type: found.productType },
    variant: {
      id: found.id,
      sku: found.sku,
      salePrice: Number(found.salePrice || 0),
      wholesalePrice: found.wholesalePrice !== undefined && found.wholesalePrice !== null ? Number(found.wholesalePrice) : null,
      attributes: found.attributes ?? [],
      imageUrl: found.imageUrl,
    },
  };
}
