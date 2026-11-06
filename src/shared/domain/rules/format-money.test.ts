import { describe, expect, it } from 'vitest';
import { formatMoneyAmount, localeForCountry } from './format-money';

// Intl separa símbolo y número con un espacio de no ruptura en algunas monedas: se normaliza.
const plain = (s: string) => s.replace(/ /g, ' ');

describe('formatMoneyAmount', () => {
  it('usa la moneda de la tienda, no una fija', () => {
    expect(plain(formatMoneyAmount(1234.5, 'MXN', 'es-MX'))).toBe('$1,234.50');
    expect(plain(formatMoneyAmount(1234.5, 'USD', 'es-MX'))).toContain('USD');
    expect(plain(formatMoneyAmount(1234.5, 'EUR', 'es-ES'))).toMatch(/1234,50|1\.234,50/);
  });

  it('siempre 2 decimales, como el backend', () => {
    expect(plain(formatMoneyAmount(310, 'MXN', 'es-MX'))).toBe('$310.00');
    expect(plain(formatMoneyAmount(0.1 + 0.2, 'MXN', 'es-MX'))).toBe('$0.30');
  });

  it('un valor ausente o no numérico se muestra como 0, no como NaN', () => {
    expect(plain(formatMoneyAmount(undefined, 'MXN', 'es-MX'))).toBe('$0.00');
    expect(plain(formatMoneyAmount(null, 'MXN', 'es-MX'))).toBe('$0.00');
    expect(plain(formatMoneyAmount(Number.NaN, 'MXN', 'es-MX'))).toBe('$0.00');
  });

  it('el idioma sale del país de la tienda', () => {
    expect(localeForCountry('mx')).toBe('es-MX');
    expect(localeForCountry(' EC ')).toBe('es-EC');
  });
});
