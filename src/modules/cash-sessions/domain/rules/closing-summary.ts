import { expectedCashBalance } from './cash-closing';
import type { CashSessionDetailsEntity } from '../entities/cash-session.entity';

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

/** Productos vendidos en el turno, agrupados por SKU, con lo realmente cobrado por cada uno. */
export function summarizeProducts(sales: CashSessionDetailsEntity['sales']): ProductSummaryItem[] {
  const bySku = new Map<string, ProductSummaryItem>();
  for (const sale of sales) {
    for (const item of sale.items) {
      const sku = item.sku || 'N/A';
      const attributes = item.attributeValues.join(' · ');
      const entry = bySku.get(sku) ?? { sku, name: attributes ? `${item.productName} (${attributes})` : item.productName, quantity: 0, total: 0 };
      entry.quantity += item.quantity;
      entry.total += item.total;
      bySku.set(sku, entry);
    }
  }
  return [...bySku.values()];
}

/**
 * Cifras del cierre a partir del resumen del servidor (la fuente de verdad: coincide con el corte Z).
 * El efectivo esperado de un turno aún abierto se calcula con la regla del arqueo.
 */
export function buildClosingSummary(details: CashSessionDetailsEntity | null, fallbackOpeningBalance = 0): ClosingSummary {
  const sales = details?.sales ?? [];
  const kpis = details?.kpis;
  const session = details?.session;

  const openingBalance = session?.openingBalance ?? fallbackOpeningBalance;
  const cashSales = kpis?.cashSales ?? 0;
  const cardSales = kpis?.cardSales ?? 0;
  const expensesTotal = kpis?.totalExpenses ?? 0;
  const refundsTotal = kpis?.totalRefunds ?? 0;
  const netSales = kpis?.netSales ?? 0;
  const salesCount = kpis?.salesCount ?? sales.length;
  const productsSummary = summarizeProducts(sales);

  return {
    openingBalance,
    cashSales,
    cardSales,
    expensesTotal,
    refundsTotal,
    netSales,
    expectedCash: session?.expectedBalance ?? expectedCashBalance({ openingBalance, cashSales, expenses: expensesTotal, refunds: refundsTotal }),
    salesCount,
    avgTicket: salesCount > 0 ? netSales / salesCount : 0,
    productsSummary,
    totalPieces: productsSummary.reduce((sum, p) => sum + p.quantity, 0),
  };
}
