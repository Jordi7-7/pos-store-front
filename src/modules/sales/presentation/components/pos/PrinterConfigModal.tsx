import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, CheckCircle2, AlertCircle, RefreshCw, Unplug, Zap, Eye } from 'lucide-react';
import { toast } from 'sonner';
import {
  thermalPrinterService,
  type PrinterConfig,
} from '../../../infrastructure/printing/thermal-printer.service';
import { EscPosSimulatorModal } from './EscPosSimulatorModal';

interface PrinterConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigured?: () => void;
}

export const PrinterConfigModal: React.FC<PrinterConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigured,
}) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [config, setConfig] = useState<PrinterConfig>(thermalPrinterService.getConfig());

  useEffect(() => {
    if (!isOpen) return;

    const checkStatus = async () => {
      const supported = thermalPrinterService.isSupported();
      setIsSupported(supported);
      if (supported) {
        const configured = await thermalPrinterService.isConfigured();
        setIsConfigured(configured);
      }
      setConfig(thermalPrinterService.getConfig());
    };

    checkStatus();
  }, [isOpen]);

  const handlePairPrinter = async () => {
    try {
      setIsConnecting(true);
      const selected = await thermalPrinterService.requestPort();
      if (selected) {
        setIsConfigured(true);
        toast.success('¡Impresora USB vinculada con éxito!');
        if (onConfigured) onConfigured();
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al conectar con la impresora USB.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTestPrint = async () => {
    try {
      setIsTesting(true);
      await thermalPrinterService.printTestTicket();
      toast.success('¡Ticket de prueba enviado a la impresora!');
    } catch (err: any) {
      if (err.message === 'NO_PRINTER_CONFIGURED') {
        toast.error('Primero debes vincular tu impresora USB.');
      } else {
        toast.error(`Error al imprimir: ${err.message || 'Verifica la conexión USB'}`);
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleUnlink = async () => {
    await thermalPrinterService.forgetPrinter();
    setIsConfigured(false);
    toast.info('Impresora desvinculada.');
  };

  const handleConfigChange = (key: keyof PrinterConfig, value: any) => {
    const updated = thermalPrinterService.saveConfig({ [key]: value });
    setConfig(updated);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-bg-card border border-border-card p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-secondary flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Printer className="w-4 h-4" />
            </div>
            <span>Configuración de Impresora de Tickets</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral mt-1">
            Conecta tu impresora térmica USB para imprimir directo e instantáneo sin ventanas emergentes.
          </DialogDescription>
        </DialogHeader>

        {!isSupported ? (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Navegador no compatible con Web Serial API</span>
            </div>
            <p className="text-neutral leading-relaxed">
              Para usar la impresión directa sin ventanas de previsualización, por favor abre el sistema desde <strong>Google Chrome</strong> o <strong>Microsoft Edge</strong>.
            </p>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {/* Estado de Conexión */}
            <div className="p-3.5 rounded-xl bg-bg-dark border border-border-card flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {isConfigured ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-neutral shrink-0" />
                )}
                <div>
                  <h4 className="text-xs font-bold text-secondary">
                    {isConfigured ? 'Impresora Vinculada' : 'Sin impresora vinculada'}
                  </h4>
                  <span className="text-[10px] text-neutral">
                    {isConfigured
                      ? 'Lista para impresión directa por USB'
                      : 'Presiona el botón para vincular tu impresora USB'}
                  </span>
                </div>
              </div>

              {isConfigured ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUnlink}
                  className="h-7 text-[11px] text-rose-500 hover:text-rose-600 gap-1"
                >
                  <Unplug className="w-3 h-3" />
                  <span>Desvincular</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={handlePairPrinter}
                  disabled={isConnecting}
                  className="h-8 text-xs font-bold gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{isConnecting ? 'Conectando...' : 'Vincular USB'}</span>
                </Button>
              )}
            </div>

            {/* Opciones de Papel y Hardware */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Ancho de Papel Térmico
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleConfigChange('paperWidth', '58mm')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      config.paperWidth === '58mm'
                        ? 'bg-primary/10 border-primary text-primary font-bold'
                        : 'bg-bg-dark border-border-card text-neutral hover:border-border'
                    }`}
                  >
                    <div className="text-xs">58 mm (2 pulgadas)</div>
                    <div className="text-[10px] opacity-70">Mini impresoras (32 cols)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleConfigChange('paperWidth', '80mm')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      config.paperWidth === '80mm'
                        ? 'bg-primary/10 border-primary text-primary font-bold'
                        : 'bg-bg-dark border-border-card text-neutral hover:border-border'
                    }`}
                  >
                    <div className="text-xs">80 mm (3 pulgadas)</div>
                    <div className="text-[10px] opacity-70">Epson / Bixolon (42 cols)</div>
                  </button>
                </div>
              </div>

              {/* Switches de hardware */}
              <div className="p-3 rounded-xl bg-bg-dark border border-border-card space-y-2.5">
                <label className="flex items-center justify-between text-xs cursor-pointer">
                  <span className="text-secondary font-medium">Abrir cajón monedero al cobrar</span>
                  <input
                    type="checkbox"
                    checked={config.openDrawer}
                    onChange={(e) => handleConfigChange('openDrawer', e.target.checked)}
                    className="rounded accent-primary w-4 h-4 cursor-pointer"
                  />
                </label>

                <div className="border-t border-border-card/60" />

                <label className="flex items-center justify-between text-xs cursor-pointer">
                  <span className="text-secondary font-medium">Corte de papel automático al finalizar</span>
                  <input
                    type="checkbox"
                    checked={config.cutPaper}
                    onChange={(e) => handleConfigChange('cutPaper', e.target.checked)}
                    className="rounded accent-primary w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Botones de Prueba y Simulación */}
            <div className="space-y-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsSimulatorOpen(true)}
                className="w-full text-xs h-9 gap-1.5 cursor-pointer font-medium bg-bg-dark border-border-card text-secondary hover:text-white"
              >
                <Eye className="w-3.5 h-3.5 text-primary" />
                <span>Simular Salida de Bytes ESC/POS (Sin impresora)</span>
              </Button>

              {isConfigured && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestPrint}
                  disabled={isTesting}
                  className="w-full text-xs h-9 gap-1.5 cursor-pointer font-bold border-primary/30 text-primary hover:bg-primary/10"
                >
                  {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
                  <span>{isTesting ? 'Imprimiendo prueba en físico...' : 'Imprimir Ticket de Prueba USB'}</span>
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="pt-3 flex justify-end gap-2 border-t border-border-card/60 mt-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
            Cerrar
          </Button>
        </div>

        {/* Modal del Simulador de Bytes */}
        <EscPosSimulatorModal
          isOpen={isSimulatorOpen}
          onClose={() => setIsSimulatorOpen(false)}
          defaultPaperWidth={config.paperWidth}
        />
      </DialogContent>
    </Dialog>
  );
};
