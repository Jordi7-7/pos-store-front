import type { TicketPrinter } from '../application/ports/ticket-printer';
import { thermalPrinterService } from './thermal-printer.service';

/** Raíz de composición del módulo: impresora de tickets en uso (térmica USB). La interfaz depende del puerto. */
export const ticketPrinter: TicketPrinter = thermalPrinterService;
