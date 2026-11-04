import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tag, CheckCircle2, RefreshCw, Unplug, Zap, Printer, Cable, Info } from 'lucide-react';
import { toast } from 'sonner';
import {
  labelPrinterService,
  type LabelPrinterConfig,
} from '../../services/label-printer.service';
import {
  ZEBRA_LABEL_PRESETS,
  type LabelPreset,
} from '../../services/label-builder';

interface LabelPrinterConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigured?: () => void;
}

export const LabelPrinterConfigModal: React.FC<LabelPrinterConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigured,
}) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [config, setConfig] = useState<LabelPrinterConfig>(labelPrinterService.getConfig());

  useEffect(() => {
    if (!isOpen) return;

    const checkStatus = async () => {
      const supported = labelPrinterService.isSupported();
      setIsSupported(supported);
      if (supported) {
        const configured = await labelPrinterService.isConfigured();
        setIsConfigured(configured);
      }
      setConfig(labelPrinterService.getConfig());
    };

    checkStatus();
  }, [isOpen]);

  const handlePairPrinter = async () => {
    try {
      setIsConnecting(true);
      const selected = await labelPrinterService.requestPort();
      if (selected) {
        setIsConfigured(true);
        toast.success('¡Puerto Serie (COM) vinculado con éxito!');
        if (onConfigured) onConfigured();
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al conectar con el puerto serie.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTestPrint = async () => {
    try {
      setIsTesting(true);
      await labelPrinterService.printTestLabel();
      toast.success('¡Etiqueta de prueba enviada al puerto serie!');
    } catch (err: any) {
      if (err.message === 'NO_PRINTER_CONFIGURED') {
        toast.error('Primero debes vincular un puerto serie (COM).');
      } else {
        toast.error(`Error al imprimir en serie: ${err.message || 'Verifica la conexión'}`);
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConfig = () => {
    labelPrinterService.saveConfig(config);
    toast.success('Configuración de etiquetas guardada.');
    onClose();
  };

  const handleForget = async () => {
    await labelPrinterService.forgetPrinter();
    setIsConfigured(false);
    toast.info('Puerto serie desvinculado.');
  };

  const handleSelectPreset = (preset: LabelPreset) => {
    setConfig({
      ...config,
      widthMm: preset.widthMm,
      heightMm: preset.heightMm,
      gapMm: preset.gapMm,
    });
  };

  const isCurrentPreset = (preset: LabelPreset) => {
    return (
      config.widthMm === preset.widthMm &&
      config.heightMm === preset.heightMm &&
      config.gapMm === preset.gapMm
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[92vh] flex flex-col bg-card border border-border p-6 text-foreground overflow-hidden shadow-2xl">
        <DialogHeader className="shrink-0 pb-3 border-b border-border">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Tag className="w-4 h-4" />
            </div>
            <span>Configuración de Etiquetas y Modos de Impresión</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Configura el tamaño del rollo para tu Zebra y comprende los métodos de conexión disponibles.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 space-y-5 py-3 text-xs">
          {/* SECCIÓN 1: Tamaño del Rollo de Etiquetas (Universal) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-foreground text-xs">
                <Tag className="w-3.5 h-3.5 text-primary" />
                <span>1. Formato del Rollo de Etiquetas (Válido para todo tipo de impresión):</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">
                Resolución: <strong>203 DPI</strong>
              </span>
            </div>

            {/* Presets Zebra */}
            <div className="grid grid-cols-2 gap-2">
              {ZEBRA_LABEL_PRESETS.map((preset) => {
                const selected = isCurrentPreset(preset);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selected
                        ? 'bg-primary/10 border-primary text-primary font-bold shadow-xs'
                        : 'bg-muted/30 border-border text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{preset.widthMm} × {preset.heightMm} mm</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                        {preset.category}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{preset.description}</div>
                  </button>
                );
              })}
            </div>

            {/* Medidas manuales */}
            <div className="p-3 rounded-xl bg-muted/20 border border-border space-y-2">
              <span className="font-semibold text-foreground text-[11px] block">
                O ingresa la medida exacta de tu etiqueta en milímetros:
              </span>
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase font-semibold block mb-1">
                    Ancho (mm)
                  </label>
                  <input
                    type="number"
                    min="20"
                    max="110"
                    value={config.widthMm}
                    onChange={(e) =>
                      setConfig({ ...config, widthMm: Math.max(10, Number(e.target.value) || 50) })
                    }
                    className="w-full py-1.5 px-2.5 text-xs font-bold bg-background border border-border rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase font-semibold block mb-1">
                    Alto (mm)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="200"
                    value={config.heightMm}
                    onChange={(e) =>
                      setConfig({ ...config, heightMm: Math.max(10, Number(e.target.value) || 30) })
                    }
                    className="w-full py-1.5 px-2.5 text-xs font-bold bg-background border border-border rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase font-semibold block mb-1">
                    GAP / Separación (mm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={config.gapMm}
                    onChange={(e) =>
                      setConfig({ ...config, gapMm: Math.max(0, Number(e.target.value) || 2) })
                    }
                    className="w-full py-1.5 px-2.5 text-xs font-bold bg-background border border-border rounded-lg focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: Métodos de Conexión Explicados Claramente */}
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="font-bold text-foreground text-xs flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5 text-primary" />
              <span>2. Métodos de Impresión disponibles en tu sistema:</span>
            </div>

            {/* Método 1: Impresión Estándar Windows / Zebra (Predeterminado) */}
            <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Método Recomendado: Impresora en Windows / Zebra (Cable USB normal)</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed pl-6">
                Utiliza el botón <strong>"Imprimir en Windows / Zebra"</strong>. Tu sistema genera una imagen fija a <strong>203 DPI</strong> y la envía a través del driver oficial (ZDesigner, etc.). <strong>No necesitas configurar puertos COM ni instalar nada adicional.</strong>
              </p>
            </div>

            {/* Método 2: Puerto Serie COM Directo (Avanzado / Opcional) */}
            <div className="p-3.5 rounded-xl bg-muted/30 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <Cable className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Método Avanzado: Impresión Directa por Puerto Serie (COM)</span>
                </div>
                {isConfigured ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> Puerto COM Activo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
                    Sin puerto COM
                  </span>
                )}
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-background border border-border/70 text-[11px] text-muted-foreground leading-relaxed">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  Solo es necesario si conectas una impresora mediante un <strong>cable convertidor Serie RS-232 a USB</strong> o una impresora con chip serie nativo (como Xprinter). Permite imprimir en 1 clic sin ventanas emergentes.
                </span>
              </div>

              {/* Lenguaje del puerto serie */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-foreground block">
                  Lenguaje de Comandos (Solo aplica para el Puerto Serie COM):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, protocol: 'TSPL' })}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      config.protocol === 'TSPL'
                        ? 'bg-primary/10 border-primary text-primary font-bold'
                        : 'bg-muted/40 border-border text-foreground hover:bg-muted/70'
                    }`}
                  >
                    <div className="text-[11px] font-bold">TSPL (Xprinter / TSC)</div>
                    <div className="text-[9px] text-muted-foreground">Para impresoras de etiquetas asiáticas</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, protocol: 'ZPL' })}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      config.protocol === 'ZPL'
                        ? 'bg-primary/10 border-primary text-primary font-bold'
                        : 'bg-muted/40 border-border text-foreground hover:bg-muted/70'
                    }`}
                  >
                    <div className="text-[11px] font-bold">ZPL (Zebra)</div>
                    <div className="text-[9px] text-muted-foreground">Para impresoras Zebra con cable serie</div>
                  </button>
                </div>
              </div>

              {/* Botón de vincular puerto serie */}
              {isSupported && (
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={isConfigured ? 'outline' : 'secondary'}
                    onClick={handlePairPrinter}
                    disabled={isConnecting}
                    className="flex-1 text-xs gap-1.5 font-bold cursor-pointer h-8"
                  >
                    <RefreshCw className={`w-3 h-3 ${isConnecting ? 'animate-spin' : ''}`} />
                    {isConfigured ? 'Cambiar Puerto Serie (COM)' : 'Vincular Puerto Serie (COM)'}
                  </Button>

                  {isConfigured && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={handleForget}
                      className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2.5 cursor-pointer h-8"
                      title="Desvincular puerto serie"
                    >
                      <Unplug className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              )}

              {/* Botón de prueba si está vinculado */}
              {isConfigured && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleTestPrint}
                  disabled={isTesting}
                  className="w-full text-xs gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground h-8"
                >
                  <Zap className={`w-3.5 h-3.5 text-amber-500 ${isTesting ? 'animate-pulse' : ''}`} />
                  {isTesting ? 'Enviando comando serie...' : 'Probar Impresión por Puerto Serie (COM)'}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="pt-3 flex justify-end gap-2 border-t border-border shrink-0">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs cursor-pointer">
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSaveConfig} className="text-xs font-bold cursor-pointer">
            Guardar Configuración
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
