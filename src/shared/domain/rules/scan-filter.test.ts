import { describe, expect, it } from 'vitest';
import { acceptScan, normalizeScan } from './scan-filter';

describe('lectura de la cámara', () => {
  it('limpia espacios y caracteres de control', () => {
    expect(normalizeScan('  PLY-M-NEGRO\r\n')).toBe('PLY-M-NEGRO');
    expect(normalizeScan('75010\u001d12')).toBe('7501012');
  });

  it('el mismo código que sigue a la vista no cuenta otra vez; si se apartó el tiempo indicado, sí', () => {
    const last = { code: 'A-1', at: 1000 };
    expect(acceptScan('A-1', last, 1500, 700)).toBe(false);
    expect(acceptScan('A-1', last, 1800, 700)).toBe(true);
  });

  it('un código distinto se acepta al instante, y el primero también', () => {
    expect(acceptScan('B-2', { code: 'A-1', at: 1000 }, 1010, 700)).toBe(true);
    expect(acceptScan('A-1', null, 0, 700)).toBe(true);
  });

  it('un código vacío nunca', () => {
    expect(acceptScan('', null, 0, 700)).toBe(false);
  });
});
