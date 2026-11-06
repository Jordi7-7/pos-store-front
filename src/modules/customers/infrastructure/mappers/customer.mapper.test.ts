import { describe, expect, it } from 'vitest';
import { toCustomerEntity } from './customer.mapper';

describe('mapper de clientes: solo convierte datos', () => {
  it('rellena los vacíos y no añade textos de pantalla', () => {
    const entity = toCustomerEntity({ id: 'c1', identityNumber: '0102030405', name: 'Ana Perez', email: null, phone: '555' });
    expect(entity).toEqual({ id: 'c1', identityNumber: '0102030405', name: 'Ana Perez', email: '', phone: '555', createdAt: undefined, isFinalConsumer: false, hasContactInfo: true });
    expect(Object.keys(entity)).not.toContain('initials');
    expect(Object.keys(entity)).not.toContain('createdAtFormatted');
  });

  it('reconoce al consumidor final por su identificación o por su nombre', () => {
    expect(toCustomerEntity({ id: '1', identityNumber: '9999999999', name: 'X' }).isFinalConsumer).toBe(true);
    expect(toCustomerEntity({ id: '2', identityNumber: '1', name: ' consumidor final ' }).isFinalConsumer).toBe(true);
    expect(toCustomerEntity({ id: '3', identityNumber: '1', name: 'Ana' }).isFinalConsumer).toBe(false);
  });
});
