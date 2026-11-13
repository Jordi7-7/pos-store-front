import { useTicketFormat } from '../hooks/useTicketFormat';
import React, { useMemo, useState, useEffect } from 'react';
import { Printer, Download, RefreshCw, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useTenant } from '@/modules/auth/presentation/hooks/useSession';
import { layoutOf, thermalPrinterService } from '../../infrastructure/printers/thermal-printer.service';
import { buildSaleReceiptBytes } from '../../infrastructure/escpos/escpos-builder';
import { parseEscPosBytes } from '../../infrastructure/escpos/escpos-parser';
import {
  renderEscPosToDataUrl,
  downloadEscPosImage,
  printImageViaIframe,
} from '../../infrastructure/escpos/escpos-image';
import type { TicketSaleData } from '../../domain/entities/ticket';
import { deviceErrorMessage } from '../../domain/rules/device-error';
export type { TicketSaleData, TicketSaleItem } from '../../domain/entities/ticket';

export interface ThermalTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleData: TicketSaleData | null;
  tenantRuc?: string;
}

export const ThermalTicketModal: React.FC<ThermalTicketModalProps> = ({
  isOpen,
  onClose,
  saleData,
  tenantRuc,
}) => {
  const publicTenant = useTenant();
  const [isPrinting, setIsPrinting] = useState(false);
  const [viewMode, setViewMode] = useState<'paper' | 'image'>('paper');
  const [isUsbConfigured, setIsUsbConfigured] = useState<boolean | null>(null);
  const [isConnectingUsb, setIsConnectingUsb] = useState(false);

  useEffect(() => {
    if (isOpen) {
      thermalPrinterService.isConfigured().then(setIsUsbConfigured);
    }
  }, [isOpen]);

  const handleConnectUsb = async () => {
    try {
      setIsConnectingUsb(true);
      const connected = await thermalPrinterService.requestPort();
      if (connected) {
        setIsUsbConfigured(true);
        toast.success('¡Impresora térmica USB vinculada con éxito!');
      }
    } catch (err) {
      toast.error(deviceErrorMessage(err, 'Error al vincular impresora USB.'));
    } finally {
      setIsConnectingUsb(false);
    }
  };

  const config = useMemo(() => thermalPrinterService.getConfig(), [isOpen]);
  const format = useTicketFormat();
  const effectiveRuc = tenantRuc || publicTenant?.ruc || '';

  // 1. Única Fuente de la Verdad: Generación de bytes ESC/POS
  const receiptBytes = useMemo(() => {
    if (!saleData) return new Uint8Array();
    return buildSaleReceiptBytes(saleData, {
      ...layoutOf(config),
      openDrawer: config.openDrawer,
      cutPaper: config.cutPaper,
      tenantRuc: effectiveRuc,
      format,
    });
  }, [saleData, config, effectiveRuc, format]);

  // 2. Decodificación de líneas exactas
  const parseResult = useMemo(() => {
    return parseEscPosBytes(receiptBytes, config.paperWidth, layoutOf(config).columns);
  }, [receiptBytes, config]);

  // 3. Renderizado de imagen PNG de alta resolución
  const pngDataUrl = useMemo(() => {
    if (!saleData || receiptBytes.length === 0) return '';
    try {
      return renderEscPosToDataUrl(parseResult);
    } catch {
      return '';
    }
  }, [parseResult, saleData, receiptBytes.length]);

  if (!saleData) return null;

  // Imprimir: USB directo o fallback de navegador con imagen
  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      const isConfigured = await thermalPrinterService.isConfigured();

      if (isConfigured) {
        await thermalPrinterService.printSaleTicket(saleData, {
          tenantRuc: effectiveRuc,
          format,
        });
        toast.success('¡Ticket impreso directamente por USB!');
        onClose();
        return;
      }

      // Fallback: Diálogo de impresión del navegador imprimiendo la imagen limpia
      printImageViaIframe(pngDataUrl, `Ticket-${saleData.invoiceNumber}`, config.paperWidth);
      onClose();
    } catch (err) {
      console.error('Error al imprimir ticket:', err);
      printImageViaIframe(pngDataUrl, `Ticket-${saleData.invoiceNumber}`, config.paperWidth);
      onClose();
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownloadPng = () => {
    downloadEscPosImage(parseResult, `ticket-${saleData.invoiceNumber}`);
    toast.success('Imagen PNG descargada para WhatsApp');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[95vh] flex flex-col bg-bg-card border border-border-card p-6 overflow-hidden">
        <DialogHeader className="shrink-0 pb-3 border-b border-border-card">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold text-secondary flex items-center gap-2">
              <Printer className="w-4 h-4 text-primary" />
              <span>Ticket de Venta</span>
              <span className="text-xs font-mono text-neutral font-normal">
                {saleData.invoiceNumber}
              </span>
            </DialogTitle>

            {/* Alternar vista Papel / Imagen */}
            <div className="inline-flex rounded-lg bg-bg-dark p-0.5 border border-border-card text-xs">
              <button
                type="button"
                onClick={() => setViewMode('paper')}
                className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                  viewMode === 'paper' ? 'bg-card text-primary' : 'text-neutral hover:text-secondary'
                }`}
              >
                Papel
              </button>
              <button
                type="button"
                onClick={() => setViewMode('image')}
                className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                  viewMode === 'image' ? 'bg-card text-primary' : 'text-neutral hover:text-secondary'
                }`}
              >
                Imagen PNG
              </button>
            </div>
          </div>
          <DialogDescription className="text-xs text-neutral">
            Formato: <strong>{config.paperWidth}</strong> ({parseResult.maxCols} columnas)
          </DialogDescription>
        </DialogHeader>

        {/* Alerta contextual si la impresora no está vinculada en este navegador */}
        {isUsbConfigured === false && (
          <div className="flex items-center justify-between p-2.5 px-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-500 shrink-0 my-1">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 shrink-0" />
              <span>Impresora USB no vinculada en este equipo</span>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleConnectUsb}
              disabled={isConnectingUsb}
              className="text-xs h-7 px-2.5 font-bold bg-amber-500 hover:bg-amber-600 text-white cursor-pointer"
            >
              {isConnectingUsb ? 'Conectando...' : 'Vincular USB'}
            </Button>
          </div>
        )}

        {/* Contenedor del Ticket (Generado exclusivamente desde los Bytes ESC/POS) */}
        <div className="flex-1 overflow-y-auto py-3 flex justify-center items-start bg-bg-dark/40 rounded-xl my-2 p-3">
          {viewMode === 'paper' ? (
            <div
              className="bg-white text-black shadow-xl border border-neutral-300 rounded-sm font-mono text-xs leading-[17px] p-5 select-text h-fit shrink-0 my-1 w-fit"
              style={{ fontFamily: '"Courier New", Courier, monospace' }}
            >
              <div className="space-y-0.5">
                {parseResult.lines.map((line, idx) => {
                  if (line.isDrawer) return null; // Pulso de cajón invisible en papel cliente

                  if (line.isCut) {
                    return (
                      <div
                        key={idx}
 className="my-3 border-t border-dashed border-neutral-400 text-center text-xs text-neutral-400 pt-1"
                      >
                        ✂ Corte de Papel
                      </div>
                    );
                  }

                  const alignClass =
                    line.align === 'center'
                      ? 'text-center'
                      : line.align === 'right'
                      ? 'text-right'
                      : 'text-left';

                  const boldClass = line.bold ? 'font-bold' : 'font-normal';
                  const sizeClass = line.doubleHeight ? 'text-sm font-bold' : '';

                  return (
                    <div
                      key={idx}
                      className={`whitespace-pre ${alignClass} ${boldClass} ${sizeClass}`}
                      style={{ minHeight: line.text.trim() === '' ? '12px' : 'auto' }}
                    >
                      {line.align === 'center' ? line.text.trim() : line.text}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-1">
              {pngDataUrl && (
                <img
                  src={pngDataUrl}
                  alt={`Ticket ${saleData.invoiceNumber}`}
                  className={`shadow-2xl rounded border border-neutral-300 bg-white ${
                    config.paperWidth === '80mm' ? 'max-w-[340px]' : 'max-w-[275px]'
                  }`}
                />
              )}
            </div>
          )}
        </div>

        {/* Acciones principales */}
        <div className="shrink-0 pt-3 border-t border-border-card space-y-2">
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-xs font-bold gap-1.5"
            >
              {isPrinting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
              <span>Imprimir Ticket</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadPng}
              className="flex-1 border-border-card hover:border-primary/50 text-secondary hover:text-white h-9 text-xs font-semibold gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              <span>Guardar Imagen PNG</span>
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-full h-8 text-xs text-neutral hover:text-secondary"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ThermalTicketModal;
