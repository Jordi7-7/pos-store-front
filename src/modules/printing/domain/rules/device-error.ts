/** Error que lanza el servicio de impresión cuando no hay ninguna impresora emparejada. */
export const NO_PRINTER_CONFIGURED = 'NO_PRINTER_CONFIGURED';

export const isNoPrinterConfigured = (error: unknown): boolean => error instanceof Error && error.message === NO_PRINTER_CONFIGURED;

/** Texto de un fallo del dispositivo (USB o puerto serie), o el de respaldo si no trae mensaje. */
export const deviceErrorMessage = (error: unknown, fallback: string): string => (error instanceof Error && error.message ? error.message : fallback);

/** ¿Cerró la persona el selector de dispositivos del navegador sin elegir? No es un fallo. */
export const isDevicePickerCancelled = (error: unknown): boolean => typeof error === 'object' && error !== null && (error as { name?: unknown }).name === 'NotFoundError';
