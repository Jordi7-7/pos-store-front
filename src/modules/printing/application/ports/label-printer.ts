import type { LabelItem } from '../../domain/entities/label';
import type { TicketFormat } from '../../domain/entities/ticket';

/** Seguimiento de un envío largo. */
export interface LabelPrintOptions {
  /** Se llama con las etiquetas ya enviadas a la impresora (no hay forma de saber cuántas salieron). */
  onProgress?: (sent: number, total: number) => void;
  /** Para dejar de enviar. No corta una etiqueta a la mitad: para antes de la siguiente. */
  signal?: AbortSignal;
}

export interface LabelPrintResult {
  sent: number;
  total: number;
  cancelled: boolean;
}

/** Puerto de salida: imprimir etiquetas de código de barras. La implementación actual es una impresora USB serie. */
export interface LabelPrinter {
  /** ¿Hay una impresora de etiquetas lista para imprimir directamente? */
  isConfigured(): Promise<boolean>;
  /** Imprime la cola con los precios en la moneda e idioma de la tienda. */
  printLabels(items: LabelItem[], storeName: string, format: TicketFormat, options?: LabelPrintOptions): Promise<LabelPrintResult>;
}
