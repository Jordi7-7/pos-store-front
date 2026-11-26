import type { LabelDpi } from '../entities/label';

/** Un rectángulo en puntos de impresión (x, y desde la esquina superior izquierda). */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LabelSpec {
  widthMm: number;
  heightMm: number;
  dpi: LabelDpi;
}

export interface LabelOptions {
  /** Franja negra con el nombre de la tienda. */
  showStore: boolean;
  /** La etiqueta lleva una línea con la combinación de la variante. */
  hasDetail: boolean;
}

export interface LabelGeometry {
  widthDots: number;
  heightDots: number;
  banner: Box | null;
  barcode: Box;
  code: Box;
  name: Box;
  detail: Box | null;
  price: Box;
}

export const dotsPerMm = (dpi: LabelDpi): number => (dpi === 300 ? 12 : 8);

/** Por debajo de este alto (mm) no cabe la franja de la tienda sin comerse el código de barras. */
const MIN_HEIGHT_FOR_BANNER_MM = 20;

/**
 * Reparte la etiqueta en filas (franja, código de barras, número, nombre, variante, precio) con alturas proporcionales
 * al tamaño real. Es la ÚNICA definición del diseño: la vista previa, la impresión directa y la impresión por el
 * controlador del sistema dibujan estas mismas cajas, así que lo que se ve es lo que sale.
 */
export function layoutLabel(spec: LabelSpec, options: LabelOptions): LabelGeometry {
  const perMm = dotsPerMm(spec.dpi);
  const widthDots = Math.round(spec.widthMm * perMm);
  const heightDots = Math.round(spec.heightMm * perMm);
  const pad = Math.max(4, Math.round(Math.min(widthDots, heightDots) * 0.04));
  const usableW = widthDots - pad * 2;
  const usableH = heightDots - pad * 2;

  const withBanner = options.showStore && spec.heightMm >= MIN_HEIGHT_FOR_BANNER_MM;
  const rows = [
    { key: 'banner', weight: withBanner ? 0.15 : 0 },
    { key: 'barcode', weight: 0.3 },
    { key: 'code', weight: 0.09 },
    { key: 'name', weight: 0.15 },
    { key: 'detail', weight: options.hasDetail ? 0.13 : 0 },
    { key: 'price', weight: 0.2 },
  ] as const;
  const total = rows.reduce((sum, row) => sum + row.weight, 0);

  const boxes = new Map<string, Box>();
  let y = pad;
  for (const row of rows) {
    if (row.weight === 0) continue;
    const h = Math.round((usableH * row.weight) / total);
    boxes.set(row.key, { x: pad, y, w: usableW, h });
    y += h;
  }
  const box = (key: string): Box => boxes.get(key) ?? { x: pad, y: pad, w: usableW, h: 0 };

  return {
    widthDots,
    heightDots,
    banner: boxes.get('banner') ?? null,
    barcode: box('barcode'),
    code: box('code'),
    name: box('name'),
    detail: boxes.get('detail') ?? null,
    price: box('price'),
  };
}
