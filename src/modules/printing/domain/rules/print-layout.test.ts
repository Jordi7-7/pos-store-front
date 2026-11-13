import { describe, expect, it } from 'vitest';
import {
  defaultColumns,
  isWideLayout,
  marginToDots,
  resolveColumns,
  resolvePrintLayout,
} from './print-layout';

describe('print-layout', () => {
  it('sin columnas configuradas usa el estándar del papel (se conserva lo que ya imprimían)', () => {
    expect(defaultColumns('58mm')).toBe(32);
    expect(defaultColumns('80mm')).toBe(48);
    expect(resolveColumns('80mm')).toBe(48);
  });

  it('respeta las columnas configuradas y corrige valores absurdos', () => {
    expect(resolveColumns('80mm', 42)).toBe(42);
    expect(resolveColumns('80mm', 5)).toBe(24);
    expect(resolveColumns('80mm', 500)).toBe(64);
    expect(resolveColumns('58mm', Number.NaN)).toBe(32);
    expect(resolveColumns('58mm', 41.6)).toBe(42);
  });

  it('valida margen y avance con sus límites', () => {
    expect(resolvePrintLayout({ paperWidth: '80mm' })).toEqual({
      paperWidth: '80mm',
      columns: 48,
      leftMarginMm: 0,
      feedLines: 3,
    });
    const layout = resolvePrintLayout({ paperWidth: '58mm', leftMarginMm: -4, feedLines: 99 });
    expect(layout.leftMarginMm).toBe(0);
    expect(layout.feedLines).toBe(10);
  });

  it('convierte el margen a puntos de 203 dpi', () => {
    expect(marginToDots(0)).toBe(0);
    expect(marginToDots(5)).toBe(40);
  });

  it('42 columnas o más es un ticket ancho', () => {
    expect(isWideLayout(41)).toBe(false);
    expect(isWideLayout(42)).toBe(true);
  });
});
