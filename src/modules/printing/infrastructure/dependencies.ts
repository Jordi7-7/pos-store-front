import type { LabelPrinter } from '../application/ports/label-printer';
import type { TicketPrinter } from '../application/ports/ticket-printer';
import { labelPrinterService } from './printers/label-printer.service';
import { thermalPrinterService } from './printers/thermal-printer.service';

/** Raíz de composición del módulo: impresora de tickets en uso (térmica USB). La interfaz depende del puerto. */
export const ticketPrinter: TicketPrinter = thermalPrinterService;

/** Impresora de etiquetas en uso (USB serie). */
export const labelPrinter: LabelPrinter = labelPrinterService;
