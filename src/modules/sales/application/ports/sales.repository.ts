import type { PaymentMethod } from '../../domain/enums';
import type { SaleDetailEntity, SaleSummaryEntity } from '../../domain/entities/sale.entity';

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

export interface ProcessRefundInput {
  branchId: string;
  saleId: string;
  cashSessionId: string;
  reason: string;
  items: Array<{ variantId: string; saleItemId?: string; quantity: number }>;
}

export interface SalesQuery {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  branchId?: string;
}

export interface SalesPage {
  items: SaleSummaryEntity[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

/**
 * Puerto de salida: ventas en el servidor. La implementación (`infrastructure`)
 * habla HTTP y devuelve entidades del dominio; los DTO no salen de ahí.
 */
export interface SalesRepository {
  processSale(input: ProcessSaleInput): Promise<SaleReceipt>;
  list(query: SalesQuery): Promise<SalesPage>;
  getByInvoice(invoiceNumber: string): Promise<SaleDetailEntity>;
  processRefund(input: ProcessRefundInput): Promise<void>;
}
