import { describe, expect, it } from 'vitest';
import { barcodeQuality, code128Modules, pickModuleWidth } from './barcode-fit';

describe('ancho de las barras del código', () => {
  it('un código corto en una etiqueta ancha usa barras gruesas, con tope', () => {
    expect(pickModuleWidth(3, 380)).toEqual({ narrow: 4, fits: true });
  });

  it('un SKU de 12 caracteres en 50 mm (≈384 puntos) usa barras de 2 puntos', () => {
    expect(pickModuleWidth(12, 384)).toEqual({ narrow: 2, fits: true });
  });

  it('el mismo SKU en una etiqueta de 38 mm (≈288 puntos) baja a barras de 1 punto en vez de salirse', () => {
    expect(pickModuleWidth(12, 288)).toEqual({ narrow: 1, fits: true });
  });

  it('si ni con 1 punto cabe, lo avisa', () => {
    expect(pickModuleWidth(40, 288)).toEqual({ narrow: 1, fits: false });
    expect(code128Modules(40)).toBeGreaterThan(288);
  });
});

describe('calidad de lectura en 50 mm a 203 dpi (353 puntos útiles)', () => {
  it('hasta 12 caracteres se lee bien, más largo queda fino y muy largo no cabe', () => {
    expect(barcodeQuality(12, 353)).toBe('good');
    expect(barcodeQuality(13, 353)).toBe('thin');
    expect(barcodeQuality(29, 353)).toBe('too-long');
  });
});
