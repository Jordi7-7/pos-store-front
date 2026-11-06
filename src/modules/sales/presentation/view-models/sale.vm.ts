import type { Formatters } from '@/shared/presentation/formatters';
import { PaymentMethod, SaleStatus } from '../../domain/enums';
import type {
  SaleDetailEntity,
  SaleDetailItemEntity,
  SalePaymentEntity,
  SaleRefundEntity,
  SaleRefundItemEntity,
  SaleSummaryEntity,
} from '../../domain/entities/sale.entity';
import type { TicketSaleData } from '../../domain/ticket';

/**
 * View-models de venta: la entidad más los textos listos para mostrar con la moneda, el idioma y
 * la zona horaria de la tienda. Son funciones puras.
 */

export type SaleSummaryVM = SaleSummaryEntity & { dateFormatted: string; totalFormatted: string; discountAmountFormatted: string };

export type SaleDetailItemVM = SaleDetailItemEntity & { priceFormatted: string; lineTotalFormatted: string };
export type SalePaymentVM = SalePaymentEntity & { amountFormatted: string };
export type SaleRefundItemVM = SaleRefundItemEntity & { priceRefundedFormatted: string };
export type SaleRefundVM = Omit<SaleRefundEntity, 'items'> & { items: SaleRefundItemVM[]; dateFormatted: string; totalRefundedFormatted: string };
export type SaleDetailVM = Omit<SaleDetailEntity, 'items' | 'payments' | 'refunds'> & {
  items: SaleDetailItemVM[];
  payments: SalePaymentVM[];
  refunds: SaleRefundVM[];
  dateFormatted: string;
  totalFormatted: string;
  subtotalFormatted: string;
  discountAmountFormatted: string;
};

export const toSaleSummaryVM = (sale: SaleSummaryEntity, fmt: Formatters): SaleSummaryVM => ({
  ...sale,
  dateFormatted: fmt.dateTime(sale.createdAt),
  totalFormatted: fmt.money(sale.total),
  discountAmountFormatted: fmt.money(sale.discountAmount),
});

export const toSaleDetailVM = (sale: SaleDetailEntity, fmt: Formatters): SaleDetailVM => ({
  ...sale,
  items: sale.items.map((item) => ({ ...item, priceFormatted: fmt.money(item.price), lineTotalFormatted: fmt.money(item.lineTotal) })),
  payments: sale.payments.map((payment) => ({ ...payment, amountFormatted: fmt.money(payment.amount) })),
  refunds: sale.refunds.map((refund) => ({
    ...refund,
    items: refund.items.map((item) => ({ ...item, priceRefundedFormatted: fmt.money(item.priceRefunded) })),
    dateFormatted: fmt.dateTime(refund.createdAt),
    totalRefundedFormatted: fmt.money(refund.totalRefunded),
  })),
  dateFormatted: fmt.dateTime(sale.createdAt),
  totalFormatted: fmt.money(sale.total),
  subtotalFormatted: fmt.money(sale.subtotal),
  discountAmountFormatted: fmt.money(sale.discountAmount),
});

/** Etiqueta y estilo del estado de una venta. */
export const SALE_STATUS_BADGE: Record<SaleStatus, { label: string; className: string }> = {
  [SaleStatus.COMPLETED]: { label: 'Completada', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  [SaleStatus.PARTIALLY_REFUNDED]: { label: 'Parcialmente devuelta', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  [SaleStatus.REFUNDED]: { label: 'Devuelta', className: 'bg-rose-100 text-rose-800 border-rose-200' },
  [SaleStatus.CANCELLED]: { label: 'Cancelada', className: 'bg-zinc-100 text-zinc-800 border-zinc-200' },
};

/** Datos del ticket de una venta (la fecha ya en el formato de la tienda). */
export const toTicketSaleData = (sale: SaleDetailEntity, fmt: Formatters): TicketSaleData => ({
  invoiceNumber: sale.invoiceNumber,
  createdAt: fmt.dateTime(sale.createdAt),
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
});
