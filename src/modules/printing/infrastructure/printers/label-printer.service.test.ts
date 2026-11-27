import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { labelPrinterService } from './label-printer.service';
import type { SerialPortLike } from './web-serial';

/**
 * Impresora Bluetooth de mentira: el enlace solo vale para el primer envío tras abrir el puerto. Si se reutiliza el puerto
 * abierto, escribir falla como en Chrome.
 */
function bluetoothPort() {
  const log: string[] = [];
  let stale = false;
  const port: SerialPortLike = {
    readable: null,
    writable: null,
    open: async () => {
      if (port.writable) throw new Error('The port is already open.');
      log.push('open');
      stale = false;
      port.writable = {
        getWriter: () => ({
          write: async (chunk: Uint8Array) => {
            if (stale) throw new Error('An unknown system error has occurred.');
            log.push(`write:${chunk.join(',')}`);
          },
          close: async () => {
            stale = true;
            log.push('drain');
          },
          releaseLock: () => undefined,
        }),
      } as unknown as WritableStream<Uint8Array>;
    },
    close: async () => {
      log.push('close');
      port.writable = null;
    },
    getInfo: () => ({ bluetoothServiceClassId: '00001101-0000-1000-8000-00805f9b34fb' }),
  };
  return { port, log, dropLink: () => void (stale = true) };
}

/** La deja vinculada como impresora de etiquetas. */
async function installSerial(port: SerialPortLike) {
  Object.defineProperty(navigator, 'serial', { configurable: true, value: { getPorts: async () => [port], requestPort: async () => port } });
  await labelPrinterService.requestPort();
}

const FORMAT = { currencyCode: 'USD', locale: 'es-EC' };
const labels = (quantity: number) => [{ sku: 'A', name: 'A', price: 1, quantity }];
/** Los trabajos de imagen no se dibujan en las pruebas (no hay canvas): cada uno es un byte con sus copias. */
vi.mock('../labels/label-canvas', () => ({
  renderSheetBitmap: () => ({ widthBytes: 1, height: 1, bytes: new Uint8Array(1) }),
  renderMeasureCanvas: () => null,
  canvasToBitmap: () => ({ widthBytes: 1, height: 1, bytes: new Uint8Array(1) }),
}));
const printedCopies = (log: string[]): number[] =>
  log.flatMap((entry) => {
    if (!entry.startsWith('write:')) return [];
    const text = String.fromCharCode(...entry.slice(6).split(',').map(Number));
    return [...text.matchAll(/PRINT 1,(\d+)/g)].map((match) => Number(match[1]));
  });

