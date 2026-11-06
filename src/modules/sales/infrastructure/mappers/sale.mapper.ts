import type { PaginatedSaleSummaryDTO, SaleDetailDTO, SaleDetailItemDTO } from '../dtos/sales.dto';
import type { SaleSummaryEntity, SaleDetailEntity, SaleDetailItemEntity } from '../../domain/entities/sale.entity';
import { SaleStatus, PaymentMethod } from '../../domain/enums';
import type { TicketSaleData } from '../../domain/ticket';
import { getTenantLocale, getTenantTimezone } from '@/modules/auth/hooks/useSession';
import { formatMoney } from '@/modules/auth/hooks/useSession';

export const formatSaleDateTime = (dateVal?: string | Date | null): string => {
  if (!dateVal) return '-';
  const tz = getTenantTimezone();
  const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (!isNaN(d.getTime())) {
    try {
      return d.toLocaleString(getTenantLocale(), {
        timeZone: tz,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return d.toLocaleString();
    }
  }
  return String(dateVal);
};

export const toSaleSummaryEntity = (dto: PaginatedSaleSummaryDTO): SaleSummaryEntity => {
  const total = Number(dto.total || 0);
  const discountAmount = Number(dto.discountAmount || 0);
  const dateObj = new Date(dto.createdAt);
  const dateFormatted = formatSaleDateTime(dto.createdAt);

  const status = Object.values(SaleStatus).includes(dto.status as SaleStatus)
    ? (dto.status as SaleStatus)
    : SaleStatus.COMPLETED;

  return {
    id: dto.id,
    invoiceNumber: dto.invoiceNumber || 'S/N',
    createdAt: dateObj,
    dateFormatted,
    total,
    totalFormatted: formatMoney(total),
    discountAmount,
    discountAmountFormatted: formatMoney(discountAmount),
    status,
    customerName: dto.customer?.name?.trim() || 'Consumidor Final',
    branchName: dto.branch?.name || 'Sucursal Principal',
  };
};

export const toSaleSummaryEntities = (dtos: PaginatedSaleSummaryDTO[]): SaleSummaryEntity[] =>
  dtos.map(toSaleSummaryEntity);

export const toSaleDetailItemEntity = (dto: SaleDetailItemDTO): SaleDetailItemEntity => {
  const price = Number(dto.price || 0);
  const lineTotal = Number(dto.lineTotal || 0);

  return {
    saleItemId: dto.saleItemId,
    variantId: dto.variantId,
    productName: dto.productName || 'Producto',
    sku: dto.sku || '',
    attributes: dto.attributes || '',
    quantity: Number(dto.quantity || 0),
    refundedQty: Number(dto.refundedQty || 0),
    refundableQty: Number(dto.refundableQty || 0),
    price,
    priceFormatted: formatMoney(price),
    cost: Number(dto.cost || 0),
    discountAmount: Number(dto.discountAmount || 0),
    lineTotal,
    lineTotalFormatted: formatMoney(lineTotal),
  };
};

export const toSaleDetailEntity = (dto: SaleDetailDTO): SaleDetailEntity => {
  const total = Number(dto.total || 0);
  const subtotal = Number(dto.subtotal || 0);
  const discountAmount = Number(dto.discountAmount || 0);
  const dateObj = new Date(dto.createdAt);
  const dateFormatted = formatSaleDateTime(dto.createdAt);

  const items = (dto.items || []).map(toSaleDetailItemEntity);
  const totalPieces = items.reduce((acc, it) => acc + it.quantity, 0);

  const payments = (dto.payments || []).map((p) => {
    const amount = Number(p.amount || 0);
    return {
      id: p.id,
      paymentMethod: p.paymentMethod,
      amount,
      amountFormatted: formatMoney(amount),
    };
  });

  const refunds = (dto.refunds || []).map((r) => {
    const rDateObj = new Date(r.createdAt);
    const rTotal = Number(r.totalRefunded || 0);
    return {
      id: r.id,
      createdAt: rDateObj,
      dateFormatted: formatSaleDateTime(r.createdAt),
      reason: r.reason || 'Sin motivo',
      totalRefunded: rTotal,
      totalRefundedFormatted: formatMoney(rTotal),
      items: (r.items || []).map((ri) => {
        const pRef = Number(ri.priceRefunded || 0);
        return {
          id: ri.id,
          variantId: ri.variantId,
          sku: ri.sku || '',
          productName: ri.productName || 'Producto',
          quantity: Number(ri.quantity || 0),
          priceRefunded: pRef,
          priceRefundedFormatted: formatMoney(pRef),
        };
      }),
    };
  });

  return {
    id: dto.id,
    invoiceNumber: dto.invoiceNumber || 'S/N',
    createdAt: dateObj,
    dateFormatted,
    total,
    totalFormatted: formatMoney(total),
    subtotal,
    subtotalFormatted: formatMoney(subtotal),
    discountAmount,
    discountAmountFormatted: formatMoney(discountAmount),
    itemsDiscountAmount: dto.itemsDiscountAmount !== undefined ? Number(dto.itemsDiscountAmount) : undefined,
    globalDiscountAmount: dto.globalDiscountAmount !== undefined ? Number(dto.globalDiscountAmount) : undefined,
    status: Object.values(SaleStatus).includes(dto.status as SaleStatus)
      ? (dto.status as SaleStatus)
      : SaleStatus.COMPLETED,
    branchName: dto.branch?.name || 'Sucursal Principal',
    branchAddress: dto.branch?.address || '',
    customerName: dto.customer?.name?.trim() || 'Consumidor Final',
    userName: dto.user?.name || 'Cajero',
    items,
    payments,
    refunds,
    totalPieces,
  };
};

export const toTicketSaleData = (sale: SaleDetailEntity): TicketSaleData => {
  return {
    invoiceNumber: sale.invoiceNumber,
    createdAt: sale.dateFormatted || formatSaleDateTime(sale.createdAt),
    branchName: sale.branchName || 'Sucursal Principal',
    branchAddress: sale.branchAddress || '',
    clientName: sale.customerName,
    clientIdentity: sale.customerIdentity || '9999999999',
    items: sale.items.map((item) => ({
      variantId: item.variantId,
      variantSku: item.sku || '',
      productName: item.productName,
      combinationText: item.attributes || 'Estándar',
      quantity: item.quantity,
      price: item.price,
      discountAmount: item.discountAmount,
    })),
    paymentMethod: sale.payments?.[0]?.paymentMethod || PaymentMethod.EFECTIVO,
    subtotal: sale.subtotal,
    itemsDiscountAmount: sale.itemsDiscountAmount,
    globalDiscountAmount: sale.globalDiscountAmount,
    discountAmount: sale.discountAmount,
    total: sale.total,
    userName: sale.userName,
  };
};
