/** Lo mínimo de la Web Serial API que usan las impresoras (TypeScript aún no la incluye). */
export interface SerialPortLike {
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  forget?(): Promise<void>;
}

interface SerialLike {
  getPorts(): Promise<SerialPortLike[]>;
  requestPort(): Promise<SerialPortLike>;
}

/** El objeto `navigator.serial`, o `undefined` si el navegador no lo soporta. */
export function getSerial(): SerialLike | undefined {
  return typeof navigator !== 'undefined' && 'serial' in navigator ? (navigator as Navigator & { serial: SerialLike }).serial : undefined;
}
