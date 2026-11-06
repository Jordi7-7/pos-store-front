import type { ProcessSaleInput } from '../../types/sales.types';

/** Lo que el POS necesita de una venta ya registrada. */
export interface SaleReceipt {
  id: string;
  invoiceNumber: string;
  createdAt?: string;
}

/** Puerto de salida: cómo se registra una venta en el servidor (la implementación va en `infrastructure`). */
export interface SalesGateway {
  processSale(input: ProcessSaleInput): Promise<SaleReceipt>;
}
