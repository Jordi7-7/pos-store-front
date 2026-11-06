import { Money } from '@/shared/domain/value-objects/money';

/**
 * Cálculo de una venta con paridad con el backend
 * (`pos-store/src/modules/sales/domain/services/sale-pricing.ts`): si esto y el servidor
 * discrepan, el ticket no coincide con lo cobrado. Si cambia uno, cambia el otro.
 */

export class SalePricingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SalePricingError';
  }
}

export interface SaleLineAmounts {
  quantity: number;
  price: number;
  /** Descuento total de la línea (no por unidad). */
  discountAmount?: number;
}

export interface PricedSaleLine {
  subtotal: number;
  discountAmount: number;
  globalDiscountAmount: number;
  total: number;
}

export interface SalePricing {
  lines: PricedSaleLine[];
  subtotal: number;
  itemsDiscountAmount: number;
  globalDiscountAmount: number;
  discountAmount: number;
  total: number;
}

interface LineBase {
  gross: Money;
  discount: Money;
  net: Money;
}

function priceLineBase(line: SaleLineAmounts): LineBase {
  if (!(line.quantity > 0)) throw new SalePricingError('La cantidad de cada producto debe ser mayor a 0.');
  if (!(line.price >= 0)) throw new SalePricingError('El precio de un producto no puede ser negativo.');

  const gross = Money.ofLine(line.price, line.quantity);
  const discount = Money.of(line.discountAmount ?? 0);
  if (discount.isNegative()) throw new SalePricingError('El descuento de un producto no puede ser negativo.');
  if (discount.greaterThan(gross)) throw new SalePricingError('El descuento de un producto no puede superar su importe.');

  return { gross, discount, net: gross.minus(discount) };
}

/**
 * Importes de una venta y sus invariantes: cantidades positivas, precios y descuentos no
 * negativos, descuento de línea ≤ su importe, descuento global ≤ base tras descuentos de línea.
 * El descuento global se prorratea por la base de cada línea y las líneas suman exactamente el total.
 */
export function priceSale(lines: readonly SaleLineAmounts[], globalDiscountAmount = 0): SalePricing {
  if (lines.length === 0) throw new SalePricingError('La venta debe incluir al menos un producto.');

  const bases = lines.map(priceLineBase);
  const subtotal = Money.sum(bases.map((base) => base.gross));
  const itemsDiscount = Money.sum(bases.map((base) => base.discount));
  const netBase = Money.sum(bases.map((base) => base.net));

  const globalDiscount = Money.of(globalDiscountAmount);
  if (globalDiscount.isNegative()) throw new SalePricingError('El descuento global no puede ser negativo.');
  if (globalDiscount.greaterThan(netBase)) throw new SalePricingError('El descuento global no puede superar el total de la venta.');

  const proratedDiscounts = globalDiscount.allocate(bases.map((base) => base.net));

  return {
    lines: bases.map((base, index) => {
      const prorated = proratedDiscounts[index] ?? Money.ZERO;
      return {
        subtotal: base.gross.toNumber(),
        discountAmount: base.discount.toNumber(),
        globalDiscountAmount: prorated.toNumber(),
        total: base.net.minus(prorated).toNumber(),
      };
    }),
    subtotal: subtotal.toNumber(),
    itemsDiscountAmount: itemsDiscount.toNumber(),
    globalDiscountAmount: globalDiscount.toNumber(),
    discountAmount: itemsDiscount.plus(globalDiscount).toNumber(),
    total: netBase.minus(globalDiscount).toNumber(),
  };
}

/** Los pagos cubren el total de la venta (sin margen de error de coma flotante). */
export function paymentsCoverTotal(saleTotal: number, paymentAmounts: readonly number[]): boolean {
  const paid = Money.sum(paymentAmounts.map((amount) => Money.of(amount)));
  return !paid.lessThan(Money.of(saleTotal));
}

/** Lo que falta por cubrir (nunca negativo). */
export function remainingToPay(saleTotal: number, paymentAmounts: readonly number[]): number {
  const paid = Money.sum(paymentAmounts.map((amount) => Money.of(amount)));
  const missing = Money.of(saleTotal).minus(paid);
  return missing.isNegative() ? 0 : missing.toNumber();
}

/** Cambio a entregar: lo pagado que excede el total (nunca negativo). */
export function changeDue(saleTotal: number, paymentAmounts: readonly number[]): number {
  const paid = Money.sum(paymentAmounts.map((amount) => Money.of(amount)));
  const excess = paid.minus(Money.of(saleTotal));
  return excess.isNegative() ? 0 : excess.toNumber();
}

const CASH = 'EFECTIVO';

/**
 * Lo que de cada pago se aplica al total. Lo que excede el total es vuelto, no ingreso: se recorta
 * primero del efectivo (lo único que se devuelve en mano). Conserva el orden original y descarta
 * los pagos que quedan en cero.
 */
export function allocatePayments<T extends { paymentMethod: string; amount: number }>(saleTotal: number, payments: readonly T[]): T[] {
  let budget = Money.of(saleTotal);
  const applied = new Map<T, Money>();

  // Primero lo que no es efectivo (no admite vuelto); el efectivo cubre lo que falte
  const byPriority = [...payments].sort((a, b) => Number(a.paymentMethod === CASH) - Number(b.paymentMethod === CASH));
  for (const payment of byPriority) {
    const amount = Money.of(payment.amount);
    const part = amount.lessThan(budget) ? amount : budget;
    applied.set(payment, part);
    budget = budget.minus(part);
  }

  return payments
    .map((payment) => ({ ...payment, amount: (applied.get(payment) ?? Money.ZERO).toNumber() }))
    .filter((payment) => payment.amount > 0);
}
