import { beforeEach, describe, expect, it } from 'vitest';
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

  it('imprimir dos veces seguidas funciona: cada envío abre el puerto, lo vacía y lo cierra', async () => {
    const { port, log } = bluetoothPort();
    await installSerial(port);

    await labelPrinterService.sendRawBytes(Uint8Array.from([1]));
    await labelPrinterService.sendRawBytes(Uint8Array.from([2]));

    expect(log).toEqual(['open', 'write:1', 'drain', 'close', 'open', 'write:2', 'drain', 'close']);
  });

  it('un puerto que quedó abierto con el enlace caído se cierra y se vuelve a abrir antes de enviar', async () => {
    const { port, log, dropLink } = bluetoothPort();
    await installSerial(port);
    await port.open({ baudRate: 9600 });
    dropLink();

    await labelPrinterService.sendRawBytes(Uint8Array.from([3]));

    expect(log).toEqual(['open', 'close', 'open', 'write:3', 'drain', 'close']);
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

    expect(log).toEqual(['open', 'close', 'open', 'write:5', 'drain', 'close']);
  });
});
