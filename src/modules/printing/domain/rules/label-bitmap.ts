/** Imagen en blanco y negro lista para enviar a la impresora: un bit por punto, 1 = negro, 8 puntos por byte de izquierda a derecha. */
export interface MonoBitmap {
  widthBytes: number;
  height: number;
  /** `widthBytes * height` bytes, fila por fila. Los puntos que sobran a la derecha de cada fila quedan en blanco (0). */
  bytes: Uint8Array;
}

/**
 * Convierte los píxeles RGBA de un canvas en blanco y negro. Un punto es negro si es lo bastante oscuro y no es
 * transparente. El umbral separa el texto suavizado (gris) en tinta o papel.
 */
export function toMonoBitmap(rgba: ArrayLike<number>, width: number, height: number, threshold = 140): MonoBitmap {
  const widthBytes = Math.ceil(width / 8);
  const bytes = new Uint8Array(widthBytes * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const alpha = (rgba[i + 3] ?? 255) / 255;
      // Sobre papel blanco: lo transparente se ve blanco
      const luminance = (0.299 * (rgba[i] ?? 255) + 0.587 * (rgba[i + 1] ?? 255) + 0.114 * (rgba[i + 2] ?? 255)) * alpha + 255 * (1 - alpha);
      if (luminance < threshold) {
        const index = y * widthBytes + (x >> 3);
        bytes[index] = (bytes[index] ?? 0) | (0x80 >> (x & 7));
      }
    }
  }
  return { widthBytes, height, bytes };
}
