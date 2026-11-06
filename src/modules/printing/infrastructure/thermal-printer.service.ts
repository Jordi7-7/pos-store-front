import {
  buildSaleReceiptBytes,
  buildClosingReceiptBytes,
  EscPosBuilder,
  type PaperWidth,
} from './escpos-builder';
import type { TicketPrinter } from '../application/ports/ticket-printer';
import type { ClosingTicketData, TicketFormat, TicketSaleData } from '../domain/ticket';

export interface PrinterConfig {
  paperWidth: PaperWidth;
  openDrawer: boolean;
  cutPaper: boolean;
  baudRate: number;
}

const DEFAULT_CONFIG: PrinterConfig = {
  paperWidth: '58mm',
  openDrawer: true,
  cutPaper: true,
  baudRate: 9600,
};

const STORAGE_KEY = 'aura_pos_printer_config';

class ThermalPrinterService implements TicketPrinter {
  private activePort: any = null;

  /** Comprueba si el navegador soporta Web Serial API */
  isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  /** Obtiene la configuración guardada de impresora */
  getConfig(): PrinterConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch {
      // Fallback a configuración por defecto
    }
    return DEFAULT_CONFIG;
  }

  /** Guarda la configuración de la impresora */
  saveConfig(config: Partial<PrinterConfig>): PrinterConfig {
    const current = this.getConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  }

  /** Comprueba si ya existe un puerto USB previamente emparejado */
  async isConfigured(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const ports = await (navigator as any).serial.getPorts();
      return ports && ports.length > 0;
    } catch {
      return false;
    }
  }

  /** Pide al usuario que seleccione su impresora USB en la ventana del navegador */
  async requestPort(): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error('Tu navegador no soporta Web Serial API. Usa Google Chrome o Microsoft Edge.');
    }

    try {
      const port = await (navigator as any).serial.requestPort();
      this.activePort = port;
      return true;
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        // Usuario canceló la selección de dispositivo
        return false;
      }
      throw err;
    }
  }

  /** Obtiene un puerto listo para escribir (abre conexión si no está abierta) */
  private async getOpenPort(): Promise<any> {
    if (!this.isSupported()) {
      throw new Error('Web Serial API no soportada');
    }

    let port = this.activePort;

    if (!port) {
      const ports = await (navigator as any).serial.getPorts();
      if (!ports || ports.length === 0) {
        return null;
      }
      port = ports[0];
      this.activePort = port;
    }

    // Abrir puerto si está cerrado
    if (!port.readable && !port.writable) {
      const config = this.getConfig();
      await port.open({ baudRate: config.baudRate || 9600 });
    }

    return port;
  }

  /** Envía un buffer binario Uint8Array al puerto USB de la impresora */
  async sendRawBytes(bytes: Uint8Array): Promise<void> {
    const port = await this.getOpenPort();
    if (!port) {
      throw new Error('NO_PRINTER_CONFIGURED');
    }

    const writer = port.writable.getWriter();
    try {
      await writer.write(bytes);
    } finally {
      writer.releaseLock();
    }
  }

  /** Imprime un ticket de venta directamente sin ventanas emergentes */
  async printSaleTicket(
    saleData: TicketSaleData,
    extraOptions: { tenantRuc?: string; format: TicketFormat }
  ): Promise<boolean> {
    const config = this.getConfig();
    const bytes = buildSaleReceiptBytes(saleData, {
      paperWidth: config.paperWidth,
      openDrawer: config.openDrawer,
      cutPaper: config.cutPaper,
      tenantRuc: extraOptions.tenantRuc,
      format: extraOptions.format,
    });

    await this.sendRawBytes(bytes);
    return true;
  }

  /** Imprime un ticket de cierre de caja compacto */
  async printClosingTicket(sessionData: ClosingTicketData, format: TicketFormat): Promise<boolean> {
    const config = this.getConfig();
    const bytes = buildClosingReceiptBytes(sessionData, {
      paperWidth: config.paperWidth,
      openDrawer: config.openDrawer,
      cutPaper: config.cutPaper,
      format,
    });

    await this.sendRawBytes(bytes);
    return true;
  }

  /** Imprime un ticket de prueba para validar que la conexión funciona */
  async printTestTicket(): Promise<boolean> {
    const config = this.getConfig();
    const builder = new EscPosBuilder(config.paperWidth);

    if (config.openDrawer) {
      builder.openCashDrawer();
    }

    builder
      .align('center')
      .bold(true)
      .line('================================')
      .line('PRUEBA DE CONEXION POS')
      .line('================================')
      .bold(false)
      .line(`Fecha: ${new Date().toLocaleString()}`)
      .line(`Formato: ${config.paperWidth}`)
      .line(`Baudios: ${config.baudRate}`)
      .line('Cajon: Activado | Corte: Activado')
      .line('')
      .bold(true)
      .line('!IMPRESION DIRECTA EXITOSA!')
      .line('================================');

    if (config.cutPaper) {
      builder.cut();
    }

    await this.sendRawBytes(builder.encode());
    return true;
  }

  /** Desvincula la impresora activa */
  async forgetPrinter(): Promise<void> {
    try {
      if (this.activePort) {
        if (this.activePort.readable || this.activePort.writable) {
          await this.activePort.close();
        }
        if (typeof this.activePort.forget === 'function') {
          await this.activePort.forget();
        }
        this.activePort = null;
      }
    } catch {
      // Ignorar error al cerrar
    }
  }
}

export const thermalPrinterService = new ThermalPrinterService();
