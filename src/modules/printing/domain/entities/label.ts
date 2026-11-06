/** Etiquetas de código de barras: lo que se imprime, sin importar el protocolo de la impresora. */

/** Una línea de la cola de impresión de etiquetas. */
export interface LabelItem {
  sku: string;
  name: string;
  price: number;
  quantity: number;
}

export type LabelProtocol = 'TSPL' | 'ZPL';

export interface LabelDimensions {
  widthMm: number;    // Ancho en milímetros (ej: 50)
  heightMm: number;   // Alto en milímetros (ej: 30)
  gapMm: number;      // Separación entre etiquetas (ej: 2)
  dpi?: number;       // Resolución típica: 203 DPI (8 dots/mm)
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
  category: 'Comercio / Ropa' | 'Joyería / Farmacia' | 'Cajas / Almacén' | 'Envíos / Logística';
  description: string;
}

