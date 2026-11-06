import type { LabelItem } from '../../domain/entities/label';
import type { TicketFormat } from '../../domain/entities/ticket';

/** Puerto de salida: imprimir etiquetas de código de barras. La implementación actual es una impresora USB serie. */
export interface LabelPrinter {
  /** ¿Hay una impresora de etiquetas lista para imprimir directamente? */
  isConfigured(): Promise<boolean>;
  /** Imprime la cola con los precios en la moneda e idioma de la tienda. */
  printLabels(items: LabelItem[], storeName: string, format: TicketFormat): Promise<boolean>;
}
