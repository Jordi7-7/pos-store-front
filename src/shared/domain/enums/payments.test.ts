import { describe, expect, it } from 'vitest';
import { PaymentMethod, toPaymentMethod } from './payments';

describe('toPaymentMethod', () => {
  it('reconoce los métodos válidos y usa efectivo para cualquier otra cosa', () => {
    expect(toPaymentMethod('TARJETA')).toBe(PaymentMethod.TARJETA);
    expect(toPaymentMethod('EFECTIVO')).toBe(PaymentMethod.EFECTIVO);
    expect(toPaymentMethod(null)).toBe(PaymentMethod.EFECTIVO);
    expect(toPaymentMethod('CHEQUE')).toBe(PaymentMethod.EFECTIVO);
  });
});
