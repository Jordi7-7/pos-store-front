import { beforeEach, describe, expect, it } from 'vitest';
import type { PortInfo } from '../../domain/rules/port-assignment';
import { labelPrinterService } from './label-printer.service';
import { thermalPrinterService } from './thermal-printer.service';
import type { SerialPortLike } from './web-serial';

/** Un puerto de mentira: guarda los bytes que recibe. */
function fakePort(info: PortInfo): SerialPortLike & { written: number[]; forgotten: boolean } {
  const port = {
    written: [] as number[],
    forgotten: false,
    readable: null,
    writable: { getWriter: () => ({ write: async (chunk: Uint8Array) => void port.written.push(...chunk), releaseLock: () => undefined }) } as unknown as WritableStream<Uint8Array>,
    open: async () => undefined,
    close: async () => undefined,
    forget: async () => {
      port.forgotten = true;
    },
    getInfo: () => info,
  };
  return port;
}

/** `navigator.serial` de mentira: `granted` es lo que el navegador tiene vinculado y `next` lo que la persona elige en el selector. */
function installSerial(granted: SerialPortLike[], next: () => SerialPortLike) {
  Object.defineProperty(navigator, 'serial', {
    configurable: true,
    value: {
      getPorts: async () => granted.slice(),
      requestPort: async () => {
        const port = next();
        if (!granted.includes(port)) granted.push(port);
        return port;
      },
    },
  });
}

const ticketUsb: PortInfo = { usbVendorId: 0x0416, usbProductId: 0x5011 };
const labelBluetooth: PortInfo = { bluetoothServiceClassId: '00001101-0000-1000-8000-00805f9b34fb' };

describe('impresora de tickets e impresora de etiquetas, cada una con su puerto', () => {
  beforeEach(() => localStorage.clear());

  it('vincular solo la de etiquetas NO deja la de tickets «vinculada» (el ticket de la venta salía por ahí)', async () => {
    const label = fakePort(labelBluetooth);
    installSerial([], () => label);

    await labelPrinterService.requestPort();

    expect(await labelPrinterService.isConfigured()).toBe(true);
    expect(await thermalPrinterService.isConfigured()).toBe(false);
    await expect(thermalPrinterService.sendRawBytes(Uint8Array.from([1, 2, 3]))).rejects.toThrow('NO_PRINTER_CONFIGURED');
    expect(label.written).toEqual([]); // nada llegó a la de etiquetas
  });

  it('con las dos vinculadas, cada una recibe solo lo suyo, aunque el navegador cambie el orden de la lista', async () => {
    const ticket = fakePort(ticketUsb);
    const label = fakePort(labelBluetooth);
    const granted: SerialPortLike[] = [];
    installSerial(granted, () => (granted.length === 0 ? label : ticket));

    await labelPrinterService.requestPort(); // primero la de etiquetas
    await thermalPrinterService.requestPort(); // después la de tickets
    granted.reverse(); // el navegador entrega la lista en otro orden

    await thermalPrinterService.sendRawBytes(Uint8Array.from([7]));
    await labelPrinterService.sendRawBytes(Uint8Array.from([9]));

    expect(ticket.written).toEqual([7]);
    expect(label.written).toEqual([9]);
  });

  it('desvincular una no toca la otra', async () => {
    const ticket = fakePort(ticketUsb);
    const label = fakePort(labelBluetooth);
    const granted: SerialPortLike[] = [];
    installSerial(granted, () => (granted.length === 0 ? ticket : label));
    await thermalPrinterService.requestPort();
    await labelPrinterService.requestPort();

    await labelPrinterService.forgetPrinter();
    granted.splice(granted.indexOf(label), 1); // el navegador la saca de la lista

    expect(label.forgotten).toBe(true);
    expect(ticket.forgotten).toBe(false);
    expect(await thermalPrinterService.isConfigured()).toBe(true);
    expect(await labelPrinterService.isConfigured()).toBe(false);
  });

  it('una impresora de tickets vinculada antes de esto sigue funcionando sin volver a vincularla', async () => {
    const ticket = fakePort(ticketUsb);
    installSerial([ticket], () => ticket); // sin ninguna asignación guardada

    expect(await thermalPrinterService.isConfigured()).toBe(true);
    await thermalPrinterService.sendRawBytes(Uint8Array.from([5]));
    expect(ticket.written).toEqual([5]);
    expect(await labelPrinterService.isConfigured()).toBe(false); // ya es de tickets: las etiquetas no la toman
  });
});
