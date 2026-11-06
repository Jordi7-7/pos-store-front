import type { CashSessionDetails, CashSessionHeader } from '../../domain/session-types';
import type {
  CashSessionDetailsEntity,
  CashSessionHeaderEntity,
  SessionKPIsEntity,
  CashSessionSaleEntity,
  CashSessionExpenseEntity,
  CashSessionRefundEntity,
} from '../../domain/entities/cash-session.entity';

import { CashSessionStatus, CashSessionDifferenceStatus } from '../../domain/enums';
import { SaleStatus } from '@/modules/sales/domain/enums';

/** Por debajo de esta diferencia (en la moneda de la tienda) el cuadre se considera exacto. */
const EXACT_TOLERANCE = 0.05;

export const toCashSessionHeaderEntity = (dto: CashSessionHeader): CashSessionHeaderEntity => {
  const isClosed = dto.status === CashSessionStatus.CLOSED;
  const difference = dto.difference !== null && dto.difference !== undefined ? Number(dto.difference) : null;

  let differenceStatus = CashSessionDifferenceStatus.PENDING;
  if (isClosed) {
    if (difference === null || Math.abs(difference) < EXACT_TOLERANCE) differenceStatus = CashSessionDifferenceStatus.EXACT;
    else differenceStatus = difference > 0 ? CashSessionDifferenceStatus.SURPLUS : CashSessionDifferenceStatus.SHORTAGE;
  }

  return {
    id: dto.id,
    branchId: dto.branchId,
    userId: dto.userId,
    openingBalance: Number(dto.openingBalance || 0),
    closingBalance: dto.closingBalance !== null ? Number(dto.closingBalance) : null,
    expectedBalance: dto.expectedBalance !== null ? Number(dto.expectedBalance) : null,
    difference,
    differenceStatus,
    status: isClosed ? CashSessionStatus.CLOSED : CashSessionStatus.OPEN,
    isClosed,
    openedAt: dto.openedAt,
    closedAt: dto.closedAt,
    openedByName: dto.user?.name || 'No registrado',
    branchName: dto.branch?.name || 'Sucursal General',
    branchAddress: dto.branch?.address || '',
    cashRegisterName: dto.cashRegister?.name || 'Caja Registradora',
    cashRegisterCode: dto.cashRegister?.code ? String(dto.cashRegister.code) : '1',
    totalSales: Number(dto.totalSales || 0),
  };
};

export const toCashSessionHeaderEntities = (
  dtos: CashSessionHeader[]
): CashSessionHeaderEntity[] => (dtos || []).map(toCashSessionHeaderEntity);

export const toCashSessionDetailsEntity = (
  dto: CashSessionDetails
): CashSessionDetailsEntity => {
  const sessionEntity = toCashSessionHeaderEntity(dto.session);

  const kpisEntity: SessionKPIsEntity = {
    grossSales: Number(dto.kpis.grossSales || 0),
    netSales: Number(dto.kpis.netSales || 0),
    cashSales: Number(dto.kpis.cashSales || 0),
    cardSales: Number(dto.kpis.cardSales || 0),
    totalExpenses: Number(dto.kpis.totalExpenses || 0),
    totalRefunds: Number(dto.kpis.totalRefunds || 0),
    salesCount: Number(dto.kpis.salesCount || 0),
    expensesCount: Number(dto.kpis.expensesCount || 0),
    refundsCount: Number(dto.kpis.refundsCount || 0),
  };

  const salesEntities: CashSessionSaleEntity[] = (dto.sales || []).map((sale) => {
    const saleStatus: SaleStatus = Object.values(SaleStatus).includes(sale.status as SaleStatus)
      ? (sale.status as SaleStatus)
      : SaleStatus.COMPLETED;

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
        discountAmount: discount,
        total: lineTotal,
      };
    });

    const totalQty = sale.totalItems || items.reduce((acc, curr) => acc + curr.quantity, 0);

    const payments = (sale.payments || []).map((p, idx) => ({
      id: p.id || `payment-${idx}`,
      paymentMethod: p.paymentMethod,
      amount: Number(p.amount || 0),
    }));

    const subtotal = Number(sale.subtotal || 0);
    const discountAmount = Number(sale.discountAmount || 0);

    return {
      id: sale.id,
      invoiceNumber: sale.invoiceNumber || 'Sin Folio',
      createdAt: sale.createdAt,
      userName: sale.userName || sale.user?.name || 'Cajero',
      customerName: sale.customerName || sale.customer?.name || 'CONSUMIDOR FINAL',
      customerIdentity: sale.customer?.identityNumber || '9999999999',
      totalItems: totalQty,
      status: saleStatus,
      subtotal,
      discountAmount,
      itemsDiscountAmount: Number(sale.itemsDiscountAmount || 0),
      globalDiscountAmount: Number(sale.globalDiscountAmount || 0),
      total: Number(sale.total || 0),
      paymentMethod: sale.payments?.[0]?.paymentMethod || sale.paymentMethod || 'EFECTIVO',
      payments,
      items,
    };
  });

  const expensesEntities: CashSessionExpenseEntity[] = (dto.expenses || []).map((exp) => ({
    id: exp.id,
    description: exp.description || 'Gasto no especificado',
    amount: Number(exp.amount || 0),
    createdAt: exp.createdAt,
    userName: exp.userName || 'Cajero',
    category: exp.category || 'General',
  }));

  const refundsEntities: CashSessionRefundEntity[] = (dto.refunds || []).map((ref) => ({
    id: ref.id,
    reason: ref.reason || 'Sin motivo especificado',
    totalRefunded: Number(ref.totalRefunded || 0),
    createdAt: ref.createdAt,
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
