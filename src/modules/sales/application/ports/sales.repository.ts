import type { PaymentMethod } from '../../enums';

export interface ProcessSaleItem {
  variantId: string;
  quantity: number;
  price: number;
  discountType?: string;
  discountRate?: number;
  /** Descuento total de la línea (no por unidad). */
  discountAmount?: number;
}

export interface ProcessSalePayment {
  paymentMethod: PaymentMethod;
  amount: number;
  referenceNumber?: string;
}

export interface ProcessSaleInput {
  /** Clave de idempotencia por intento de cobro (8–64 caracteres): un reintento no duplica la venta. */
  clientRequestId?: string;
  branchId: string;
  cashSessionId: string;
  customerId?: string;
  discountType?: string;
  discountRate?: number;
  discountAmount?: number;
  items: ProcessSaleItem[];
  payments: ProcessSalePayment[];
}

/** Lo que el POS necesita de una venta ya registrada. */
export interface SaleReceipt {
  id: string;
  invoiceNumber: string;
  createdAt?: string;
}

/** Puerto de salida: cómo se registra una venta en el servidor (la implementación va en `infrastructure`). */
export interface SalesRepository {
  processSale(input: ProcessSaleInput): Promise<SaleReceipt>;
}
