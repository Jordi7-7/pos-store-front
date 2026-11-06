import { describe, expect, it } from 'vitest';
import { PaymentMethod, SaleStatus } from '@/shared/domain/payments';
import { CashSessionDifferenceStatus, CashSessionStatus } from './enums';
import type { CashSessionDetailsEntity, CashSessionSaleEntity } from './entities/cash-session.entity';
import { buildClosingSummary } from './closing-summary';

const item = (sku: string, total: number, quantity: number, attributeValues: string[] = ['Rojo']) => ({
  id: sku, variantId: sku, sku, productName: `P-${sku}`, combinationText: attributeValues.join(' / '), attributeValues,
  quantity, price: total / quantity, subtotal: total, discountAmount: 0, globalDiscountAmount: 0, total,
});

const sale = (items: ReturnType<typeof item>[]): CashSessionSaleEntity => ({
  id: 's', invoiceNumber: '1', createdAt: '2026-11-05T17:00:00Z', userName: 'C', customerName: 'X', customerIdentity: '1', totalItems: items.length,
  status: SaleStatus.COMPLETED, subtotal: 0, discountAmount: 0, itemsDiscountAmount: 0, globalDiscountAmount: 0, total: 0,
  paymentMethod: PaymentMethod.EFECTIVO, payments: [], items,
});

const details = (overrides: Partial<CashSessionDetailsEntity> = {}, session: Partial<CashSessionDetailsEntity['session']> = {}): CashSessionDetailsEntity => ({
  session: {
    id: 's1', openingBalance: 100, closingBalance: null, expectedBalance: 100, difference: null, differenceStatus: CashSessionDifferenceStatus.PENDING,
    status: CashSessionStatus.OPEN, isClosed: false, openedAt: '2026-11-05T16:00:00Z', closedAt: null, openedByName: 'C', branchName: 'B', branchAddress: '',
    cashRegisterName: 'Caja', cashRegisterCode: '1', totalSales: 0, ...session,
  },
  kpis: { grossSales: 310, netSales: 0, cashSales: 310, cardSales: 0, totalExpenses: 0, totalRefunds: 310, salesCount: 1, expensesCount: 0, refundsCount: 1 },
  sales: [],
  expenses: [],
  refunds: [],
  ...overrides,
});

describe('resumen del cierre', () => {
  it('usa las cifras del servidor (coinciden con el corte Z) y su efectivo esperado', () => {
    expect(buildClosingSummary(details())).toMatchObject({ openingBalance: 100, cashSales: 310, refundsTotal: 310, expectedCash: 100, salesCount: 1, avgTicket: 0 });
  });

  it('un turno abierto sin esperado del servidor lo calcula con la regla del arqueo (sin coma flotante)', () => {
    const summary = buildClosingSummary(
      details({ kpis: { grossSales: 0.3, netSales: 0.28, cashSales: 0.1, cardSales: 0.2, totalExpenses: 0.05, totalRefunds: 0.02, salesCount: 2, expensesCount: 1, refundsCount: 1 } }, { openingBalance: 10, expectedBalance: null }),
    );
    expect(summary.expectedCash).toBe(10.03);
    expect(summary.avgTicket).toBe(0.14);
  });

  it('agrupa los productos por SKU con lo realmente cobrado (descuentos incluidos)', () => {
    const summary = buildClosingSummary(details({ sales: [sale([item('A', 18, 2), item('B', 5, 1)]), sale([item('A', 9, 1)])] }));
    expect(summary.productsSummary).toEqual([
      { sku: 'A', name: 'P-A (Rojo)', quantity: 3, total: 27 },
      { sku: 'B', name: 'P-B (Rojo)', quantity: 1, total: 5 },
    ]);
    expect(summary.totalPieces).toBe(4);
  });

  it('sin resumen no inventa datos: todo en cero y el fondo de apertura conocido', () => {
    expect(buildClosingSummary(null, 100)).toMatchObject({ openingBalance: 100, cashSales: 0, expectedCash: 100, salesCount: 0, avgTicket: 0, productsSummary: [] });
  });
});
