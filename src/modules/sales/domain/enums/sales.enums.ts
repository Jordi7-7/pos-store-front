export { PaymentMethod, SaleStatus } from '@/shared/domain/payments';

/** Cómo se calcula un descuento: porcentaje sobre el precio, o precio final fijado (monto). */
export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  AMOUNT = 'AMOUNT',
}
