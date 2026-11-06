import type { PaymentMethod } from './enums';

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
