import type { MonoBitmap } from '../../domain/rules/label-bitmap';

export interface RollSize {
  widthMm: number;
  heightMm: number;
  gapMm: number;
}

/** Cómo imprime la impresora; `null` o ausente = lo que tenga guardado. */
export interface PrintTuning {
  /** Velocidad en pulgadas por segundo (la unidad de TSPL). */
  speed?: number | null;
  /** Intensidad del calor, de 0 a 15. */
  density?: number | null;
}

const ascii = (text: string): Uint8Array => new TextEncoder().encode(text);

const join = (...parts: Uint8Array[]): Uint8Array => {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
};

const tsplHeader = (roll: RollSize & PrintTuning): string => {
  const speed = roll.speed ? `SPEED ${roll.speed}\r\n` : '';
  const density = roll.density != null ? `DENSITY ${roll.density}\r\n` : '';
  return `SIZE ${roll.widthMm} mm,${roll.heightMm} mm\r\nGAP ${roll.gapMm} mm,0 mm\r\n${speed}${density}DIRECTION 1\r\nREFERENCE 0,0\r\n`;
};

/**
 * TSPL (TSC, Xprinter, Gprinter, HPRT, Munbyn…): la etiqueta viaja como imagen con BITMAP, así que sale igual que la vista
 * previa. En TSPL un bit en 1 es punto SIN imprimir, al revés que en el mapa de bits de la app: se invierte aquí.
 */
export function tsplImageJob(bitmap: MonoBitmap, roll: RollSize & PrintTuning, copies: number): Uint8Array {
  const inverted = bitmap.bytes.map((byte) => ~byte & 0xff);
  return join(ascii(`${tsplHeader(roll)}CLS\r\nBITMAP 0,0,${bitmap.widthBytes},${bitmap.height},0,`), inverted, ascii(`\r\nPRINT 1,${Math.max(1, Math.floor(copies))}\r\n`));
}

/** ZPL (Zebra): la imagen va como ^GFA en hexadecimal, donde 1 es punto negro. */
export function zplImageJob(bitmap: MonoBitmap, widthDots: number, heightDots: number, copies: number): Uint8Array {
  const total = bitmap.bytes.length;
  const hex = Array.from(bitmap.bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
  return ascii(`^XA\r\n^PW${widthDots}\r\n^LL${heightDots}\r\n^LH0,0\r\n^FO0,0^GFA,${total},${total},${bitmap.widthBytes},${hex}^FS\r\n^PQ${Math.max(1, Math.floor(copies))}\r\n^XZ\r\n`);
}

/**
 * Pide a la impresora que mida el rollo y se ajuste; avanza unas etiquetas. Se mandan las dos órdenes de TSPL para esto
 * (GAPDETECT mide la separación, AUTODETECT mide también el largo): según el modelo, una u otra es la que entiende.
 */
export const tsplCalibrate = (roll: RollSize): Uint8Array => ascii(`SIZE ${roll.widthMm} mm,${roll.heightMm} mm\r\nGAPDETECT\r\nAUTODETECT\r\n`);

export const zplCalibrate = (): Uint8Array => ascii('~JC\r\n');
