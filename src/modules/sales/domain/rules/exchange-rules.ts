import { Money } from '@/shared/domain/value-objects/money';

/**
 * Importes de una devolución o cambio, con paridad con el backend
 * (`pos-store/src/modules/sales/domain/services/refund-plan.ts`): se devuelve lo que el cliente
 * PAGÓ por la línea (con el descuento global ya prorrateado), no el precio menos el descuento de línea.
 */

export interface RefundableItem {
  quantity: number;
  refundedQty: number;
  price: number;
  discountAmount: number;
  /** Lo que el cliente pagó por la línea (neto, tras el descuento global). Las ventas antiguas lo guardaban en 0. */
  lineTotal?: number;
}

function paidForLine(item: RefundableItem): Money {
  if ((item.lineTotal ?? 0) > 0) return Money.of(item.lineTotal ?? 0);
  const net = Money.ofLine(item.price, item.quantity).minus(Money.of(item.discountAmount));
  return net.isNegative() ? Money.ZERO : net;
}

/**
 * Importe de devolver `quantity` unidades de la línea. Se calcula sobre lo acumulado, así varias
 * devoluciones parciales suman justo lo pagado: 3 unidades por 10.00 devuelven 3.33, 3.34 y 3.33.
 */
export function refundAmount(item: RefundableItem, quantity: number): number {
  const paid = paidForLine(item);
  const after = item.refundedQty + quantity;
  return paid.fraction(after, item.quantity).minus(paid.fraction(item.refundedQty, item.quantity)).toNumber();
}

/** Total a devolver por las cantidades elegidas por línea (`quantities[saleItemId]`). */
export function returnTotal(items: ReadonlyArray<RefundableItem & { saleItemId: string }>, quantities: Readonly<Record<string, number>>): number {
  return Money.sum(items.map((item) => Money.of(refundAmount(item, quantities[item.saleItemId] ?? 0)))).toNumber();
}

export interface ExchangeLine {
  price: number;
  quantity: number;
  /** Descuento por unidad. */
  discountAmount?: number;
}

/** Total de los productos nuevos de un cambio (cada línea, con su descuento, nunca por debajo de 0). */
export function newItemsTotal(lines: readonly ExchangeLine[]): number {
  return Money.sum(
    lines.map((line) => {
      const net = Money.ofLine(line.price, line.quantity).minus(Money.ofLine(line.discountAmount ?? 0, line.quantity));
      return net.isNegative() ? Money.ZERO : net;
    }),
  ).toNumber();
}

/** Diferencia del cambio: positiva si el cliente paga, negativa si se le devuelve dinero. */
export function exchangeDifference(newTotal: number, returnTotal: number): number {
  return Money.of(newTotal).minus(Money.of(returnTotal)).toNumber();
}
