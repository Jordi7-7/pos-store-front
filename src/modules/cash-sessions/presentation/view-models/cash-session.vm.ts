import type { Formatters } from '@/shared/presentation/formatters';
import { SaleStatus } from '@/shared/domain/payments';
import { CashSessionDifferenceStatus } from '../../domain/enums';
import type {
  CashSessionDetailsEntity,
  CashSessionExpenseEntity,
  CashSessionHeaderEntity,
  CashSessionRefundEntity,
  CashSessionSaleEntity,
  CashSessionSaleItemEntity,
  CashSessionSalePaymentEntity,
  SessionKPIsEntity,
} from '../../domain/entities/cash-session.entity';

/**
 * View-models del turno de caja: la entidad más los textos listos para mostrar (moneda, hora y
 * idioma de la tienda). Son funciones puras: mismos datos y mismo formato, mismos textos.
 */

export type CashSessionHeaderVM = CashSessionHeaderEntity & {
  openingBalanceFormatted: string;
  closingBalanceFormatted: string;
  expectedBalanceFormatted: string;
  differenceFormatted: string;
  differenceStatusText: string;
  openedAtFormatted: string;
  closedAtFormatted: string;
  dateFormatted: string;
  openTimeFormatted: string;
  closeTimeFormatted: string;
  timeRangeFormatted: string;
  durationFormatted: string;
  totalSalesFormatted: string;
};

export type SessionKPIsVM = SessionKPIsEntity & {
  grossSalesFormatted: string;
  netSalesFormatted: string;
  cashSalesFormatted: string;
  cardSalesFormatted: string;
  totalExpensesFormatted: string;
  totalRefundsFormatted: string;
  expensesLabel: string;
  refundsLabel: string;
};

export type CashSessionSaleItemVM = CashSessionSaleItemEntity & { priceFormatted: string; totalFormatted: string };
export type CashSessionSalePaymentVM = CashSessionSalePaymentEntity & { amountFormatted: string };
export type CashSessionSaleVM = Omit<CashSessionSaleEntity, 'items' | 'payments'> & {
  items: CashSessionSaleItemVM[];
  payments: CashSessionSalePaymentVM[];
  createdAtFormatted: string;
  statusLabel: string;
  subtotalFormatted: string;
  discountAmountFormatted: string;
  totalFormatted: string;
  paymentMethodsLabel: string;
};
export type CashSessionExpenseVM = CashSessionExpenseEntity & { amountFormatted: string; createdAtFormatted: string };
export type CashSessionRefundVM = CashSessionRefundEntity & { totalRefundedFormatted: string; createdAtFormatted: string };

export interface CashSessionDetailsVM {
  session: CashSessionHeaderVM;
  kpis: SessionKPIsVM;
  sales: CashSessionSaleVM[];
  expenses: CashSessionExpenseVM[];
  refunds: CashSessionRefundVM[];
}

const SALE_STATUS_LABEL: Record<SaleStatus, string> = {
  [SaleStatus.COMPLETED]: 'Completada',
  [SaleStatus.PARTIALLY_REFUNDED]: 'Dev. Parcial',
  [SaleStatus.REFUNDED]: 'Reembolsada',
  [SaleStatus.CANCELLED]: 'Cancelada',
};

function differenceText(session: CashSessionHeaderEntity, fmt: Formatters): string {
  const { difference } = session;
  switch (session.differenceStatus) {
    case CashSessionDifferenceStatus.PENDING:
      return 'En turno';
    case CashSessionDifferenceStatus.SURPLUS:
      return `Sobran +${fmt.money(difference)}`;
    case CashSessionDifferenceStatus.SHORTAGE:
      return `Faltan -${fmt.money(Math.abs(difference ?? 0))}`;
    default:
      return `Exacto (${fmt.money(0)})`;
  }
}

export function toCashSessionHeaderVM(entity: CashSessionHeaderEntity, fmt: Formatters): CashSessionHeaderVM {
  const openTime = fmt.time(entity.openedAt);
  const closeTime = entity.closedAt ? fmt.time(entity.closedAt) : 'En curso';
  return {
    ...entity,
    openingBalanceFormatted: fmt.money(entity.openingBalance),
    closingBalanceFormatted: fmt.money(entity.closingBalance),
    expectedBalanceFormatted: fmt.money(entity.expectedBalance),
    differenceFormatted: fmt.money(Math.abs(entity.difference ?? 0)),
    differenceStatusText: differenceText(entity, fmt),
    openedAtFormatted: openTime,
    closedAtFormatted: entity.closedAt ? fmt.time(entity.closedAt) : 'Sesión activa',
    dateFormatted: fmt.date(entity.openedAt),
    openTimeFormatted: openTime,
    closeTimeFormatted: closeTime,
    timeRangeFormatted: entity.closedAt ? `${openTime} — ${closeTime}` : `Desde ${openTime} (En curso)`,
    durationFormatted: fmt.duration(entity.openedAt, entity.closedAt),
    totalSalesFormatted: fmt.money(entity.totalSales),
  };
}

const plural = (count: number, one: string, many: string): string => `${count} ${count === 1 ? one : many}`;

export function toCashSessionDetailsVM(entity: CashSessionDetailsEntity, fmt: Formatters): CashSessionDetailsVM {
  const { kpis } = entity;
  return {
    session: toCashSessionHeaderVM(entity.session, fmt),
    kpis: {
      ...kpis,
      grossSalesFormatted: fmt.money(kpis.grossSales),
      netSalesFormatted: fmt.money(kpis.netSales),
      cashSalesFormatted: fmt.money(kpis.cashSales),
      cardSalesFormatted: fmt.money(kpis.cardSales),
      totalExpensesFormatted: `-${fmt.money(kpis.totalExpenses)}`,
      totalRefundsFormatted: `-${fmt.money(kpis.totalRefunds)}`,
      expensesLabel: plural(kpis.expensesCount, 'salida', 'salidas'),
      refundsLabel: plural(kpis.refundsCount, 'reembolso', 'reembolsos'),
    },
    sales: entity.sales.map((sale) => ({
      ...sale,
      items: sale.items.map((item) => ({ ...item, priceFormatted: fmt.money(item.price), totalFormatted: fmt.money(item.total) })),
      payments: sale.payments.map((payment) => ({ ...payment, amountFormatted: fmt.money(payment.amount) })),
      createdAtFormatted: fmt.time(sale.createdAt),
      statusLabel: SALE_STATUS_LABEL[sale.status],
      subtotalFormatted: fmt.money(sale.subtotal),
      discountAmountFormatted: fmt.money(sale.discountAmount),
      totalFormatted: fmt.money(sale.total),
      paymentMethodsLabel: sale.payments.map((p) => p.paymentMethod).join('/') || sale.paymentMethod || 'EFECTIVO',
    })),
    expenses: entity.expenses.map((expense) => ({
      ...expense,
      amountFormatted: `-${fmt.money(expense.amount)}`,
      createdAtFormatted: fmt.time(expense.createdAt),
    })),
    refunds: entity.refunds.map((refund) => ({
      ...refund,
      totalRefundedFormatted: `-${fmt.money(refund.totalRefunded)}`,
      createdAtFormatted: fmt.time(refund.createdAt),
    })),
  };
}
