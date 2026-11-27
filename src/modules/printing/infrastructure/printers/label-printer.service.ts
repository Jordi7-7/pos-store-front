import type { LabelPrinter, LabelPrintOptions, LabelPrintResult } from '../../application/ports/label-printer';
import type { LabelDpi, LabelItem, LabelProtocol } from '../../domain/entities/label';
import type { TicketFormat } from '../../domain/entities/ticket';
import type { MonoBitmap } from '../../domain/rules/label-bitmap';
import type { LabelSpec } from '../../domain/rules/label-layout';
import { layoutLabel } from '../../domain/rules/label-layout';
import { buildSheets, codesPerLabel, countLabels, splitIntoBatches, type LabelSheet, type LabelStyle } from '../../domain/rules/label-sheets';
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
  /** Velocidad (pulgadas por segundo) e intensidad (0–15) para TSPL; `null` = las de la impresora. */
  speed: number | null;
  density: number | null;
}

const DEFAULT_LABEL_CONFIG: LabelPrinterConfig = {
  widthMm: 50,
  heightMm: 25,
  gapMm: 2,
  protocol: 'TSPL',
  baudRate: 9600,
  dpi: 203,
  speed: null,
  density: null,
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
/** Tope de esa espera: lo que cabe en una tanda al ritmo prudente. */
const MAX_DRAIN_MS = 20_000;
/**
 * Etiquetas por tanda. Enviando todo seguido, la impresora del dueño dejaba de recibir tras 20–28 etiquetas distintas
 * (unos 10 KB cada una), así que cada tanda queda bastante por debajo.
 */
const LABELS_PER_BATCH = 8;
/** Pausa por etiqueta entre tandas, para que la impresora alcance a imprimir lo que ya tiene (a 160 mm/s, unos 0,2 s). */
const PRINT_MS_PER_LABEL = 200;
/** Si un bloque no se logra escribir en este tiempo, la impresora o la conexión dejaron de recibir. */
const STALL_MS = 30_000;
/** Abrir también puede quedarse sin respuesta; pasado esto se reintenta. */
const OPEN_TIMEOUT_MS = 15_000;
/** Cerrar un puerto trabado puede no terminar nunca: no se espera más que esto. */
const CLOSE_TIMEOUT_MS = 5000;

/** Un envío a la impresora y cuántas etiquetas imprime. */
interface Job {
  bytes: Uint8Array;
  labels: number;
}

const labelsOf = (batch: readonly Job[]): number => batch.reduce((total, job) => total + job.labels, 0);

/** El resultado de `work`, o un fallo si tarda más de `ms`. */
async function within<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new StalledError()), ms);
  });
  try {
    return await Promise.race([work, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

class StalledError extends Error {}

/** Espera `ms`, o menos si se cancela. */
const pause = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve) => {
    if (signal?.aborted) return resolve();
    const done = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', done);
      resolve();
    };
    const timer = setTimeout(done, ms);
    signal?.addEventListener('abort', done);
  });

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
        await within(port.open({ baudRate: this.getConfig().baudRate || 9600 }), OPEN_TIMEOUT_MS);
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
      await within(port.close(), CLOSE_TIMEOUT_MS);
    } catch (error) {
      // ya estaba cerrado o se perdió la conexión: no debe tapar el resultado del envío
      console.warn('Impresora de etiquetas: no se pudo cerrar el puerto', error);
    }
  }

  /**
   * Envía las tandas en una sola conexión: abre, escribe en bloques pequeños (Bluetooth no aguanta uno grande) y entre tanda
   * y tanda espera a que la impresora imprima. El puerto se cierra DESPUÉS de un margen, no en el acto: el navegador da los
   * datos por enviados cuando aún van en camino y cerrar ahí cortaba el último trabajo (con una sola etiqueta no salía
   * nada). Tampoco se deja abierto: una conexión Bluetooth que se cae queda tomada e impide volver a abrirla. Si algo falla,
   * se cierra en el momento. Devuelve las etiquetas enviadas.
   */
  private async send(batches: Job[][], { onProgress, signal }: LabelPrintOptions = {}): Promise<number> {
    const port = await this.openPort();
    const total = batches.reduce((sum, batch) => sum + labelsOf(batch), 0);
    let sent = 0;
    let lastBytes = 0;
    try {
      if (!port.writable) throw new Error('El puerto de la impresora no admite escritura.');
      const writer = port.writable.getWriter();
      try {
        for (const [index, batch] of batches.entries()) {
          if (index > 0) await pause(labelsOf(batches[index - 1] ?? []) * PRINT_MS_PER_LABEL, signal);
          if (signal?.aborted) break;
          lastBytes = 0;
          for (const { bytes, labels } of batch) {
            // Solo se cancela entre trabajos: una imagen a medias deja a la impresora esperando el resto
            if (signal?.aborted) break;
            for (let offset = 0; offset < bytes.length; offset += CHUNK_BYTES) {
              await within(writer.write(bytes.slice(offset, offset + CHUNK_BYTES)), STALL_MS);
            }
            lastBytes += bytes.length;
            sent += labels;
            onProgress?.(sent, total);
          }
        }
        await within(writer.close(), STALL_MS); // entrega al sistema todo lo que quede en el navegador
      } catch (error) {
        // Sin esperarlo: con la conexión trabada puede no terminar
        void writer.abort?.().catch(() => undefined);
        throw error;
      } finally {
        writer.releaseLock();
      }
    } catch (error) {
      await this.closeQuietly(port);
      if (error instanceof StalledError) {
        throw new Error(`la impresora dejó de recibir (enviadas ${sent} de ${total}). Apágala y enciéndela, revisa cuántas salieron e imprime las que faltan.`, { cause: error });
      }
      throw error;
    }
    this.closing = this.closeAfter(port, Math.min(MAX_DRAIN_MS, Math.max(MIN_DRAIN_MS, (lastBytes / BYTES_PER_SECOND) * 1000)));
    return sent;
  }

  private async closeAfter(port: SerialPortLike, delayMs: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await this.closeQuietly(port);
  }

  /** Envía los bytes crudos a la impresora de etiquetas. */
  async sendRawBytes(bytes: Uint8Array): Promise<void> {
    await this.send([[{ bytes, labels: 0 }]]);
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

  /** Imprime las etiquetas directamente por el puerto (USB o Bluetooth), por tandas. */
  async printLabels(items: LabelItem[], storeName: string, format: TicketFormat, options: LabelPrintOptions = {}): Promise<LabelPrintResult> {
    const config = this.getConfig();
    const sheets = buildSheets(items ?? [], codesPerLabel(config));
    const total = countLabels(sheets);
    if (total === 0) return { sent: 0, total, cancelled: false };
    const batches = splitIntoBatches(sheets, LABELS_PER_BATCH).map((batch) => batch.map((sheet) => ({ bytes: this.jobFor(sheet, storeName, format, config), labels: sheet.copies })));
    const sent = await this.send(batches, options);
    return { sent, total, cancelled: sent < total };
  }

  /** Dos etiquetas de prueba: una de medidas (marco y regla) y una de muestra con el diseño real. */
  async printTestLabel(storeName: string, format: TicketFormat): Promise<boolean> {
    const config = this.getConfig();
    const measureJob = this.imageJob(canvasToBitmap(renderMeasureCanvas(specOf(config))), config, 1);
    const perLabel = codesPerLabel(config);
    const samples = buildSheets([{ ...TEST_ITEM, quantity: perLabel }], perLabel);
    await this.send([[{ bytes: measureJob, labels: 1 }, ...samples.map((sheet) => ({ bytes: this.jobFor(sheet, storeName, format, config), labels: sheet.copies }))]]);
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
