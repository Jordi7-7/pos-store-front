import { describe, expect, it } from 'vitest';
import type { Box } from './label-layout';
import { layoutBarcodeOnly, layoutLabel } from './label-layout';
import { LABEL_PRESETS } from './label-presets';

const rectangles = (spec: { widthMm: number; heightMm: number }, options: { showStore: boolean; hasDetail: boolean }, dpi: 203 | 300 = 203): { widthDots: number; heightDots: number; boxes: Box[] } => {
  const geometry = layoutLabel({ ...spec, dpi }, options);
  const boxes = [geometry.banner, geometry.barcode, geometry.code, geometry.name, geometry.detail, geometry.price].filter((box): box is Box => box !== null);
  return { widthDots: geometry.widthDots, heightDots: geometry.heightDots, boxes };
};

describe('diseño de la etiqueta', () => {
  const sizes = [...LABEL_PRESETS.map((p) => ({ widthMm: p.widthMm, heightMm: p.heightMm })), ...LABEL_PRESETS.map((p) => ({ widthMm: p.heightMm, heightMm: p.widthMm }))];

  it.each(sizes)('en una etiqueta de $widthMm × $heightMm mm todo cabe dentro y nada se encima', (spec) => {
    for (const dpi of [203, 300] as const) {
      for (const options of [{ showStore: true, hasDetail: true }, { showStore: false, hasDetail: false }]) {
        const { widthDots, heightDots, boxes } = rectangles(spec, options, dpi);
        for (const box of boxes) {
          expect(box.x).toBeGreaterThanOrEqual(0);
          expect(box.y).toBeGreaterThanOrEqual(0);
          expect(box.x + box.w).toBeLessThanOrEqual(widthDots);
          expect(box.y + box.h).toBeLessThanOrEqual(heightDots);
          expect(box.h).toBeGreaterThan(0);
        }
        for (let i = 1; i < boxes.length; i++) {
          const previous = boxes[i - 1];
          const current = boxes[i];
          expect((previous?.y ?? 0) + (previous?.h ?? 0)).toBeLessThanOrEqual(current?.y ?? 0);
        }
      }
    }
  });

  it('50 × 25 mm a 203 dpi son 400 × 200 puntos; a 300 dpi, 600 × 300', () => {
    expect(layoutLabel({ widthMm: 50, heightMm: 25, dpi: 203 }, { showStore: true, hasDetail: false })).toMatchObject({ widthDots: 400, heightDots: 200 });
    expect(layoutLabel({ widthMm: 50, heightMm: 25, dpi: 300 }, { showStore: true, hasDetail: false })).toMatchObject({ widthDots: 600, heightDots: 300 });
  });

  it('la franja de la tienda solo sale si se pide y si la etiqueta es lo bastante alta', () => {
    expect(layoutLabel({ widthMm: 50, heightMm: 25, dpi: 203 }, { showStore: false, hasDetail: false }).banner).toBeNull();
    expect(layoutLabel({ widthMm: 50, heightMm: 25, dpi: 203 }, { showStore: true, hasDetail: false }).banner).not.toBeNull();
    expect(layoutLabel({ widthMm: 40, heightMm: 15, dpi: 203 }, { showStore: true, hasDetail: false }).banner).toBeNull();
  });

  it('la línea de la variante solo existe si la etiqueta la lleva', () => {
    expect(layoutLabel({ widthMm: 50, heightMm: 30, dpi: 203 }, { showStore: true, hasDetail: false }).detail).toBeNull();
    expect(layoutLabel({ widthMm: 50, heightMm: 30, dpi: 203 }, { showStore: true, hasDetail: true }).detail).not.toBeNull();
  });
});

describe('etiqueta de solo código de barras', () => {
  const sizes = LABEL_PRESETS.map((p) => ({ widthMm: p.widthMm, heightMm: p.heightMm }));

  it.each(sizes)('en $widthMm × $heightMm mm los códigos caben, con aire junto al corte', (size) => {
    for (const dpi of [203, 300] as const) {
      for (const codes of [1, 2] as const) {
        const { widthDots, heightDots, slots, cutY } = layoutBarcodeOnly({ ...size, dpi }, codes);
        expect(slots).toHaveLength(codes);
        for (const { barcode, code } of slots) {
          expect(barcode.h).toBeGreaterThan(20);
          expect(barcode.x + barcode.w).toBeLessThanOrEqual(widthDots);
          expect(code.y).toBe(barcode.y + barcode.h);
          expect(code.y + code.h).toBeLessThanOrEqual(heightDots);
          // Al menos 1 mm entre la línea de corte y cualquier cosa impresa
          if (cutY !== null) expect(Math.min(Math.abs(cutY - barcode.y), Math.abs(cutY - (code.y + code.h)))).toBeGreaterThanOrEqual(dpi === 300 ? 12 : 8);
        }
      }
    }
  });

  it('con dos códigos en 50 × 25 mm se corta justo por la mitad; con uno no hay línea de corte', () => {
    expect(layoutBarcodeOnly({ widthMm: 50, heightMm: 25, dpi: 203 }, 2).cutY).toBe(100);
    expect(layoutBarcodeOnly({ widthMm: 50, heightMm: 25, dpi: 203 }, 1).cutY).toBeNull();
  });
});
