import React, { useState, useMemo, useEffect } from 'react';
import { Printer, Barcode, Settings2, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useTenant } from '@/modules/auth/presentation/hooks/useSession';
import type { BarcodeLabelItem } from './types';
import { BarcodeQueueList } from './BarcodeQueueList';
import { BarcodePreviewPanel } from './BarcodePreviewPanel';
import { ThermalPrintOutput, printThermalLabels } from './ThermalPrintOutput';
import { useTicketFormat } from '@/modules/printing/presentation/hooks/useTicketFormat';
import { labelPrinterService } from '../../../../printing/infrastructure/printers/label-printer.service';
import { LabelPrinterConfigModal } from './LabelPrinterConfigModal';

export type { BarcodeLabelItem } from './types';

interface BarcodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: BarcodeLabelItem[];
  onUpdateItems: (items: BarcodeLabelItem[]) => void;
}

export const BarcodePrintModal: React.FC<BarcodePrintModalProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateItems,
}) => {
  const publicTenant = useTenant();
  const defaultStoreName = publicTenant?.name ? publicTenant.name.toUpperCase() : 'LEIZA STORE';
  
  const ticketFormat = useTicketFormat();
  const [storeName, setStoreName] = useState(defaultStoreName);
  const [previewIndex, setPreviewIndex] = useState(0);

  // Estados de configuración de impresora de etiquetas
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isPrinterConfigured, setIsPrinterConfigured] = useState(false);
  const [isDirectPrinting, setIsDirectPrinting] = useState(false);
  const [config, setConfig] = useState(labelPrinterService.getConfig());

  useEffect(() => {
    if (!isOpen) return;
    const checkConfig = async () => {
      const configured = await labelPrinterService.isConfigured();
      setIsPrinterConfigured(configured);
      setConfig(labelPrinterService.getConfig());
    };
    checkConfig();
  }, [isOpen]);

  const handleSelectDimensions = (widthMm: number, heightMm: number) => {
    const updated = labelPrinterService.saveConfig({ widthMm, heightMm });
    setConfig(updated);
    toast.success(`Medida cambiada a ${widthMm} × ${heightMm} mm`);
  };

  const totalLabelsCount = useMemo(() => {
    return items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
  }, [items]);

  const handleQuantityChange = (sku: string, delta: number) => {
    const updated = items.map((it) => {
      if (it.sku === sku) {
        const nextQty = Math.max(1, (it.quantity || 1) + delta);
        return { ...it, quantity: nextQty };
      }
      return it;
    });
    onUpdateItems(updated);
  };

  const handleSetQuantity = (sku: string, val: number) => {
    const qty = Math.max(1, isNaN(val) ? 1 : val);
    const updated = items.map((it) => (it.sku === sku ? { ...it, quantity: qty } : it));
    onUpdateItems(updated);
  };

  const handleRemoveItem = (sku: string) => {
    const updated = items.filter((it) => it.sku !== sku);
    onUpdateItems(updated);
    if (previewIndex >= updated.length) {
      setPreviewIndex(Math.max(0, updated.length - 1));
    }
  };

  const handleSetAllQuantities = (qty: number) => {
    onUpdateItems(items.map((it) => ({ ...it, quantity: Math.max(1, qty) })));
  };

  // Impresión directa vía USB
  const executeDirectPrint = async () => {
    try {
      setIsDirectPrinting(true);
      await labelPrinterService.printLabels(items, storeName, ticketFormat);
      toast.success(`¡${totalLabelsCount} etiqueta(s) enviadas a la impresora térmica!`);
    } catch (err: any) {
      if (err.message === 'NO_PRINTER_CONFIGURED') {
        setShowConfigModal(true);
        toast.info('Vincula tu impresora térmica USB para imprimir directamente.');
      } else {
        toast.error(`Error al imprimir en USB: ${err.message || 'Verifica la impresora'}`);
      }
    } finally {
      setIsDirectPrinting(false);
    }
  };

  // Manejador del botón principal de imprimir
  const handlePrint = async () => {
    if (items.length === 0) return;

    const configured = await labelPrinterService.isConfigured();
    if (configured) {
      await executeDirectPrint();
    } else {
      setShowConfigModal(true);
      toast.info('Vincula tu impresora térmica USB para imprimir directamente.');
    }
  };

  // Impresión de respaldo por el diálogo estándar del sistema
  const handleBrowserFallbackPrint = () => {
    printThermalLabels(items, storeName, ticketFormat, {
      widthMm: config.widthMm,
      heightMm: config.heightMm,
    });
  };

  const activePreviewItem = items[previewIndex] || items[0];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-5xl! sm:max-w-5xl! h-[88vh] max-h-[750px] bg-card border border-border rounded-2xl p-6 text-foreground flex flex-col gap-0 overflow-hidden shadow-2xl">
          {/* Header del modal */}
          <DialogHeader className="pb-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                  <Barcode className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold flex items-center gap-2">
                    Impresión Térmica de Etiquetas
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Ajusta la cantidad de copias e imprime directamente en tu impresora de rollos adhesivos.
                  </DialogDescription>
                </div>
              </div>

              {/* Botón de configuración de formato de etiquetas */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowConfigModal(true)}
                className="text-xs h-8.5 gap-1.5 cursor-pointer border-border hover:bg-muted"
                title="Configurar medidas y puertos de impresión"
              >
                <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Configurar Formato</span>
              </Button>
            </div>
          </DialogHeader>

          {/* Cuerpo principal en 2 columnas con espacio amplio */}
          <div className="flex-1 min-h-0 py-4 grid grid-cols-1 md:grid-cols-12 gap-5 overflow-hidden">
            {/* Columna Izquierda: Cola de productos */}
            <div className="md:col-span-7 h-full min-h-0">
              <BarcodeQueueList
                items={items}
                previewIndex={previewIndex}
                onSelectPreview={setPreviewIndex}
                onQuantityChange={handleQuantityChange}
                onSetQuantity={handleSetQuantity}
                onRemoveItem={handleRemoveItem}
                onSetAllQuantities={handleSetAllQuantities}
              />
            </div>

            {/* Columna Derecha: Configuración y Vista previa */}
            <div className="md:col-span-5 h-full min-h-0">
              <BarcodePreviewPanel
                storeName={storeName}
                onStoreNameChange={setStoreName}
                activeItem={activePreviewItem}
                widthMm={config.widthMm}
                heightMm={config.heightMm}
                onSelectDimensions={handleSelectDimensions}
              />
            </div>
          </div>

          {/* Footer con totales y botones de acción claros */}
          <div className="pt-4 border-t border-border flex items-center justify-between shrink-0">
            <div className="text-xs text-muted-foreground">
              Total a imprimir: <strong className="text-foreground font-mono font-bold">{totalLabelsCount}</strong> etiqueta(s)
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onClose} className="text-xs h-9 cursor-pointer">
                Cancelar
              </Button>

              {/* Opción Avanzada: Puerto Serie COM */}
              {isPrinterConfigured ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  disabled={items.length === 0 || isDirectPrinting}
                  className="text-xs h-9 gap-1.5 font-semibold border-amber-500/40 text-amber-500 hover:bg-amber-500/10 cursor-pointer"
                  title="Impresión directa por puerto serie COM"
                >
                  <Zap className={`w-3.5 h-3.5 ${isDirectPrinting ? 'animate-pulse' : ''}`} />
                  <span>{isDirectPrinting ? 'Enviando...' : 'Envío Directo Serial (COM)'}</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConfigModal(true)}
                  className="text-xs h-9 gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Configurar puerto serie para impresoras con conexión COM"
                >
                  <Zap className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Modo Puerto Serie (COM)</span>
                </Button>
              )}

              {/* Botón Principal Recomendado: Impresión estándar Windows / Zebra */}
              <Button
                type="button"
                size="sm"
                onClick={handleBrowserFallbackPrint}
                disabled={items.length === 0}
                className="text-xs h-9 gap-2 font-bold shadow-md shadow-primary/20 cursor-pointer"
                title="Imprime a 203 DPI usando el controlador oficial de Windows (ZDesigner, etc.)"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir en Windows / Zebra</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de configuración de la impresora de etiquetas */}
      <LabelPrinterConfigModal
        isOpen={showConfigModal}
        onClose={() => {
          setShowConfigModal(false);
          setConfig(labelPrinterService.getConfig());
        }}
        onConfigured={() => {
          setIsPrinterConfigured(true);
          setConfig(labelPrinterService.getConfig());
        }}
      />

      {/* Salida oculta para impresión física vía navegador */}
      <ThermalPrintOutput items={items} storeName={storeName} />
    </>
  );
};
export default BarcodePrintModal;

