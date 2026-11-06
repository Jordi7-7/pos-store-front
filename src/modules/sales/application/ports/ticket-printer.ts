import type { ClosingTicketData } from '@/modules/cash-sessions/domain/closing-ticket';
import type { TicketFormat, TicketSaleData } from '../../domain/ticket';

/**
 * Puerto de salida: imprimir tickets. La implementación actual es una impresora térmica USB
 * (`infrastructure/printing`); otra (red, navegador, nube) cumpliría el mismo contrato.
 */
export interface TicketPrinter {
  /** ¿Hay una impresora lista para imprimir directamente? Si no, la interfaz muestra una vista previa. */
  isConfigured(): Promise<boolean>;
  printSaleTicket(sale: TicketSaleData, options: { tenantRuc?: string; format: TicketFormat }): Promise<boolean>;
  printClosingTicket(session: ClosingTicketData, format: TicketFormat): Promise<boolean>;
}
