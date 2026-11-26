import JsBarcode from 'jsbarcode';
import { describe, expect, it } from 'vitest';
import { decodeLuminance } from './zxing-decoder';

/** Dibuja un CODE128 (las mismas barras que imprime la etiqueta) como un fotograma gris con zona de silencio. */
function frameOf(code: string, narrow: number, noise = false): { luminance: Uint8ClampedArray; width: number; height: number } {
  const target: { encodings?: Array<{ data: string }> } = {};
  JsBarcode(target, code, { format: 'CODE128' });
  const modules = (target.encodings ?? []).map((encoding) => encoding.data).join('');
  const quiet = 12 * narrow;
  const width = modules.length * narrow + quiet * 2;
  const height = 80;
  const luminance = new Uint8ClampedArray(width * height).fill(255);
  for (let y = 10; y < height - 10; y++) {
    for (let m = 0; m < modules.length; m++) {
      if (modules[m] !== '1') continue;
      for (let x = 0; x < narrow; x++) luminance[y * width + quiet + m * narrow + x] = noise ? 40 : 0;
    }
  }
  return { luminance, width, height };
}

describe('lectura de códigos de barras con la cámara', () => {
  it.each([1, 2, 3, 4])('lee el SKU de una etiqueta con barras de %i punto(s)', (narrow) => {
    const { luminance, width, height } = frameOf('PLY-M-NEGRO', narrow);
    expect(decodeLuminance(luminance, width, height)).toBe('PLY-M-NEGRO');
  });

  it('lee un código numérico y uno con minúsculas', () => {
    const numeric = frameOf('7501055300000', 2);
    expect(decodeLuminance(numeric.luminance, numeric.width, numeric.height)).toBe('7501055300000');
    const mixed = frameOf('Camisa-01', 2);
    expect(decodeLuminance(mixed.luminance, mixed.width, mixed.height)).toBe('Camisa-01');
  });

  it('tolera tinta gris (cámara con poca luz)', () => {
    const { luminance, width, height } = frameOf('E2E-LUZ-1', 2, true);
    expect(decodeLuminance(luminance, width, height)).toBe('E2E-LUZ-1');
  });

  it('un fotograma sin código da null, no un error', () => {
    expect(decodeLuminance(new Uint8ClampedArray(200 * 100).fill(255), 200, 100)).toBeNull();
  });
});
