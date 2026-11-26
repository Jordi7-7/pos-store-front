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
