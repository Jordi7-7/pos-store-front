/**
 * Medidas de impresión del ticket térmico. El papel (58 u 80 mm) no basta para saber cuántos
 * caracteres caben por línea: depende del modelo (dos impresoras de 80 mm pueden dar 42 o 48),
 * por eso las columnas, el margen izquierdo y el avance antes del corte se configuran.
 */

export type PaperWidth = '58mm' | '80mm';

export const MIN_COLUMNS = 24;
export const MAX_COLUMNS = 64;
export const MAX_LEFT_MARGIN_MM = 10;
export const MAX_FEED_LINES = 10;
export const DEFAULT_FEED_LINES = 3;

/** Columnas habituales por ancho de papel (la primera es la de por defecto). */
export const COLUMN_PRESETS: Record<PaperWidth, readonly number[]> = {
  '58mm': [32],
  '80mm': [48, 42],
};

/** Ancho útil del papel en milímetros: se usa para fijar el tamaño de página al imprimir por el navegador. */
export const PAPER_MM: Record<PaperWidth, number> = { '58mm': 58, '80mm': 80 };

export interface PrintLayoutInput {
  paperWidth: PaperWidth;
  columns?: number;
  leftMarginMm?: number;
  feedLines?: number;
}

export interface PrintLayout {
  paperWidth: PaperWidth;
  columns: number;
  leftMarginMm: number;
  feedLines: number;
}

export function defaultColumns(paperWidth: PaperWidth): number {
  return COLUMN_PRESETS[paperWidth][0] ?? 32;
}

function clampInt(value: number | undefined, min: number, max: number, fallback: number): number {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** Columnas válidas: un valor ausente o absurdo vuelve al estándar del papel. */
export function resolveColumns(paperWidth: PaperWidth, columns?: number): number {
  return clampInt(columns, MIN_COLUMNS, MAX_COLUMNS, defaultColumns(paperWidth));
}

export function resolvePrintLayout(input: PrintLayoutInput): PrintLayout {
  return {
    paperWidth: input.paperWidth,
    columns: resolveColumns(input.paperWidth, input.columns),
    leftMarginMm: clampInt(input.leftMarginMm, 0, MAX_LEFT_MARGIN_MM, 0),
    feedLines: clampInt(input.feedLines, 0, MAX_FEED_LINES, DEFAULT_FEED_LINES),
  };
}

/** Con 42 columnas o más hay sitio para los textos largos (firmas, descripciones de gasto). */
export function isWideLayout(columns: number): boolean {
  return columns >= 42;
}

/** Puntos de impresión equivalentes al margen (las térmicas son de 203 dpi, ~8 puntos por mm). */
export function marginToDots(leftMarginMm: number): number {
  return Math.round(leftMarginMm * 8);
}

/** Largos de las líneas de la hoja de calibración: la mayor que no se parta en dos es la capacidad. */
export const CALIBRATION_LENGTHS: readonly number[] = [30, 32, 36, 40, 42, 44, 46, 48, 52, 56, 64];
