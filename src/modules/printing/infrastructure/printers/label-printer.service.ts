import type { LabelPrinter } from '../../application/ports/label-printer';
import type { LabelDpi, LabelItem, LabelProtocol } from '../../domain/entities/label';
import type { TicketFormat } from '../../domain/entities/ticket';
import type { MonoBitmap } from '../../domain/rules/label-bitmap';
import type { LabelSpec } from '../../domain/rules/label-layout';
import { layoutLabel } from '../../domain/rules/label-layout';
import { canvasToBitmap, renderLabelBitmap, renderMeasureCanvas } from '../labels/label-canvas';
import { tsplCalibrate, tsplImageJob, zplCalibrate, zplImageJob } from '../labels/label-commands';
import { portRegistry } from './port-registry';
import { getSerial, type SerialPortLike } from './web-serial';
import { isDevicePickerCancelled, NO_PRINTER_CONFIGURED } from '../../domain/rules/device-error';

export interface LabelPrinterConfig {
  widthMm: number;
  heightMm: number;
  gapMm: number;
  protocol: LabelProtocol;
  baudRate: number;
  /** Resolución del cabezal: 203 (la común) o 300 dpi. */
  dpi: LabelDpi;
  /** Franja negra con el nombre de la tienda. */
  showStore: boolean;
}

const DEFAULT_LABEL_CONFIG: LabelPrinterConfig = {
  widthMm: 50,
  heightMm: 25,
  gapMm: 2,
  protocol: 'TSPL',
  baudRate: 9600,
  dpi: 203,
  showStore: true,
};

const STORAGE_KEY = 'aura_label_printer_config';

/** Tamaño de cada envío: las conexiones Bluetooth se atragantan con bloques grandes. */
const CHUNK_BYTES = 2048;

export const specOf = (config: LabelPrinterConfig): LabelSpec => ({ widthMm: config.widthMm, heightMm: config.heightMm, dpi: config.dpi });

const TEST_ITEM: LabelItem = { sku: 'TEST-123456', name: 'Etiqueta de prueba', detail: 'M / Rojo', price: 9.99, quantity: 1 };

class LabelPrinterService implements LabelPrinter {
  /** Comprueba si el navegador actual soporta Web Serial API */
  isSupported(): boolean {
    return getSerial() !== undefined;
  }

  private serial() {
    const serial = getSerial();
    if (!serial) throw new Error('Web Serial API no soportada');
    return serial;
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

  /** ¿Hay una impresora de ETIQUETAS vinculada? (La de tickets no cuenta.) */
  async isConfigured(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      return (await portRegistry.portFor('label')) !== null;
    } catch {
      return false;
    }
  }

  /** Solicita al usuario vincular su impresora de etiquetas (USB o Bluetooth) */
  async requestPort(): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error('Tu navegador no soporta Web Serial API. Usa Google Chrome o Microsoft Edge.');
    }

    try {
      const port = await this.serial().requestPort();
      await portRegistry.assign('label', port);
        return true;
    } catch (err) {
      if (isDevicePickerCancelled(err)) {
        return false;
      }
      throw err;
    }
  }

  /** Abre la conexión con la impresora de etiquetas. Si había quedado abierta, la cierra antes: puede estar caída. */
  private async openPort(): Promise<SerialPortLike> {
    if (!this.isSupported()) {
      throw new Error('Web Serial API no soportada');
    }

    const port = await portRegistry.portFor('label');
    if (!port) throw new Error(NO_PRINTER_CONFIGURED);

    if (port.readable || port.writable) await this.closeQuietly(port);
    await port.open({ baudRate: this.getConfig().baudRate || 9600 });
    return port;
  }

  private async closeQuietly(port: SerialPortLike): Promise<void> {
    try {
      await port.close();
    } catch {
      // ya estaba cerrado o se perdió la conexión: no debe tapar el resultado del envío
    }
  }

  /**
   * Envía los trabajos en una sola conexión: abre, escribe en bloques pequeños (Bluetooth no aguanta uno grande), espera
   * a que salga todo y cierra. El puerto no se deja abierto porque la impresora Bluetooth corta el enlace y la siguiente
   * impresión fallaba con «An unknown system error has occurred».
   */
  private async send(jobs: Uint8Array[]): Promise<void> {
    const port = await this.openPort();
    try {
      if (!port.writable) throw new Error('El puerto de la impresora no admite escritura.');
      const writer = port.writable.getWriter();
      try {
        for (const bytes of jobs) {
          for (let offset = 0; offset < bytes.length; offset += CHUNK_BYTES) {
            await writer.write(bytes.slice(offset, offset + CHUNK_BYTES));
          }
        }
        await writer.close(); // sin esto, cerrar el puerto descartaría lo que aún no ha salido
      } finally {
        writer.releaseLock();
      }
    } finally {
      await this.closeQuietly(port);
    }
  }

  /** Envía los bytes crudos a la impresora de etiquetas. */
  async sendRawBytes(bytes: Uint8Array): Promise<void> {
    await this.send([bytes]);
  }

  /** Trabajo de impresión de una etiqueta (con sus copias): la imagen de la vista previa en el idioma de la impresora. */
  private jobFor(item: LabelItem, storeName: string, format: TicketFormat, config: LabelPrinterConfig): Uint8Array {
    const spec = specOf(config);
    return this.imageJob(renderLabelBitmap({ item, storeName, format, spec, showStore: config.showStore }), config, Math.max(1, Math.floor(Number(item.quantity) || 1)));
  }

  private imageJob(bitmap: MonoBitmap, config: LabelPrinterConfig, copies: number): Uint8Array {
    if (config.protocol === 'ZPL') {
      const { widthDots, heightDots } = layoutLabel(specOf(config), { showStore: false, hasDetail: false });
      return zplImageJob(bitmap, widthDots, heightDots, copies);
    }
    return tsplImageJob(bitmap, config, copies);
  }

  /** Imprime un lote de etiquetas directamente por el puerto (USB o Bluetooth) */
  async printLabels(items: LabelItem[], storeName: string, format: TicketFormat): Promise<boolean> {
    if (!items || items.length === 0) return false;
    const config = this.getConfig();
    await this.send(items.map((item) => this.jobFor(item, storeName, format, config)));
    return true;
  }

  /** Dos etiquetas de prueba: una de medidas (marco y regla) y una de muestra con el diseño real. */
  async printTestLabel(storeName: string, format: TicketFormat): Promise<boolean> {
    const config = this.getConfig();
    const measureJob = this.imageJob(canvasToBitmap(renderMeasureCanvas(specOf(config))), config, 1);
    await this.send([measureJob, this.jobFor(TEST_ITEM, storeName, format, config)]);
    return true;
  }

  /** Hace que la impresora mida el rollo y se ajuste; avanza unas etiquetas. Conviene tras cambiar de rollo. */
  async calibrate(): Promise<void> {
    const config = this.getConfig();
    await this.sendRawBytes(config.protocol === 'ZPL' ? zplCalibrate() : tsplCalibrate(config));
  }

  /** Desvincula la impresora de etiquetas (no toca la de tickets) */
  async forgetPrinter(): Promise<void> {
    await portRegistry.release('label');
  }
}

export const labelPrinterService = new LabelPrinterService();
