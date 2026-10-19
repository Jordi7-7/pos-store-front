import type { CashSessionDetails } from '../types/cash-sessions.types';
import type {
  CashSessionDetailsEntity,
  CashSessionHeaderEntity,
  SessionKPIsEntity,
  CashSessionSaleEntity,
  CashSessionExpenseEntity,
  CashSessionRefundEntity,
} from '../entities/cash-session.entity';

import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { CashSessionStatus, CashSessionDifferenceStatus } from '../enums';
import { SaleStatus } from '@/modules/sales/enums';

const formatMoney = (value: number | null | undefined): string => {
  return `$${Number(value || 0).toFixed(2)}`;
};

const formatTime = (dateString?: string | null): string => {
  if (!dateString) return '';
  const tz = useAuthStore.getState().timezone || 'America/Guayaquil';
  try {
    return new Date(dateString).toLocaleTimeString('es-EC', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

export const toCashSessionDetailsEntity = (
  dto: CashSessionDetails
): CashSessionDetailsEntity => {
  const isClosed = dto.session.status === CashSessionStatus.CLOSED;
  const diff = dto.session.difference !== null && dto.session.difference !== undefined
    ? Number(dto.session.difference)
    : null;

  let differenceStatus: CashSessionDifferenceStatus = CashSessionDifferenceStatus.PENDING;
  let differenceStatusText = 'En progreso';

  if (isClosed) {
    if (diff !== null) {
      if (Math.abs(diff) < 0.05) {
        differenceStatus = CashSessionDifferenceStatus.EXACT;
        differenceStatusText = 'Exacto (Sin diff)';
      } else if (diff > 0) {
        differenceStatus = CashSessionDifferenceStatus.SURPLUS;
        differenceStatusText = `Sobran +${formatMoney(diff)}`;
      } else {
        differenceStatus = CashSessionDifferenceStatus.SHORTAGE;
        differenceStatusText = `Faltan -${formatMoney(Math.abs(diff))}`;
      }
    } else {
      differenceStatus = CashSessionDifferenceStatus.EXACT;
      differenceStatusText = 'Exacto (Sin diff)';
    }
  }

  const sessionEntity: CashSessionHeaderEntity = {
    id: dto.session.id,
    branchId: dto.session.branchId,
    userId: dto.session.userId,
    openingBalance: Number(dto.session.openingBalance || 0),
    openingBalanceFormatted: formatMoney(dto.session.openingBalance),
    closingBalance: dto.session.closingBalance !== null ? Number(dto.session.closingBalance) : null,
    closingBalanceFormatted: formatMoney(dto.session.closingBalance),
    expectedBalance: dto.session.expectedBalance !== null ? Number(dto.session.expectedBalance) : null,
    expectedBalanceFormatted: formatMoney(dto.session.expectedBalance),
    difference: diff,
    differenceFormatted: diff !== null ? formatMoney(Math.abs(diff)) : '$0.00',
    differenceStatus,
    differenceStatusText,
    status: dto.session.status === CashSessionStatus.CLOSED ? CashSessionStatus.CLOSED : CashSessionStatus.OPEN,
    isClosed,
    openedAt: dto.session.openedAt,
    openedAtFormatted: formatTime(dto.session.openedAt),
    closedAt: dto.session.closedAt,
    closedAtFormatted: dto.session.closedAt ? formatTime(dto.session.closedAt) : 'Sesión activa',
    durationFormatted: dto.session.durationFormatted || '0m',
    openedByName: dto.session.openedBy || dto.session.user?.name || 'No registrado',
    branchName: dto.session.branchName || dto.session.branch?.name || 'Sucursal General',
    branchAddress: dto.session.branchAddress || '',
    cashRegisterName: dto.session.cashRegister?.name || 'Caja Registradora',
    cashRegisterCode: dto.session.cashRegister?.code ? String(dto.session.cashRegister.code) : '1',
  };

  const kpisEntity: SessionKPIsEntity = {
    grossSales: Number(dto.kpis.grossSales || 0),
    grossSalesFormatted: formatMoney(dto.kpis.grossSales),
    netSales: Number(dto.kpis.netSales || 0),
    netSalesFormatted: formatMoney(dto.kpis.netSales),
    cashSales: Number(dto.kpis.cashSales || 0),
    cashSalesFormatted: formatMoney(dto.kpis.cashSales),
    cardSales: Number(dto.kpis.cardSales || 0),
    cardSalesFormatted: formatMoney(dto.kpis.cardSales),
    totalExpenses: Number(dto.kpis.totalExpenses || 0),
    totalExpensesFormatted: `-${formatMoney(dto.kpis.totalExpenses)}`,
    totalRefunds: Number(dto.kpis.totalRefunds || 0),
    totalRefundsFormatted: `-${formatMoney(dto.kpis.totalRefunds)}`,
    salesCount: Number(dto.kpis.salesCount || 0),
    expensesCount: Number(dto.kpis.expensesCount || 0),
    refundsCount: Number(dto.kpis.refundsCount || 0),
    expensesLabel: `${dto.kpis.expensesCount} ${dto.kpis.expensesCount === 1 ? 'salida' : 'salidas'}`,
    refundsLabel: `${dto.kpis.refundsCount} ${dto.kpis.refundsCount === 1 ? 'reembolso' : 'reembolsos'}`,
  };

  const salesEntities: CashSessionSaleEntity[] = (dto.sales || []).map((sale) => {
    const saleStatus: SaleStatus = Object.values(SaleStatus).includes(sale.status as SaleStatus)
      ? (sale.status as SaleStatus)
      : SaleStatus.COMPLETED;

    let statusLabel = 'Completada';
    if (saleStatus === SaleStatus.PARTIALLY_REFUNDED) statusLabel = 'Dev. Parcial';
    else if (saleStatus === SaleStatus.REFUNDED) statusLabel = 'Reembolsada';
    else if (saleStatus === SaleStatus.CANCELLED) statusLabel = 'Cancelada';

    const items = (sale.items || []).map((item) => {
      const combinationText = item.variant?.attributeValues && item.variant.attributeValues.length > 0
        ? item.variant.attributeValues.map((av) => av.value).join(' / ')
        : 'Estándar';

      const unitPrice = Number(item.price || 0);
      const qty = Number(item.quantity || 1);
      const discount = Number(item.discountAmount || 0);
      const lineTotal = Number(item.total ?? (unitPrice * qty - discount));

      return {
        id: item.id,
        variantId: item.variantId,
        sku: item.variant?.sku || '',
        productName: item.variant?.product?.name || 'Producto',
        combinationText,
        quantity: qty,
        price: unitPrice,
        priceFormatted: formatMoney(unitPrice),
        discountAmount: discount,
        total: lineTotal,
        totalFormatted: formatMoney(lineTotal),
      };
    });

    const totalQty = sale.totalItems || items.reduce((acc, curr) => acc + curr.quantity, 0);

    const payments = (sale.payments || []).map((p, idx) => ({
      id: p.id || `payment-${idx}`,
      paymentMethod: p.paymentMethod,
      amount: Number(p.amount || 0),
      amountFormatted: formatMoney(p.amount),
    }));

    const paymentMethodsLabel =
      payments.map((p) => p.paymentMethod).join('/') ||
      sale.paymentMethod ||
      'EFECTIVO';

    const subtotal = Number(sale.subtotal || 0);
    const discountAmount = Number(sale.discountAmount || 0);

    return {
      id: sale.id,
      invoiceNumber: sale.invoiceNumber || 'Sin Folio',
      createdAt: sale.createdAt,
      createdAtFormatted: formatTime(sale.createdAt),
      userName: sale.userName || sale.user?.name || 'Cajero',
      customerName: sale.customerName || sale.customer?.name || 'CONSUMIDOR FINAL',
      customerIdentity: sale.customer?.identityNumber || '9999999999',
      totalItems: totalQty,
      status: saleStatus,
      statusLabel,
      subtotal,
      subtotalFormatted: formatMoney(subtotal),
      discountAmount,
      discountAmountFormatted: formatMoney(discountAmount),
      itemsDiscountAmount: Number(sale.itemsDiscountAmount || 0),
      globalDiscountAmount: Number(sale.globalDiscountAmount || 0),
      total: Number(sale.total || 0),
      totalFormatted: formatMoney(sale.total),
      paymentMethod: sale.payments?.[0]?.paymentMethod || sale.paymentMethod || 'EFECTIVO',
      paymentMethodsLabel,
      payments,
      items,
    };
  });

  const expensesEntities: CashSessionExpenseEntity[] = (dto.expenses || []).map((exp) => ({
    id: exp.id,
    description: exp.description || 'Gasto no especificado',
    amount: Number(exp.amount || 0),
    amountFormatted: `-${formatMoney(exp.amount)}`,
    createdAt: exp.createdAt,
    createdAtFormatted: formatTime(exp.createdAt),
    userName: exp.userName || 'Cajero',
    category: exp.category || 'General',
  }));

  const refundsEntities: CashSessionRefundEntity[] = (dto.refunds || []).map((ref) => ({
    id: ref.id,
    reason: ref.reason || 'Sin motivo especificado',
    totalRefunded: Number(ref.totalRefunded || 0),
    totalRefundedFormatted: `-${formatMoney(ref.totalRefunded)}`,
    createdAt: ref.createdAt,
    createdAtFormatted: formatTime(ref.createdAt),
    userName: ref.userName || ref.user?.name || 'Cajero',
    invoiceNumber: ref.sale?.invoiceNumber || 'Sin Folio',
  }));

  return {
    session: sessionEntity,
    kpis: kpisEntity,
    sales: salesEntities,
    expenses: expensesEntities,
    refunds: refundsEntities,
  };
};
