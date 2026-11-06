import { describe, expect, it } from 'vitest';
import { createFormatters } from '@/shared/presentation/formatting/formatters';
import { getCustomerInitials, toCustomerVM } from './customer.vm';

describe('getCustomerInitials', () => {
  it('usa la inicial del nombre y del apellido', () => {
    expect(getCustomerInitials('Ana Perez')).toBe('AP');
    expect(getCustomerInitials('  maria  del carmen ')).toBe('MD');
  });

  it('con una sola palabra usa sus dos primeras letras', () => {
    expect(getCustomerInitials('Carlos')).toBe('CA');
  });

  it('no falla con nombres vacíos o ausentes', () => {
    expect(getCustomerInitials('')).toBe('CL');
    expect(getCustomerInitials(undefined)).toBe('CL');
  });
});

describe('view-model de cliente', () => {
  it('la fecha de alta sale en la zona y el idioma de la tienda', () => {
    const fmt = createFormatters({ currencyCode: 'MXN', locale: 'es-MX', timezone: 'America/Mexico_City' });
    const vm = toCustomerVM({ id: '1', identityNumber: '1', name: 'Ana Perez', email: '', phone: '', createdAt: '2026-11-05T18:30:00Z', isFinalConsumer: false, hasContactInfo: false }, fmt);
    expect(vm.initials).toBe('AP');
    expect(vm.createdAtFormatted).toMatch(/05\/11\/2026/);
  });
});
