import type { LabelPrinter } from '../../application/ports/label-printer';
import type { LabelDpi, LabelItem, LabelProtocol } from '../../domain/entities/label';
import type { TicketFormat } from '../../domain/entities/ticket';
import type { MonoBitmap } from '../../domain/rules/label-bitmap';
import type { LabelSpec } from '../../domain/rules/label-layout';
import { layoutLabel } from '../../domain/rules/label-layout';
import { buildSheets, codesPerLabel, type LabelSheet, type LabelStyle } from '../../domain/rules/label-sheets';
import { canvasToBitmap, renderMeasureCanvas, renderSheetBitmap } from '../labels/label-canvas';
import { tsplCalibrate, tsplImageJob, zplCalibrate, zplImageJob } from '../labels/label-commands';
import { portRegistry } from './port-registry';
import { getSerial, type SerialPortLike } from './web-serial';
import { isDevicePickerCancelled, NO_PRINTER_CONFIGURED } from '../../domain/rules/device-error';

export interface LabelPrinterConfig extends LabelStyle {
  widthMm: number;
  heightMm: number;
  gapMm: number;
  protocol: LabelProtocol;
  baudRate: number;
  /** Resolución del cabezal: 203 (la común) o 300 dpi. */
  dpi: LabelDpi;
}

const DEFAULT_LABEL_CONFIG: LabelPrinterConfig = {
  widthMm: 50,
  heightMm: 25,
  gapMm: 2,
  protocol: 'TSPL',
  baudRate: 9600,
  dpi: 203,
  showStore: true,
  content: 'FULL',
  twoPerLabel: false,
};

const STORAGE_KEY = 'aura_label_printer_config';

/** Tamaño de cada envío: las conexiones Bluetooth se atragantan con bloques grandes. */
const CHUNK_BYTES = 2048;

/** Ritmo prudente (lento a propósito) al que se da por salido lo enviado por Bluetooth. */
const BYTES_PER_SECOND = 4000;
/**
 * Esperas entre intentos de apertura. Justo después de cerrar, el sistema aún está soltando la conexión Bluetooth y abrir
 * falla con «Failed to open serial port»: unos segundos después funciona.
 */
const OPEN_RETRY_DELAYS_MS = [700, 1500, 3000, 4000];
/** Margen mínimo antes de cerrar, aunque se haya enviado muy poco. */
const MIN_DRAIN_MS = 1500;
/** Tope de esa espera: en un lote grande casi todo ya salió mientras se escribía; solo queda en camino lo del final. */
const MAX_DRAIN_MS = 8000;

export const specOf = (config: LabelPrinterConfig): LabelSpec => ({ widthMm: config.widthMm, heightMm: config.heightMm, dpi: config.dpi });

const TEST_ITEM: LabelItem = { sku: 'TEST-123456', name: 'Etiqueta de prueba', detail: 'M / Rojo', price: 9.99, quantity: 1 };

class LabelPrinterService implements LabelPrinter {
  /** El cierre pendiente de la última conexión: se cierra cuando lo enviado ya tuvo tiempo de salir. */
  private closing: Promise<void> = Promise.resolve();

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

  /** Abre la conexión con la impresora de etiquetas, esperando antes a que la anterior termine de enviar y se cierre. */
  private async openPort(): Promise<SerialPortLike> {
    if (!this.isSupported()) {
      throw new Error('Web Serial API no soportada');
    }

    await this.closing;
    const port = await portRegistry.portFor('label');
    if (!port) throw new Error(NO_PRINTER_CONFIGURED);

    await this.openWithRetries(port);
    return port;
  }

  private async openWithRetries(port: SerialPortLike): Promise<void> {
    let failure: unknown;
    for (const delayMs of [0, ...OPEN_RETRY_DELAYS_MS]) {
      if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
      if (port.readable || port.writable) await this.closeQuietly(port); // quedó abierta y puede estar caída
      try {
        await port.open({ baudRate: this.getConfig().baudRate || 9600 });
        return;
      } catch (error) {
        failure = error;
        console.warn('Impresora de etiquetas: no se pudo abrir el puerto', error);
      }
    }
    throw new Error('no se abrió la conexión. Apaga y enciende la impresora y comprueba que ninguna otra pestaña o programa la esté usando.', { cause: failure });
  }

  private async closeQuietly(port: SerialPortLike): Promise<void> {
    try {
      await port.close();
    } catch (error) {
      // ya estaba cerrado o se perdió la conexión: no debe tapar el resultado del envío
      console.warn('Impresora de etiquetas: no se pudo cerrar el puerto', error);
    }
  }

  /**
   * Envía los trabajos en una sola conexión: abre y escribe en bloques pequeños (Bluetooth no aguanta uno grande). El puerto
   * se cierra DESPUÉS de un margen, no en el acto: el navegador da los datos por enviados cuando aún van en camino y cerrar
   * ahí cortaba el último trabajo (con una sola etiqueta no salía nada). Tampoco se deja abierto: una conexión Bluetooth que
   * se cae queda tomada e impide volver a abrirla. Si algo falla, se cierra en el momento.
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
        await writer.close(); // entrega al sistema todo lo que quede en el navegador
      } finally {
        writer.releaseLock();
      }
    } catch (error) {
      await this.closeQuietly(port);
      throw error;
    }
    const sent = jobs.reduce((total, bytes) => total + bytes.length, 0);
    this.closing = this.closeAfter(port, Math.min(MAX_DRAIN_MS, Math.max(MIN_DRAIN_MS, (sent / BYTES_PER_SECOND) * 1000)));
  }

  private async closeAfter(port: SerialPortLike, delayMs: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await this.closeQuietly(port);
  }

  /** Envía los bytes crudos a la impresora de etiquetas. */
  async sendRawBytes(bytes: Uint8Array): Promise<void> {
    await this.send([bytes]);
  }

  /** Trabajo de impresión de una etiqueta física (con sus copias): la imagen de la vista previa en el idioma de la impresora. */
  private jobFor(sheet: LabelSheet, storeName: string, format: TicketFormat, config: LabelPrinterConfig): Uint8Array {
    return this.imageJob(renderSheetBitmap({ sheet, storeName, format, spec: specOf(config), style: config }), config, sheet.copies);
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
    await this.send(buildSheets(items, codesPerLabel(config)).map((sheet) => this.jobFor(sheet, storeName, format, config)));
    return true;
  }

  /** Dos etiquetas de prueba: una de medidas (marco y regla) y una de muestra con el diseño real. */
  async printTestLabel(storeName: string, format: TicketFormat): Promise<boolean> {
    const config = this.getConfig();
    const measureJob = this.imageJob(canvasToBitmap(renderMeasureCanvas(specOf(config))), config, 1);
    const perLabel = codesPerLabel(config);
    const samples = buildSheets([{ ...TEST_ITEM, quantity: perLabel }], perLabel);
    await this.send([measureJob, ...samples.map((sheet) => this.jobFor(sheet, storeName, format, config))]);
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
