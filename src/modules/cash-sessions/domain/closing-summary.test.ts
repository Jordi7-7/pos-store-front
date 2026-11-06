import { describe, expect, it } from 'vitest';
import { buildClosingSummary } from './closing-summary';
import type { CashSessionDetails } from './session-types';

const details = (overrides: Record<string, unknown>): CashSessionDetails => overrides as unknown as CashSessionDetails;

const item = (sku: string, price: number, quantity: number, discountAmount = 0) => ({
  quantity,
  price,
  discountAmount,
  variant: { sku, product: { name: `P-${sku}` }, attributeValues: [{ value: 'Rojo' }] },
});

describe('resumen del cierre', () => {
  it('prefiere las cifras del servidor (coinciden con el corte Z)', () => {
    const summary = buildClosingSummary(
      details({
        session: { openingBalance: 100, expectedBalance: 100 },
        kpis: { cashSales: 310, cardSales: 0, totalExpenses: 0, totalRefunds: 310, netSales: 0, salesCount: 1 },
        sales: [{ total: 310, payments: [{ paymentMethod: 'EFECTIVO', amount: 310 }], items: [item('A', 310, 1)] }],
        expenses: [],
        refunds: [],
      }),
    );
    expect(summary).toMatchObject({ openingBalance: 100, cashSales: 310, refundsTotal: 310, expectedCash: 100, salesCount: 1, avgTicket: 0 });
  });

  it('si el servidor no envía una cifra, la recalcula con las reglas del arqueo (sin coma flotante)', () => {
    const summary = buildClosingSummary(
      details({
        session: {},
        kpis: {},
        sales: [{ total: 0.3, payments: [{ paymentMethod: 'EFECTIVO', amount: 0.1 }, { paymentMethod: 'TARJETA', amount: 0.2 }], items: [] }],
        expenses: [{ amount: 0.05 }],
        refunds: [{ totalRefunded: 0.02 }],
      }),
      10,
    );
    expect(summary).toMatchObject({ openingBalance: 10, cashSales: 0.1, cardSales: 0.2, expensesTotal: 0.05, refundsTotal: 0.02, expectedCash: 10.03, netSales: 0.28 });
  });

  it('agrupa los productos por SKU con su descuento', () => {
    const summary = buildClosingSummary(
      details({
        session: {},
        kpis: {},
        sales: [
          { total: 0, payments: [], items: [item('A', 10, 2, 1), item('B', 5, 1)] },
          { total: 0, payments: [], items: [item('A', 10, 1, 1)] },
        ],
        expenses: [],
        refunds: [],
      }),
    );
    expect(summary.productsSummary).toEqual([
      { sku: 'A', name: 'P-A (Rojo)', quantity: 3, total: 27 },
      { sku: 'B', name: 'P-B (Rojo)', quantity: 1, total: 5 },
    ]);
    expect(summary.totalPieces).toBe(4);
  });

  it('sin resumen no inventa datos: todo en cero', () => {
    expect(buildClosingSummary(null)).toMatchObject({ cashSales: 0, expectedCash: 0, salesCount: 0, avgTicket: 0, productsSummary: [] });
  });
});
