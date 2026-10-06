import type { CashSessionDetails } from '../types/cash-sessions.types';

export interface ClosingTicketData {
  id: string;
  openedAt: string;
  closedAt?: string;
  openingBalance: number;
  closingBalance: number;
  expectedBalance: number;
  salesTotal: number;
  salesSubtotal?: number;
  discountsTotal?: number;
  expensesTotal: number;
  refundsTotal?: number;
  expensesList: { description: string; amount: number; createdAt: string }[];
  productsList: {
    sku: string;
    name: string;
    quantity: number;
    price?: number;
    subtotal?: number;
    discount?: number;
    total: number;
  }[];
  paymentsBreakdown: { [method: string]: number };
  refundsList: { id: string; reason: string; items: { name: string; sku: string; quantity: number }[] }[];
  salesList: { invoiceNumber: string; createdAt: string; total: number; paymentMethods: string[] }[];
  userName?: string;
  branchName?: string;
  branchAddress?: string;
  status?: 'OPEN' | 'CLOSED';
}

export function buildClosingTicketData(
  details: CashSessionDetails,
  fallbackBranch?: { name?: string; address?: string }
): ClosingTicketData {
  // 1. Agrupar productos vendidos
  const productMap = new Map<
    string,
    { sku: string; name: string; quantity: number; subtotal: number; discount: number; total: number }
  >();

  (details.sales || []).forEach((sale: any) => {
    (sale.items || []).forEach((item: any) => {
      const sku = item.variant?.sku || item.sku || 'N/A';
      const name = item.variant?.product?.name || item.productName || 'Producto';
      const qty = Number(item.quantity || 0);
      const lineGross =
        item.subtotal !== undefined && Number(item.subtotal) > 0
          ? Number(item.subtotal)
          : Number(item.price || 0) * qty;

      const totalLineDiscount =
        (item.discountAmount !== undefined && Number(item.discountAmount) > 0
          ? Number(item.discountAmount)
          : 0) +
        (item.globalDiscountAmount !== undefined && Number(item.globalDiscountAmount) > 0
          ? Number(item.globalDiscountAmount)
          : 0);

      const lineNet =
        item.total !== undefined && Number(item.total) > 0
          ? Number(item.total)
          : Math.max(0, lineGross - totalLineDiscount);

      const existing = productMap.get(sku);
      if (existing) {
        existing.quantity += qty;
        existing.subtotal += lineGross;
        existing.discount += totalLineDiscount;
        existing.total += lineNet;
      } else {
        productMap.set(sku, {
          sku,
          name,
          quantity: qty,
          subtotal: lineGross,
          discount: totalLineDiscount,
          total: lineNet,
        });
      }
    });
  });
  const productsList = Array.from(productMap.values());

  // 2. Desglose de pagos
  const paymentsBreakdown: { [method: string]: number } = {
    EFECTIVO: Number(details.kpis?.cashSales || 0),
    TARJETA: Number(details.kpis?.cardSales || 0),
  };

  // 3. Subtotales y Descuentos
  const salesSubtotal = (details.sales || []).reduce((sum: number, s: any) => {
    const itemGross = (s.items || []).reduce(
      (isum: number, it: any) => isum + Number(it.price || 0) * Number(it.quantity || 0),
      0
    );
    return sum + (s.subtotal !== undefined && s.subtotal > 0 ? Number(s.subtotal) : itemGross);
  }, 0);

  const discountsTotal = (details.sales || []).reduce((sum: number, s: any) => {
    return sum + Number(s.discountAmount || 0);
  }, 0);

  const refundsTotal = Number(details.kpis?.totalRefunds || 0);

  const branchName =
    details.session?.branchName ||
    fallbackBranch?.name ||
    'Sucursal General';

  const branchAddress =
    fallbackBranch?.address || '';

  return {
    id: details.session.id,
    openedAt: details.session.openedAt,
    closedAt: details.session.closedAt || undefined,
    openingBalance: Number(details.session.openingBalance || 0),
    closingBalance: Number(details.session.closingBalance ?? details.session.expectedBalance ?? 0),
    expectedBalance: Number(details.session.expectedBalance || 0),
    salesTotal: Number(details.kpis?.netSales ?? details.session.totalSales ?? 0),
    salesSubtotal: salesSubtotal > 0 ? salesSubtotal : undefined,
    discountsTotal: discountsTotal > 0 ? discountsTotal : undefined,
    expensesTotal: Number(details.kpis?.totalExpenses || 0),
    refundsTotal: refundsTotal > 0 ? refundsTotal : undefined,
    expensesList: (details.expenses || []).map((e: any) => ({
      description: e.description,
      amount: Number(e.amount),
      createdAt: e.createdAt,
    })),
    productsList,
    paymentsBreakdown,
    refundsList: (details.refunds || []).map((r: any) => ({
      id: r.id,
      reason: r.reason,
      items: (r.items || []).map((it: any) => ({
        name: it.variant?.product?.name || 'Producto',
        sku: it.variant?.sku || 'N/A',
        quantity: Number(it.quantity || 0),
      })),
    })),
    salesList: (details.sales || []).map((s: any) => ({
      invoiceNumber: s.invoiceNumber,
      createdAt: s.createdAt,
      total: Number(s.total),
      paymentMethods: (s.payments || []).map((p: any) => p.paymentMethod || 'EFECTIVO'),
    })),
    userName: details.session.openedBy || 'Usuario',
    branchName,
    branchAddress,
    status: details.session.status as 'OPEN' | 'CLOSED',
  };
}
