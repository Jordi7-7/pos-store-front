import { PaymentMethod } from '../enums';

export interface SaleItemDTO {
  variantId: string;
  quantity: number;
  price: number;
  discountType?: string;
  discountRate?: number;
  discountAmount?: number;
}

export interface SalePaymentDTO {
  id?: string;
  paymentMethod: PaymentMethod;
  amount: number;
}

export interface PaginatedSaleSummaryDTO {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  total: number;
  discountAmount: number;
  status: string;
  customer?: { id?: string; name?: string } | null;
  branch?: { id?: string; name?: string } | null;
}

export interface PaginatedSalesDTO {
  data: PaginatedSaleSummaryDTO[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface SaleDetailItemDTO {
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

export interface SaleRefundDTO {
  id: string;
  createdAt: string;
  reason: string;
  totalRefunded: number;
  items: Array<{
    id: string;
    variantId: string;
    sku: string;
    productName: string;
    quantity: number;
    priceRefunded: number;
  }>;
}

export interface SaleDetailDTO {
  id: string;
  invoiceNumber: string;
  total: number;
  subtotal: number;
  discountAmount: number;
  itemsDiscountAmount?: number;
  globalDiscountAmount?: number;
  status: string;
  branch?: { id: string; name: string; address?: string } | null;
  customer?: { id: string; name: string } | null;
  user?: { id: string; name: string } | null;
  createdAt: string;
  items: SaleDetailItemDTO[];
  payments: SalePaymentDTO[];
  refunds: SaleRefundDTO[];
}

export interface ProcessSaleInput {
  branchId: string;
  cashSessionId: string;
  customerId?: string;
  discountType?: string;
  discountRate?: number;
  discountAmount?: number;
  items: SaleItemDTO[];
  payments: SalePaymentDTO[];
}

export interface OpenCashSessionInput {
  branchId: string;
  cashRegisterId: string;
  openingBalance: number;
}

export interface RegisterExpenseInput {
  branchId: string;
  cashSessionId?: string;
  description: string;
  amount: number;
  category: string;
}

export interface RefundItemInput {
  variantId: string;
  quantity: number;
}

export interface ProcessRefundInput {
  branchId: string;
  saleId: string;
  cashSessionId: string;
  reason: string;
  items: RefundItemInput[];
}

