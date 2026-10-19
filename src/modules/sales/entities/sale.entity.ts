import { SaleStatus } from '../enums';

export interface SaleSummaryEntity {
  id: string;
  invoiceNumber: string;
  createdAt: Date;
  dateFormatted: string;
  total: number;
  totalFormatted: string;
  discountAmount: number;
  discountAmountFormatted: string;
  status: SaleStatus;
  customerName: string;
  branchName: string;
}

export interface SaleDetailItemEntity {
  saleItemId: string;
  variantId: string;
  productName: string;
  sku: string;
  attributes: string;
  quantity: number;
  refundedQty: number;
  refundableQty: number;
  price: number;
  priceFormatted: string;
  cost: number;
  discountAmount: number;
  lineTotal: number;
  lineTotalFormatted: string;
}

export interface SalePaymentEntity {
  id?: string;
  paymentMethod: string;
  amount: number;
  amountFormatted: string;
}

export interface SaleRefundItemEntity {
  id: string;
  variantId: string;
  sku: string;
  productName: string;
  quantity: number;
  priceRefunded: number;
  priceRefundedFormatted: string;
}

export interface SaleRefundEntity {
  id: string;
  createdAt: Date;
  dateFormatted: string;
  reason: string;
  totalRefunded: number;
  totalRefundedFormatted: string;
  items: SaleRefundItemEntity[];
}

export interface SaleDetailEntity {
  id: string;
  invoiceNumber: string;
  createdAt: Date;
  dateFormatted: string;
  total: number;
  totalFormatted: string;
  subtotal: number;
  subtotalFormatted: string;
  discountAmount: number;
  discountAmountFormatted: string;
  itemsDiscountAmount?: number;
  globalDiscountAmount?: number;
  status: SaleStatus;
  branchName: string;
  branchAddress?: string;
  customerName: string;
  userName: string;
  items: SaleDetailItemEntity[];
  payments: SalePaymentEntity[];
  refunds: SaleRefundEntity[];
  totalPieces: number;
}
