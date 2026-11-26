import { describe, expect, it } from 'vitest';
import { labelPriceText } from './label-price';

const mxn = { currencyCode: 'MXN', locale: 'es-MX' };
const eur = { currencyCode: 'EUR', locale: 'es-ES' };

describe('precio en la etiqueta: moneda e idioma de la tienda', () => {
  it('lleva la moneda de la tienda y no un "$" fijo', () => {
    expect(labelPriceText(1234.5, mxn)).toBe('PRECIO $1,234.50');
    expect(labelPriceText(10, mxn)).toBe('PRECIO $10.00');
  });

  it('con una moneda cuyo símbolo no se imprime (€), usa el código y no deja un carácter roto', () => {
    expect(labelPriceText(10, eur)).toContain('EUR');
    expect(labelPriceText(10, eur)).not.toContain('€');
  });
});
