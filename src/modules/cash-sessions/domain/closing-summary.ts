import { expectedCashBalance, summarizeCashSession } from './cash-closing';
import type { CashSessionDetails } from './session-types';

export interface ProductSummaryItem {
  sku: string;
  name: string;
  quantity: number;
  total: number;
}

export interface ClosingSummary {
  openingBalance: number;
  cashSales: number;
  cardSales: number;
  expensesTotal: number;
  refundsTotal: number;
  netSales: number;
  /** Efectivo que debería haber en el cajón. */
  expectedCash: number;
  salesCount: number;
  avgTicket: number;
  productsSummary: ProductSummaryItem[];
  totalPieces: number;
}

/** Productos vendidos en el turno, agrupados por SKU. */
export function summarizeProducts(sales: NonNullable<CashSessionDetails['sales']>): ProductSummaryItem[] {
  const bySku = new Map<string, ProductSummaryItem>();
  for (const sale of sales) {
    for (const item of sale.items || []) {
      const sku = item.variant?.sku || 'N/A';
      const productName = item.variant?.product?.name || 'Producto';
      const attributes = (item.variant?.attributeValues || []).map((av) => av.value).filter(Boolean).join(' · ');
      const entry = bySku.get(sku) ?? { sku, name: attributes ? `${productName} (${attributes})` : productName, quantity: 0, total: 0 };
      const quantity = Number(item.quantity || 0);
      entry.quantity += quantity;
      entry.total += (Number(item.price || 0) - Number(item.discountAmount || 0)) * quantity;
      bySku.set(sku, entry);
    }
  }
  return [...bySku.values()];
}

/**
 * Cifras del cierre a partir del resumen que entrega el servidor (la fuente de verdad: coincide con
 * el corte Z). Solo si el servidor no envía alguna cifra se recalcula con las reglas del arqueo.
 */
export function buildClosingSummary(details: CashSessionDetails | null, fallbackOpeningBalance = 0): ClosingSummary {
  const sales = details?.sales ?? [];
  const expenses = details?.expenses ?? [];
  const refunds = details?.refunds ?? [];
  const kpis = details?.kpis;
  const session = details?.session;

  const fallback = summarizeCashSession({
    sales,
    expenseAmounts: expenses.map((e) => e.amount),
    refundAmounts: refunds.map((r) => r.totalRefunded),
  });

  const openingBalance = session?.openingBalance !== undefined ? Number(session.openingBalance) : Number(fallbackOpeningBalance || 0);
  const cashSales = kpis?.cashSales !== undefined ? Number(kpis.cashSales) : fallback.cashSales;
  const cardSales = kpis?.cardSales !== undefined ? Number(kpis.cardSales) : fallback.cardSales;
  const expensesTotal = kpis?.totalExpenses !== undefined ? Number(kpis.totalExpenses) : fallback.totalExpenses;
  const refundsTotal = kpis?.totalRefunds !== undefined ? Number(kpis.totalRefunds) : fallback.totalRefunds;
  const netSales = kpis?.netSales !== undefined ? Number(kpis.netSales) : fallback.netSales;
  const expectedCash =
    session?.expectedBalance !== undefined && session.expectedBalance !== null
      ? Number(session.expectedBalance)
      : expectedCashBalance({ openingBalance, cashSales, expenses: expensesTotal, refunds: refundsTotal });
  const salesCount = kpis?.salesCount !== undefined ? Number(kpis.salesCount) : sales.length;
  const productsSummary = summarizeProducts(sales);

  return {
    openingBalance,
    cashSales,
    cardSales,
    expensesTotal,
    refundsTotal,
    netSales,
    expectedCash,
    salesCount,
    avgTicket: salesCount > 0 ? netSales / salesCount : 0,
    productsSummary,
    totalPieces: productsSummary.reduce((sum, p) => sum + p.quantity, 0),
  };
}
