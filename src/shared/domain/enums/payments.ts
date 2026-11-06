/**
 * Vocabulario común de ventas y pagos. Lo usan varios módulos (ventas, turnos de caja, impresión,
 * reportes), por eso vive en el núcleo compartido y no dentro de uno de ellos.
 */

export enum SaleStatus {
  COMPLETED = 'COMPLETED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  EFECTIVO = 'EFECTIVO',
  TARJETA = 'TARJETA',
}

/** Convierte el valor de un selector (texto o vacío) en un método de pago; lo desconocido cuenta como efectivo. */
export function toPaymentMethod(value: string | null | undefined): PaymentMethod {
  return Object.values(PaymentMethod).find((method) => method === value) ?? PaymentMethod.EFECTIVO;
}
