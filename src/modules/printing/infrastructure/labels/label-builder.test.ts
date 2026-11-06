import { describe, expect, it } from 'vitest';
import type { LabelItem } from '../../domain/entities/label';
import { labelPriceText } from '../../domain/rules/label-price';
import { buildTestLabelCommands, buildTsplLabelCommands, buildZplLabelCommands } from './label-builder';

const text = (bytes: Uint8Array): string => new TextDecoder('latin1').decode(bytes);
const item: LabelItem = { sku: 'CAM-1', name: 'Camisa roja', price: 1234.5, quantity: 2 };
const mxn = { currencyCode: 'MXN', locale: 'es-MX' };
const eur = { currencyCode: 'EUR', locale: 'es-ES' };

describe('precio en la etiqueta: moneda e idioma de la tienda', () => {
  it('texto del precio', () => {
    expect(labelPriceText(1234.5, mxn)).toBe('PRECIO $1,234.50');
    expect(labelPriceText(10, mxn)).toBe('PRECIO $10.00');
  });

  it('TSPL: lleva el precio de la tienda y no un "$" fijo; repite según la cantidad', () => {
    const tspl = text(buildTsplLabelCommands([item], 'MI TIENDA', mxn));
    expect(tspl).toContain('PRECIO $1,234.50');
    expect(tspl).toMatch(/PRINT 1, 2/);
  });

  it('ZPL: igual', () => {
    expect(text(buildZplLabelCommands([item], 'MI TIENDA', mxn))).toContain('PRECIO $1,234.50');
  });

  it('con una moneda cuyo símbolo no se imprime (€), usa el código y no deja un carácter roto', () => {
    const tspl = text(buildTsplLabelCommands([item], 'MI TIENDA', eur));
    expect(tspl).toContain('PRECIO EUR');
    expect(tspl).not.toContain('$');
    expect(tspl).not.toContain('€');
  });

  it('la etiqueta de prueba también usa el formato de la tienda', () => {
    expect(text(buildTestLabelCommands('TSPL', mxn))).toContain('PRECIO $9.99');
    expect(text(buildTestLabelCommands('ZPL', eur))).toContain('PRECIO EUR');
  });
});
