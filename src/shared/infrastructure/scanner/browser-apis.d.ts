/** Partes de APIs del navegador que TypeScript aún no incluye o que solo existen con prefijo. */

interface DetectedBarcode {
  rawValue: string;
}

interface BarcodeDetector {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}

interface BarcodeDetectorConstructor {
  new (options: { formats: string[] }): BarcodeDetector;
  getSupportedFormats?: () => Promise<string[]>;
}

interface Window {
  /** Lector de códigos de barras del navegador (Chrome en Android). */
  BarcodeDetector?: BarcodeDetectorConstructor;
  /** `AudioContext` de Safari antiguo. */
  webkitAudioContext?: typeof AudioContext;
}
