import type { ClosingTicketData } from '@/modules/printing/domain/entities/ticket';
import type { CashSessionDetailsEntity } from '../entities/cash-session.entity';
import { CashSessionStatus } from '../enums';
import { PaymentMethod } from '@/shared/domain/enums/payments';

/** Datos del corte Z de un turno, a partir de su resumen. Solo reordena lo que el servidor calculó. */
export function buildClosingTicketData(details: CashSessionDetailsEntity): ClosingTicketData {
  const { session, kpis } = details;

  // 1. Productos vendidos agrupados por SKU
  const productMap = new Map<string, { sku: string; name: string; quantity: number; subtotal: number; discount: number; total: number }>();
  for (const sale of details.sales) {
    for (const item of sale.items) {
      const sku = item.sku || 'N/A';
      const entry = productMap.get(sku) ?? { sku, name: item.productName, quantity: 0, subtotal: 0, discount: 0, total: 0 };
      entry.quantity += item.quantity;
      entry.subtotal += item.subtotal;
      entry.discount += item.discountAmount + item.globalDiscountAmount;
      entry.total += item.total;
      productMap.set(sku, entry);
    }
  }
  const productsList = [...productMap.values()];

  // 2. Subtotales y descuentos de las ventas
  const salesSubtotal = details.sales.reduce((sum, sale) => {
    const itemsGross = sale.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    return sum + (sale.subtotal > 0 ? sale.subtotal : itemsGross);
  }, 0);
  const discountsTotal = details.sales.reduce((sum, sale) => sum + sale.discountAmount, 0);

  return {
    id: session.id,
    openedAt: session.openedAt,
    closedAt: session.closedAt || undefined,
    openingBalance: session.openingBalance,
    closingBalance: session.closingBalance ?? session.expectedBalance ?? 0,
    expectedBalance: session.expectedBalance ?? 0,
    salesTotal: kpis.netSales,
    salesSubtotal: salesSubtotal > 0 ? salesSubtotal : undefined,
    discountsTotal: discountsTotal > 0 ? discountsTotal : undefined,
    expensesTotal: kpis.totalExpenses,
    refundsTotal: kpis.totalRefunds > 0 ? kpis.totalRefunds : undefined,
    cashSales: kpis.cashSales,
    cardSales: kpis.cardSales,
    salesCount: kpis.salesCount || details.sales.length,
    totalPieces: productsList.reduce((acc, product) => acc + product.quantity, 0),
    cashRegisterName: session.cashRegisterName,
    expensesList: details.expenses.map((expense) => ({ description: expense.description, amount: expense.amount, createdAt: expense.createdAt })),
    productsList,
    paymentsBreakdown: {
      [PaymentMethod.EFECTIVO]: kpis.cashSales,
      [PaymentMethod.TARJETA]: kpis.cardSales,
    },
    refundsList: details.refunds.map((refund) => ({ id: refund.id, reason: refund.reason, items: refund.items })),
    salesList: details.sales.map((sale) => ({
      invoiceNumber: sale.invoiceNumber,
      createdAt: sale.createdAt,
      total: sale.total,
      paymentMethods:
        sale.payments.length > 0
          ? sale.payments.map((payment) => payment.paymentMethod || PaymentMethod.EFECTIVO)
          : [sale.paymentMethod || PaymentMethod.EFECTIVO],
    })),
    userName: session.openedByName,
    branchName: session.branchName,
    branchAddress: session.branchAddress,
    isClosed: session.status === CashSessionStatus.CLOSED || !!session.closedAt,
  };
}
