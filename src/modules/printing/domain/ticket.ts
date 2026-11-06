import type { PaymentMethod } from '@/shared/domain/payments';

/** Datos de un ticket de venta: lo que se imprime, sin importar cómo se dibuje. */
export interface TicketSaleItem {
  variantId?: string;
  variantSku?: string;
  productName: string;
  combinationText?: string;
  quantity: number;
  price: number;
  discountAmount?: number;
}

export interface TicketSaleData {
  invoiceNumber: string;
  createdAt: string;
  branchName: string;
  branchAddress?: string;
  clientName: string;
  clientIdentity?: string;
  items: TicketSaleItem[];
  paymentMethod: PaymentMethod;
  subtotal?: number;
  itemsDiscountAmount?: number;
  globalDiscountAmount?: number;
  discountAmount?: number;
  total: number;
  userName?: string;
}

/** Cómo se escriben los importes en un ticket: moneda e idioma de la tienda (nunca valores fijos). */
export interface TicketFormat {
  currencyCode: string;
  locale: string;
}

/** Datos del corte de caja (Z al cerrar, X en un arqueo parcial): lo que se imprime, sin importar cómo se dibuje. */
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
  cashSales?: number;
  cardSales?: number;
  salesCount?: number;
  totalPieces?: number;
  cashRegisterName?: string;
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
  /** Turno cerrado (corte Z) o abierto (corte X, arqueo parcial). */
  isClosed: boolean;
}
