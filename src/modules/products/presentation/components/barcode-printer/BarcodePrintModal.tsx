import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Barcode, Loader2, Monitor, Printer, Settings2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTenant } from '@/modules/auth/presentation/hooks/useSession';
import { deviceErrorMessage, isNoPrinterConfigured } from '@/modules/printing/domain/rules/device-error';
import { buildSheets, codesPerLabel, countLabels } from '@/modules/printing/domain/rules/label-sheets';
import { printLabelsWithSystemDriver } from '@/modules/printing/infrastructure/labels/label-browser-print';
import { labelPrinterService } from '@/modules/printing/infrastructure/printers/label-printer.service';
import { useLabelPrinter } from '@/modules/printing/presentation/hooks/useLabelPrinter';
import { useTicketFormat } from '@/modules/printing/presentation/hooks/useTicketFormat';
import { BarcodePreviewPanel } from './BarcodePreviewPanel';
import { BarcodeQueueList } from './BarcodeQueueList';
import { LabelPrinterConfigModal } from './LabelPrinterConfigModal';
import type { BarcodeLabelItem } from './types';

export type { BarcodeLabelItem } from './types';

interface BarcodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: BarcodeLabelItem[];
  onUpdateItems: (items: BarcodeLabelItem[]) => void;
}

/** Imprime etiquetas adhesivas con código de barras: cola, vista de cómo saldrán y envío a la impresora. */
export const BarcodePrintModal: React.FC<BarcodePrintModalProps> = ({ isOpen, onClose, items, onUpdateItems }) => {
  const tenant = useTenant();
  const ticketFormat = useTicketFormat();
  const printer = useLabelPrinter(isOpen);
  const [storeName, setStoreName] = useState(tenant?.name ? tenant.name.toUpperCase() : 'MI TIENDA');
  const [previewIndex, setPreviewIndex] = useState(0);
  const [showConfig, setShowConfig] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [progress, setProgress] = useState<{ sent: number; total: number } | null>(null);
  const [isStopping, setIsStopping] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen) setPreviewIndex(0);
  }, [isOpen]);

  const totalCodes = useMemo(() => items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0), [items]);
  const activeItem = items[Math.min(previewIndex, Math.max(0, items.length - 1))];
  const perLabel = codesPerLabel(printer.config);
  const sheets = useMemo(() => buildSheets(items, perLabel), [items, perLabel]);
  // Se prefiere la etiqueta que empieza por el producto elegido; si solo comparte mitad con otro, esa
  const activeSheet = sheets.find((sheet) => sheet.items[0]?.sku === activeItem?.sku) ?? sheets.find((sheet) => sheet.items.some((item) => item.sku === activeItem?.sku));
  const labelCount = countLabels(sheets);
  const labelWord = labelCount === 1 ? 'etiqueta' : 'etiquetas';

  const setQuantity = (sku: string, quantity: number) => onUpdateItems(items.map((item) => (item.sku === sku ? { ...item, quantity: Math.max(1, Number.isNaN(quantity) ? 1 : quantity) } : item)));
  const changeQuantity = (sku: string, delta: number) => onUpdateItems(items.map((item) => (item.sku === sku ? { ...item, quantity: Math.max(1, (item.quantity || 1) + delta) } : item)));
  const removeItem = (sku: string) => {
    const next = items.filter((item) => item.sku !== sku);
    onUpdateItems(next);
    setPreviewIndex((current) => Math.min(current, Math.max(0, next.length - 1)));
  };
  const setAllQuantities = (quantity: number) => onUpdateItems(items.map((item) => ({ ...item, quantity })));

  const printDirect = async () => {
    const abort = new AbortController();
    abortRef.current = abort;
    setIsPrinting(true);
    setIsStopping(false);
    setProgress({ sent: 0, total: labelCount });
    try {
      const { sent, total, cancelled } = await labelPrinterService.printLabels(items, storeName, ticketFormat, { signal: abort.signal, onProgress: (done, of) => setProgress({ sent: done, total: of }) });
      if (cancelled) toast.info(`Envío detenido: se enviaron ${sent} de ${total}. Revisa cuántas salieron antes de imprimir las que faltan.`, { duration: 10000 });
      else toast.success(`${total} ${total === 1 ? 'etiqueta enviada' : 'etiquetas enviadas'} a la impresora.`);
    } catch (err) {
      if (isNoPrinterConfigured(err)) {
        setShowConfig(true);
        toast.info('Conecta tu impresora para imprimir directo.');
      } else {
        toast.error(`No se pudo imprimir: ${deviceErrorMessage(err, 'revisa que la impresora esté encendida y conectada')}`, { duration: 10000 });
      }
    } finally {
      setIsPrinting(false);
      setProgress(null);
    }
  };

  const stopPrinting = () => {
    setIsStopping(true);
    abortRef.current?.abort();
  };

  const printWithSystem = () => printLabelsWithSystemDriver(items, storeName, ticketFormat, printer.spec, printer.config);

  return (
    <>
      {/* Mientras envía no se cierra sin querer: primero se detiene el envío */}
      <Dialog open={isOpen} onOpenChange={(open) => !open && !isPrinting && onClose()}>
        <DialogContent className="flex h-[88vh] max-h-[760px] w-[calc(100vw-2rem)] max-w-5xl! flex-col gap-0 overflow-hidden rounded-2xl border border-border bg-card p-6 text-foreground shadow-2xl sm:max-w-5xl!">
          <DialogHeader className="shrink-0 border-b border-border pb-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="shrink-0 rounded-xl border border-primary/20 bg-primary/10 p-2.5 text-primary">
                  <Barcode className="size-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-semibold">Imprimir etiquetas</DialogTitle>
                  <DialogDescription className="mt-0.5 text-xs text-muted-foreground">Revisa cómo quedará, elige cuántas de cada una e imprime en tu impresora de etiquetas adhesivas.</DialogDescription>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold sm:inline-flex ${printer.connected ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700' : 'border-amber-500/30 bg-amber-500/10 text-amber-700'}`}>
                  <span className={`size-1.5 rounded-full ${printer.connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {printer.connected ? 'Impresora conectada' : 'Impresora sin conectar'}
                </span>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowConfig(true)} title="Tamaño de etiqueta y conexión de la impresora">
                  <Settings2 />
                  Mi impresora
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 overflow-hidden py-4 md:grid-cols-12">
            <div className="h-full min-h-0 md:col-span-7">
              <BarcodeQueueList items={items} previewIndex={previewIndex} onSelectPreview={setPreviewIndex} onQuantityChange={changeQuantity} onSetQuantity={setQuantity} onRemoveItem={removeItem} onSetAllQuantities={setAllQuantities} />
            </div>
            <div className="h-full min-h-0 overflow-y-auto md:col-span-5">
              <BarcodePreviewPanel printer={printer} storeName={storeName} onStoreNameChange={setStoreName} activeItem={activeItem} activeSheet={activeSheet} onMoreSizes={() => setShowConfig(true)} />
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              Total: {perLabel === 2 && <><strong className="font-mono text-sm text-foreground">{totalCodes}</strong> códigos en </>}
              <strong className="font-mono text-sm text-foreground">{labelCount}</strong> {labelWord}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {isPrinting ? (
                <Button variant="ghost" size="sm" onClick={stopPrinting} disabled={isStopping}>{isStopping ? 'Deteniendo…' : 'Detener envío'}</Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={onClose}>Cancelar</Button>
              )}
              <Button type="button" variant="outline" size="sm" onClick={printWithSystem} disabled={items.length === 0 || isPrinting} title="Abre la ventana de impresión del sistema: sirve con cualquier impresora instalada">
                <Monitor />
                Imprimir con el controlador del sistema
              </Button>
              {printer.connected ? (
                <Button type="button" size="sm" onClick={printDirect} disabled={items.length === 0 || isPrinting}>
                  {isPrinting ? <Loader2 className="animate-spin" /> : <Printer />}
                  {isPrinting ? `Enviando ${progress?.sent ?? 0} de ${progress?.total ?? labelCount}…` : `Imprimir ${labelCount} ${labelWord}`}
                </Button>
              ) : (
                <Button type="button" size="sm" onClick={() => setShowConfig(true)}>
                  <Zap />
                  Conectar impresora
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <LabelPrinterConfigModal
        isOpen={showConfig}
        onClose={() => {
          setShowConfig(false);
          void printer.refresh();
        }}
        printer={printer}
        storeName={storeName}
      />
    </>
  );
};

export default BarcodePrintModal;
