import { describe, expect, it } from 'vitest';
import { getCustomerInitials } from './customer.mapper';

describe('getCustomerInitials', () => {
  it('usa la inicial del nombre y del apellido', () => {
    expect(getCustomerInitials('Ana Perez')).toBe('AP');
    expect(getCustomerInitials('  maria  del carmen ')).toBe('MD');
  });

  it('con una sola palabra usa sus dos primeras letras', () => {
    expect(getCustomerInitials('Carlos')).toBe('CA');
  });

  it('no falla con nombres vacíos o ausentes', () => {
    expect(() => getCustomerInitials('')).not.toThrow();
    expect(() => getCustomerInitials(undefined)).not.toThrow();
  });
});
