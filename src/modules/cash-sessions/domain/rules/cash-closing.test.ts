import { describe, expect, it } from 'vitest';
import { cashDifference, classifyDifference, expectedCashBalance, parseCountedCash } from './cash-closing';

describe('arqueo (paridad con el backend)', () => {
  it('esperado = apertura + efectivo − gastos − devoluciones, sin errores de coma flotante', () => {
    expect(expectedCashBalance({ openingBalance: 100, cashSales: 310, expenses: 0, refunds: 310 })).toBe(100);
    expect(expectedCashBalance({ openingBalance: 0.1, cashSales: 0.2, expenses: 0, refunds: 0 })).toBe(0.3);
    expect(expectedCashBalance({ openingBalance: 100, cashSales: 0, expenses: 0, refunds: 310 })).toBe(-210);
  });

  it('la diferencia es positiva si sobra y negativa si falta', () => {
    expect(cashDifference(105.5, 100)).toBe(5.5);
    expect(cashDifference(99.9, 100)).toBe(-0.1);
    expect(classifyDifference(5.5)).toBe('SURPLUS');
    expect(classifyDifference(-0.1)).toBe('SHORTAGE');
    expect(classifyDifference(0)).toBe('EXACT');
  });

  it('el efectivo contado: vacío o inválido no es un número, y nunca negativo', () => {
    expect(parseCountedCash('')).toBeNull();
    expect(parseCountedCash('  ')).toBeNull();
    expect(parseCountedCash('abc')).toBeNull();
    expect(parseCountedCash('-5')).toBeNull();
    expect(parseCountedCash('100')).toBe(100);
    expect(parseCountedCash('100.50')).toBe(100.5);
    expect(parseCountedCash('0')).toBe(0);
  });
});
