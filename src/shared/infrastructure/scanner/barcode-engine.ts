/** Algo que lee un código de barras de un fotograma de la cámara. */
export interface BarcodeEngine {
  readonly name: 'native' | 'zxing';
  /** El texto del código que se ve ahora en el video, o `null` si no hay ninguno legible. */
  detect(video: HTMLVideoElement): Promise<string | null>;
}

const NATIVE_FORMATS = ['code_128', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_39'];
/** Se baja el fotograma a este ancho antes de leerlo: más rápido y suficiente para un código a unos centímetros. */
const MAX_FRAME_WIDTH = 960;

async function nativeEngine(): Promise<BarcodeEngine | null> {
  const Detector = window.BarcodeDetector;
  if (!Detector) return null;
  try {
    const supported = (await Detector.getSupportedFormats?.()) ?? [];
    const formats = NATIVE_FORMATS.filter((format) => supported.includes(format));
    if (!formats.includes('code_128')) return null; // sin CODE128 no lee nuestras etiquetas: mejor el lector propio
    const detector = new Detector({ formats });
    return { name: 'native', detect: async (video) => (await detector.detect(video))[0]?.rawValue ?? null };
  } catch {
    return null;
  }
}

async function zxingEngine(): Promise<BarcodeEngine> {
  const { decodeLuminance, rgbaToLuminance } = await import('./zxing-decoder');
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  return {
    name: 'zxing',
    detect: async (video) => {
      if (!context || video.videoWidth === 0) return null;
      const scale = Math.min(1, MAX_FRAME_WIDTH / video.videoWidth);
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      return decodeLuminance(rgbaToLuminance(pixels, canvas.width, canvas.height), canvas.width, canvas.height);
    },
  };
}

/** El lector nativo del navegador si lo hay (Chrome en Android, rapidísimo); si no, ZXing (iPhone, iPad, computadora). */
export async function createBarcodeEngine(): Promise<BarcodeEngine> {
  return (await nativeEngine()) ?? zxingEngine();
}
