/** Módulos (barras más finas) que ocupa un CODE128 de `length` caracteres: inicio, datos, control y final. Es una cota alta. */
export const code128Modules = (length: number): number => 11 * length + 35;

export interface ModuleChoice {
  /** Ancho en puntos de la barra más fina (entero: una barra a medias sale borrosa o no se lee). */
  narrow: number;
  /** Si ni siquiera con 1 punto cabe en el ancho disponible. */
  fits: boolean;
}

const MAX_NARROW = 4;

/** La barra más ancha que cabe: más ancha = más fácil de leer para el escáner. */
export function pickModuleWidth(valueLength: number, availableDots: number): ModuleChoice {
  const modules = code128Modules(Math.max(1, valueLength));
  const narrow = Math.floor(availableDots / modules);
  if (narrow < 1) return { narrow: 1, fits: false };
  return { narrow: Math.min(narrow, MAX_NARROW), fits: true };
}

/** Qué tan bien se leerá el código: `thin` = barras de 1 punto (al escáner le cuesta); `too-long` = ni así cabe. */
export type BarcodeQuality = 'good' | 'thin' | 'too-long';

export function barcodeQuality(valueLength: number, availableDots: number): BarcodeQuality {
  const { narrow, fits } = pickModuleWidth(valueLength, availableDots);
  if (!fits) return 'too-long';
  return narrow > 1 ? 'good' : 'thin';
}
