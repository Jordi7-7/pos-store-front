/** Etiquetas de código de barras: lo que se imprime, sin importar el protocolo de la impresora. */

/** Una línea de la cola de impresión de etiquetas. */
export interface LabelItem {
  sku: string;
  name: string;
  price: number;
  quantity: number;
  /** Combinación de la variante (`Talla M · Rojo`), para distinguir las etiquetas de un mismo producto. */
  detail?: string;
}

export type LabelProtocol = 'TSPL' | 'ZPL';

/** Resolución del cabezal: 203 dpi (8 puntos por mm, la más común) o 300 dpi (12 puntos por mm). */
export type LabelDpi = 203 | 300;

export interface LabelDimensions {
  widthMm: number;    // Ancho en milímetros (ej: 50)
  heightMm: number;   // Alto en milímetros (ej: 30)
  gapMm: number;      // Separación entre etiquetas (ej: 2)
  dpi?: LabelDpi;     // Resolución típica: 203 DPI (8 dots/mm)
}

export const DEFAULT_LABEL_DIMENSIONS: LabelDimensions = {
  widthMm: 50,
  heightMm: 30,
  gapMm: 2,
  dpi: 203,
};

export interface LabelPreset {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  gapMm: number;
  category: string;
  description: string;
}

