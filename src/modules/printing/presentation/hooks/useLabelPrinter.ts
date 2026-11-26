import { useCallback, useEffect, useState } from 'react';
import { labelPrinterService, specOf, type LabelPrinterConfig } from '../../infrastructure/printers/label-printer.service';

/** Estado de la impresora de etiquetas: su configuración guardada y si hay un puerto (USB o Bluetooth) vinculado. */
export function useLabelPrinter(active: boolean) {
  const [config, setConfig] = useState<LabelPrinterConfig>(() => labelPrinterService.getConfig());
  const [connected, setConnected] = useState(false);

  const refresh = useCallback(async () => {
    setConfig(labelPrinterService.getConfig());
    setConnected(await labelPrinterService.isConfigured());
  }, []);

  useEffect(() => {
    if (active) void refresh();
  }, [active, refresh]);

  const update = useCallback((patch: Partial<LabelPrinterConfig>) => setConfig(labelPrinterService.saveConfig(patch)), []);

  /** Abre el selector del navegador para vincular la impresora; `false` si la persona lo cerró sin elegir. */
  const connect = useCallback(async (): Promise<boolean> => {
    const linked = await labelPrinterService.requestPort();
    if (linked) setConnected(true);
    return linked;
  }, []);

  const disconnect = useCallback(async () => {
    await labelPrinterService.forgetPrinter();
    setConnected(false);
  }, []);

  return { config, spec: specOf(config), connected, supported: labelPrinterService.isSupported(), update, connect, disconnect, refresh };
}

export type LabelPrinterState = ReturnType<typeof useLabelPrinter>;
