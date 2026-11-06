import { describe, expect, it } from 'vitest';
import { ticketMoney } from './ticket-money';

describe('importes en tickets', () => {
  it('usa la moneda y el idioma de la tienda', () => {
    expect(ticketMoney({ currencyCode: 'MXN', locale: 'es-MX' })(1234.5)).toBe('$1,234.50');
    expect(ticketMoney({ currencyCode: 'USD', locale: 'es-EC' })(1234.5)).toMatch(/^(US)?\$\s?1\.234,50$/);
  });

  it('no deja espacios duros (la impresora no los entiende)', () => {
    const text = ticketMoney({ currencyCode: 'COP', locale: 'es-CO' })(1234.5);
    expect(text).not.toMatch(/[  ]/);
  });

  it('si el símbolo no se puede imprimir (€), usa el código de la moneda', () => {
    const text = ticketMoney({ currencyCode: 'EUR', locale: 'es-ES' })(1234.5);
    expect(text).toMatch(/^EUR /);
    expect(text).toMatch(/1\.?234,50/);
    expect(text).not.toContain('€');
  });

  it('un valor ausente o no numérico se imprime como cero, nunca NaN', () => {
    const money = ticketMoney({ currencyCode: 'MXN', locale: 'es-MX' });
    expect(money(null)).toBe('$0.00');
    expect(money(Number.NaN)).toBe('$0.00');
  });
});
