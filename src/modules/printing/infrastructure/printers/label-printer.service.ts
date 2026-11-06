import type { LabelPrinter } from '../../application/ports/label-printer';
import { DEFAULT_LABEL_DIMENSIONS, type LabelDimensions, type LabelItem, type LabelProtocol } from '../../domain/entities/label';
import type { TicketFormat } from '../../domain/entities/ticket';
import { buildTsplLabelCommands, buildZplLabelCommands, buildTestLabelCommands } from '../labels/label-builder';

export interface LabelPrinterConfig {
  widthMm: number;
  heightMm: number;
  gapMm: number;
  protocol: LabelProtocol;
  baudRate: number;
}

const DEFAULT_LABEL_CONFIG: LabelPrinterConfig = {
  widthMm: DEFAULT_LABEL_DIMENSIONS.widthMm,
  heightMm: DEFAULT_LABEL_DIMENSIONS.heightMm,
  gapMm: DEFAULT_LABEL_DIMENSIONS.gapMm,
  protocol: 'TSPL',
  baudRate: 9600,
};

const STORAGE_KEY = 'aura_label_printer_config';

class LabelPrinterService implements LabelPrinter {
  private activePort: any = null;

  /** Comprueba si el navegador actual soporta Web Serial API */
  isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  /** Obtiene la configuración de impresora de etiquetas */
  getConfig(): LabelPrinterConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_LABEL_CONFIG, ...JSON.parse(stored) };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_LABEL_CONFIG;
  }

  /** Guarda la configuración de la impresora de etiquetas */
  saveConfig(config: Partial<LabelPrinterConfig>): LabelPrinterConfig {
    const current = this.getConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  }

  /** Comprueba si ya existe un puerto USB emparejado en el navegador */
  async isConfigured(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const ports = await (navigator as any).serial.getPorts();
      return ports && ports.length > 0;
    } catch {
      return false;
    }
  }

  /** Solicita al usuario vincular su impresora de etiquetas USB */
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
        return false;
      }
      throw err;
    }
  }

  /** Obtiene el puerto abierto para comunicación */
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
      // Si hay más de un puerto, toma el último o el disponible
      port = ports[ports.length - 1];
      this.activePort = port;
    }

    if (!port.readable && !port.writable) {
      const config = this.getConfig();
      await port.open({ baudRate: config.baudRate || 9600 });
    }

    return port;
  }

  /** Envía los bytes crudos a la impresora de etiquetas */
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

  /** Imprime un lote de etiquetas directamente por USB */
  async printLabels(items: LabelItem[], storeName: string, format: TicketFormat): Promise<boolean> {
    if (!items || items.length === 0) return false;

    const config = this.getConfig();
    const dimensions: LabelDimensions = {
      widthMm: config.widthMm,
      heightMm: config.heightMm,
      gapMm: config.gapMm,
    };

    let bytes: Uint8Array;
    if (config.protocol === 'ZPL') {
      bytes = buildZplLabelCommands(items, storeName, format, dimensions);
    } else {
      bytes = buildTsplLabelCommands(items, storeName, format, dimensions);
    }

    await this.sendRawBytes(bytes);
    return true;
  }

  /** Imprime una etiqueta de prueba */
  async printTestLabel(format: TicketFormat): Promise<boolean> {
    const config = this.getConfig();
    const dimensions: LabelDimensions = {
      widthMm: config.widthMm,
      heightMm: config.heightMm,
      gapMm: config.gapMm,
    };

    const bytes = buildTestLabelCommands(config.protocol, format, dimensions);
    await this.sendRawBytes(bytes);
    return true;
  }

  /** Desvincula el puerto activo */
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
      // Ignorar
    }
  }
}

export const labelPrinterService = new LabelPrinterService();
