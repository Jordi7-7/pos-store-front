import { describe, expect, it } from 'vitest';
import { PaymentMethod, SaleStatus } from '@/shared/domain/payments';
import { CashSessionDifferenceStatus, CashSessionStatus } from './enums';
import type { CashSessionDetailsEntity } from './entities/cash-session.entity';
import { buildClosingTicketData } from './closing-ticket';

const details: CashSessionDetailsEntity = {
  session: {
    id: 's1', openingBalance: 100, closingBalance: 100, expectedBalance: 100, difference: 0, differenceStatus: CashSessionDifferenceStatus.EXACT,
    status: CashSessionStatus.CLOSED, isClosed: true, openedAt: '2026-11-05T16:00:00Z', closedAt: '2026-11-05T18:00:00Z', openedByName: 'Ana',
    branchName: 'Centro', branchAddress: 'Calle 1', cashRegisterName: 'Caja 1', cashRegisterCode: '1', totalSales: 310,
  },
  kpis: { grossSales: 310, netSales: 0, cashSales: 310, cardSales: 0, totalExpenses: 20, totalRefunds: 310, salesCount: 1, expensesCount: 1, refundsCount: 1 },
  sales: [{
    id: 'v', invoiceNumber: '001', createdAt: '2026-11-05T17:00:00Z', userName: 'Ana', customerName: 'X', customerIdentity: '1', totalItems: 3, status: SaleStatus.REFUNDED,
    subtotal: 330, discountAmount: 20, itemsDiscountAmount: 10, globalDiscountAmount: 10, total: 310, paymentMethod: PaymentMethod.EFECTIVO,
    payments: [{ id: 'p', paymentMethod: 'EFECTIVO', amount: 310 }],
    items: [
      { id: 'i1', variantId: 'a', sku: 'A', productName: 'Camisa', combinationText: '', attributeValues: [], quantity: 2, price: 100, subtotal: 200, discountAmount: 10, globalDiscountAmount: 5, total: 185 },
      { id: 'i2', variantId: 'a', sku: 'A', productName: 'Camisa', combinationText: '', attributeValues: [], quantity: 1, price: 130, subtotal: 130, discountAmount: 0, globalDiscountAmount: 5, total: 125 },
    ],
  }],
  expenses: [{ id: 'e', description: 'Hielo', amount: 20, createdAt: '2026-11-05T17:10:00Z', userName: 'Ana', category: 'General' }],
  refunds: [{ id: 'r', reason: 'Talla', items: [{ name: 'Camisa', sku: 'A', quantity: 1 }], totalRefunded: 310, createdAt: '2026-11-05T17:30:00Z', userName: 'Ana', invoiceNumber: '001' }],
};

describe('corte Z a partir del resumen del turno', () => {
  it('reordena las cifras del servidor sin recalcularlas', () => {
    expect(buildClosingTicketData(details)).toMatchObject({
      id: 's1', openingBalance: 100, closingBalance: 100, expectedBalance: 100, salesTotal: 0, expensesTotal: 20, refundsTotal: 310,
      cashSales: 310, cardSales: 0, salesCount: 1, cashRegisterName: 'Caja 1', userName: 'Ana', branchName: 'Centro', branchAddress: 'Calle 1', isClosed: true,
      paymentsBreakdown: { EFECTIVO: 310, TARJETA: 0 },
    });
  });

  it('agrupa los productos por SKU con lo cobrado y sus descuentos (de línea + global)', () => {
    expect(buildClosingTicketData(details).productsList).toEqual([{ sku: 'A', name: 'Camisa', quantity: 3, subtotal: 330, discount: 20, total: 310 }]);
  });

  it('incluye gastos, devoluciones con sus artículos y la lista de ventas con sus métodos de pago', () => {
    const ticket = buildClosingTicketData(details);
    expect(ticket.expensesList).toEqual([{ description: 'Hielo', amount: 20, createdAt: '2026-11-05T17:10:00Z' }]);
    expect(ticket.refundsList).toEqual([{ id: 'r', reason: 'Talla', items: [{ name: 'Camisa', sku: 'A', quantity: 1 }] }]);
    expect(ticket.salesList).toEqual([{ invoiceNumber: '001', createdAt: '2026-11-05T17:00:00Z', total: 310, paymentMethods: ['EFECTIVO'] }]);
    expect(ticket.salesSubtotal).toBe(330);
    expect(ticket.discountsTotal).toBe(20);
  });

  it('un turno abierto se imprime como abierto y sin contado inventado: usa el esperado', () => {
    const open = { ...details, session: { ...details.session, status: CashSessionStatus.OPEN, isClosed: false, closedAt: null, closingBalance: null } };
    expect(buildClosingTicketData(open)).toMatchObject({ isClosed: false, closingBalance: 100, closedAt: undefined });
  });
});
