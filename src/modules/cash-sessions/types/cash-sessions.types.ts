export interface ProductAttributeValue {
  id?: string;
  value: string;
  attribute?: {
    id?: string;
    name: string;
  };
}

export interface SessionProductVariant {
  id: string;
  sku: string;
  barcode?: string;
  price: number;
  product: {
    id: string;
    name: string;
  };
  attributeValues?: ProductAttributeValue[];
}

export interface SessionSaleItem {
  id: string;
  saleId: string;
  variantId: string;
  quantity: number;
  price: number;
  cost: number;
  discountType: string | null;
  discountRate: number | null;
  discountAmount: number;
  variant: SessionProductVariant;
}

export interface SessionSalePayment {
  id: string;
  saleId: string;
  paymentMethod: 'EFECTIVO' | 'TARJETA';
  amount: number;
  referenceNumber: string | null;
}

export interface SessionSale {
  id: string;
  invoiceNumber: string;
  cashSessionId: string;
  total: number;
  paymentMethod: 'EFECTIVO' | 'TARJETA';
  status: 'COMPLETED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
  } | null;
  user?: {
    id: string;
    name: string;
  };
  items: SessionSaleItem[];
  payments: SessionSalePayment[];
}

export interface SessionExpense {
  id: string;
  tenantId: string;
  branchId: string;
  cashSessionId: string;
  description: string;
  amount: number;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionRefundItem {
  id: string;
  refundId: string;
  variantId: string;
  quantity: number;
  priceRefunded: number;
  variant: {
    id: string;
    sku: string;
    product: {
      id: string;
      name: string;
    };
  };
}

export interface SessionRefund {
  id: string;
  tenantId: string;
  branchId: string;
  saleId: string;
  cashSessionId: string;
  totalRefunded: number;
  reason: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
  };
  sale?: {
    id: string;
    invoiceNumber: string;
  };
  items: SessionRefundItem[];
}

export interface CashSessionHeader {
  id: string;
  branchId: string;
  userId: string;
  openingBalance: number;
  closingBalance: number | null;
  status: 'OPEN' | 'CLOSED';
  openedAt: string;
  closedAt: string | null;
  branch: { name: string };
  user: { name: string };
}

export interface CashSessionDetails {
  session: CashSessionHeader;
  sales: SessionSale[];
  expenses: SessionExpense[];
  refunds: SessionRefund[];
}
