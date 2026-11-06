import { Money } from '@/shared/domain/money';

/**
 * Arqueo de caja: reglas puras con paridad con el backend
 * (`pos-store/src/modules/sales/domain/services/cash-closing.ts`). El servidor es quien decide el
 * esperado al cerrar; esto sirve para mostrarlo y para detectar diferencias en pantalla.
 */

export interface CashDrawerMovements {
  openingBalance: number;
  cashSales: number;
  expenses: number;
  refunds: number;
}

/** Efectivo que debería haber en el cajón: apertura + ventas en efectivo − gastos − devoluciones. */
export function expectedCashBalance(movements: CashDrawerMovements): number {
  return Money.of(movements.openingBalance)
    .plus(Money.of(movements.cashSales))
    .minus(Money.of(movements.expenses))
    .minus(Money.of(movements.refunds))
    .toNumber();
}

/** Diferencia del arqueo: positiva si sobra efectivo, negativa si falta. */
export function cashDifference(countedCash: number, expectedBalance: number): number {
  return Money.of(countedCash).minus(Money.of(expectedBalance)).toNumber();
}

export type DifferenceKind = 'EXACT' | 'SURPLUS' | 'SHORTAGE';

export function classifyDifference(difference: number): DifferenceKind {
  if (difference > 0) return 'SURPLUS';
  if (difference < 0) return 'SHORTAGE';
  return 'EXACT';
}

/**
 * Lo que el cajero escribió como efectivo contado, o `null` si está vacío o no es un importe
 * válido (el backend rechaza cierres negativos con `VALIDATION_FAILED`).
 */
export function parseCountedCash(input: string): number | null {
  const text = input.trim();
  if (text === '') return null;
  try {
    const value = Money.of(text);
    return value.isNegative() ? null : value.toNumber();
  } catch {
    return null;
  }
}

export interface SessionSalePayment {
  paymentMethod: string;
  amount: number | string | null;
}

export interface SessionSaleTotals {
  total: number | string | null;
  payments: readonly SessionSalePayment[];
}

export interface CashSessionTotals {
  grossSales: number;
  netSales: number;
  cashSales: number;
  cardSales: number;
  totalExpenses: number;
  totalRefunds: number;
}

/**
 * Totales de una sesión. Una venta sin pagos registrados (datos antiguos) cuenta como efectivo por
 * su total. Las ventas netas nunca bajan de cero.
 */
export function summarizeCashSession(input: {
  sales: readonly SessionSaleTotals[];
  expenseAmounts: ReadonlyArray<number | string | null>;
  refundAmounts: ReadonlyArray<number | string | null>;
}): CashSessionTotals {
  let gross = Money.ZERO;
  let cash = Money.ZERO;
  let card = Money.ZERO;

  for (const sale of input.sales) {
    const total = Money.of(sale.total ?? 0);
    gross = gross.plus(total);
    if (sale.payments.length === 0) {
      cash = cash.plus(total);
      continue;
    }
    for (const payment of sale.payments) {
      const amount = Money.of(payment.amount ?? 0);
      if (payment.paymentMethod === 'TARJETA') card = card.plus(amount);
      else if (payment.paymentMethod === 'EFECTIVO') cash = cash.plus(amount);
    }
  }

  const expenses = Money.sum(input.expenseAmounts.map((amount) => Money.of(amount ?? 0)));
  const refunds = Money.sum(input.refundAmounts.map((amount) => Money.of(amount ?? 0)));
  const net = gross.minus(refunds);

  return {
    grossSales: gross.toNumber(),
    netSales: net.isNegative() ? 0 : net.toNumber(),
    cashSales: cash.toNumber(),
    cardSales: card.toNumber(),
    totalExpenses: expenses.toNumber(),
    totalRefunds: refunds.toNumber(),
  };
}
