import { Money } from '@/shared/domain/value-objects/money';
import { parseMoneyInput } from '@/shared/domain/rules/money-input';

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

/** Lo que el cajero escribió como efectivo contado, o `null` si no es un importe válido (el backend rechaza cierres negativos). */
export const parseCountedCash = parseMoneyInput;