describe('envío a la impresora de etiquetas', () => {
  beforeEach(() => localStorage.clear());
  afterEach(async () => {
    if (vi.isFakeTimers()) await vi.advanceTimersByTimeAsync(10_000);
    vi.useRealTimers();
  });

  it('al terminar de enviar no cierra en el acto (lo último iría en camino), pero tampoco deja el puerto tomado', async () => {
    vi.useFakeTimers();
    const { port, log } = bluetoothPort();
    await installSerial(port);

    await labelPrinterService.sendRawBytes(Uint8Array.from([1]));
    expect(log).toEqual(['open', 'write:1', 'drain']);

    await vi.advanceTimersByTimeAsync(1600);
    expect(log).toEqual(['open', 'write:1', 'drain', 'close']);
  });

  it('un envío grande espera más antes de cerrar, y el siguiente aguarda a ese cierre', async () => {
    vi.useFakeTimers();
    const { port, log } = bluetoothPort();
    await installSerial(port);
    await labelPrinterService.sendRawBytes(new Uint8Array(8000)); // 2 s al ritmo prudente de 4000 bytes por segundo

    const next = labelPrinterService.sendRawBytes(Uint8Array.from([2]));
    await vi.advanceTimersByTimeAsync(1900);
    expect(log).not.toContain('close');
    await vi.advanceTimersByTimeAsync(200);
    await next;
    expect(log.slice(-4)).toEqual(['close', 'open', 'write:2', 'drain']);
  });

  it('imprimir dos veces seguidas funciona: cada envío abre el puerto y lo cierra al terminar de salir', async () => {
    vi.useFakeTimers();
    const { port, log } = bluetoothPort();
    await installSerial(port);

    await labelPrinterService.sendRawBytes(Uint8Array.from([1]));
    const second = labelPrinterService.sendRawBytes(Uint8Array.from([2]));
    await vi.advanceTimersByTimeAsync(3500);
    await second;

    expect(log).toEqual(['open', 'write:1', 'drain', 'close', 'open', 'write:2', 'drain', 'close']);
  });

  it('si abrir falla porque la conexión anterior aún se está cerrando, reintenta y la etiqueta sale', async () => {
    vi.useFakeTimers();
    const { port, log } = bluetoothPort();
    const open = port.open;
    let failures = 3;
    port.open = async (options) => {
      if (failures-- > 0) throw new Error('Failed to open serial port.');
      await open(options);
    };
    await installSerial(port);

    const sending = labelPrinterService.sendRawBytes(Uint8Array.from([7]));
    await vi.advanceTimersByTimeAsync(8000);
    await sending;

    expect(log).toEqual(['open', 'write:7', 'drain', 'close']); // salió al cuarto intento y se cerró al terminar
  });

  it('si no abre ni tras varios intentos, el aviso dice qué revisar', async () => {
    vi.useFakeTimers();
    const { port } = bluetoothPort();
    let attempts = 0;
    port.open = async () => {
      attempts += 1;
      throw new Error('Failed to open serial port.');
    };
    await installSerial(port);

    const failure = expect(labelPrinterService.sendRawBytes(Uint8Array.from([9]))).rejects.toThrow(/Apaga y enciende la impresora/);
    await vi.advanceTimersByTimeAsync(15_000);
    await failure;

    expect(attempts).toBe(5);
  });

  it('un envío largo sale por tandas con pausas, en una sola conexión, y avisa del avance', async () => {
    vi.useFakeTimers();
    const { port, log } = bluetoothPort();
    await installSerial(port);
    const progress: number[] = [];

    const printing = labelPrinterService.printLabels(labels(20), 'Tienda', FORMAT, { onProgress: (sent) => progress.push(sent) });
    await vi.advanceTimersByTimeAsync(100);
    expect(printedCopies(log)).toEqual([8]);
    await vi.advanceTimersByTimeAsync(1400); // la pausa de 8 etiquetas son 1,6 s
    expect(printedCopies(log)).toEqual([8]);
    await vi.advanceTimersByTimeAsync(200);
    expect(printedCopies(log)).toEqual([8, 8]);
    await vi.advanceTimersByTimeAsync(1600);

    await expect(printing).resolves.toEqual({ sent: 20, total: 20, cancelled: false });
    expect(printedCopies(log)).toEqual([8, 8, 4]);
    expect(progress).toEqual([8, 16, 20]);
    expect(log.filter((entry) => entry === 'open')).toHaveLength(1);
    expect(log).not.toContain('close'); // la última tanda aún tiene su margen antes de cerrar
  });

  it('al cancelar no manda más tandas y dice cuántas envió', async () => {
    vi.useFakeTimers();
    const { port, log } = bluetoothPort();
    await installSerial(port);
    const abort = new AbortController();

    const printing = labelPrinterService.printLabels(labels(20), 'Tienda', FORMAT, { signal: abort.signal });
    await vi.advanceTimersByTimeAsync(100);
    abort.abort();
    await vi.advanceTimersByTimeAsync(0);

    await expect(printing).resolves.toEqual({ sent: 8, total: 20, cancelled: true });
    expect(printedCopies(log)).toEqual([8]);
    await vi.advanceTimersByTimeAsync(2000);
    expect(log.at(-1)).toBe('close');
  });

  it('si la impresora deja de recibir, no se queda «enviando»: avisa cuántas envió y cierra el puerto', async () => {
    vi.useFakeTimers();
    const { port, log } = bluetoothPort();
    const open = port.open;
    port.open = async (options) => {
      await open(options);
      if (!port.writable) throw new Error('sin escritura');
      const writer = port.writable.getWriter();
      let writes = 0;
      port.writable = {
        getWriter: () => ({ ...writer, write: (chunk: Uint8Array) => (++writes > 1 ? new Promise<void>(() => undefined) : writer.write(chunk)) }),
      } as unknown as WritableStream<Uint8Array>;
    };
    await installSerial(port);

    const failure = expect(labelPrinterService.printLabels(labels(20), 'Tienda', FORMAT)).rejects.toThrow(/dejó de recibir \(enviadas 8 de 20\)/);
    await vi.advanceTimersByTimeAsync(40_000);
    await failure;

    expect(log.at(-1)).toBe('close');
  });

  it('un puerto que quedó abierto con el enlace caído se cierra y se vuelve a abrir antes de enviar', async () => {
    const { port, log, dropLink } = bluetoothPort();
    await installSerial(port);
    await port.open({ baudRate: 9600 });
    dropLink();

    await labelPrinterService.sendRawBytes(Uint8Array.from([3]));

    expect(log).toEqual(['open', 'close', 'open', 'write:3', 'drain']);
  });

  it('si el envío falla, el puerto se cierra y el siguiente intento funciona', async () => {
    const { port, log, dropLink } = bluetoothPort();
    const open = port.open;
    port.open = async (options) => {
      await open(options);
      port.open = open;
      dropLink(); // el primer enlace nace caído
    };
    await installSerial(port);

    await expect(labelPrinterService.sendRawBytes(Uint8Array.from([4]))).rejects.toThrow('unknown system error');
    await labelPrinterService.sendRawBytes(Uint8Array.from([5]));

    expect(log).toEqual(['open', 'close', 'open', 'write:5', 'drain']);
  });
});
