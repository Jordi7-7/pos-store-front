import { SaleStatus, PaymentMethod } from '../enums';

/** Entidades de venta: solo datos del negocio. El formato de pantalla vive en `presentation/view-models`. */

export interface SaleSummaryEntity {
  id: string;
  invoiceNumber: string;
  createdAt: Date;
  total: number;
  discountAmount: number;
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
  cost: number;
  discountAmount: number;
  lineTotal: number;
}

export interface SalePaymentEntity {
  id?: string;
  paymentMethod: PaymentMethod;
  amount: number;
}

export interface SaleRefundItemEntity {
  id: string;
  variantId: string;
  sku: string;
  productName: string;
  quantity: number;
  priceRefunded: number;
}

export interface SaleRefundEntity {
  id: string;
  createdAt: Date;
  reason: string;
  totalRefunded: number;
  items: SaleRefundItemEntity[];
}

export interface SaleDetailEntity {
  id: string;
  invoiceNumber: string;
  createdAt: Date;
  total: number;
  subtotal: number;
  discountAmount: number;
  itemsDiscountAmount?: number;
  globalDiscountAmount?: number;
  status: SaleStatus;
  branchName: string;
  branchAddress?: string;
  customerId?: string;
  customerName: string;
  customerIdentity?: string;
  userName: string;
  items: SaleDetailItemEntity[];
  payments: SalePaymentEntity[];
  refunds: SaleRefundEntity[];
  totalPieces: number;
}
