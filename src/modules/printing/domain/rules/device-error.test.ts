import { describe, expect, it } from 'vitest';
import { deviceErrorMessage, isDevicePickerCancelled, isNoPrinterConfigured, NO_PRINTER_CONFIGURED } from './device-error';

describe('errores de impresora', () => {
  it('reconoce que no hay impresora emparejada', () => {
    expect(isNoPrinterConfigured(new Error(NO_PRINTER_CONFIGURED))).toBe(true);
    expect(isNoPrinterConfigured(new Error('otro'))).toBe(false);
    expect(isNoPrinterConfigured('NO_PRINTER_CONFIGURED')).toBe(false);
  });

  it('usa el mensaje del dispositivo o el de respaldo', () => {
    expect(deviceErrorMessage(new Error('Puerto ocupado'), 'x')).toBe('Puerto ocupado');
    expect(deviceErrorMessage(new Error(''), 'respaldo')).toBe('respaldo');
    expect(deviceErrorMessage({ message: 'raro' }, 'respaldo')).toBe('respaldo');
  });

  it('cerrar el selector de dispositivos se reconoce por NotFoundError', () => {
    expect(isDevicePickerCancelled(Object.assign(new Error('x'), { name: 'NotFoundError' }))).toBe(true);
    expect(isDevicePickerCancelled(new Error('x'))).toBe(false);
    expect(isDevicePickerCancelled(null)).toBe(false);
  });
});
