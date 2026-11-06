import type { ClosingTicketData } from '../../domain/entities/ticket';
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
import { thermalPrinterService } from '../../infrastructure/printers/thermal-printer.service';
import { buildClosingReceiptBytes } from '../../infrastructure/escpos/escpos-builder';
import { parseEscPosBytes } from '../../infrastructure/escpos/escpos-parser';
import {
  renderEscPosToDataUrl,
  downloadEscPosImage,
  printImageViaIframe,
} from '../../infrastructure/escpos/escpos-image';

export interface ThermalClosingTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionData: ClosingTicketData | null;
  tenantRuc?: string;
  tenantName?: string;
}

export const ThermalClosingTicketModal: React.FC<ThermalClosingTicketModalProps> = ({
  isOpen,
  onClose,
  sessionData,
  tenantRuc,
  tenantName,
}) => {
  const publicTenant = useTenant();
  const format = useTicketFormat();
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
    } catch (err: any) {
      toast.error(err.message || 'Error al vincular impresora USB.');
    } finally {
      setIsConnectingUsb(false);
    }
  };

  const config = useMemo(() => thermalPrinterService.getConfig(), [isOpen]);

  // 1. Única Fuente de la Verdad: Generación de bytes ESC/POS de Cierre
  const receiptBytes = useMemo(() => {
    if (!sessionData) return new Uint8Array();
    return buildClosingReceiptBytes(sessionData, {
      paperWidth: config.paperWidth,
      openDrawer: config.openDrawer,
      cutPaper: config.cutPaper,
      tenantName: tenantName || publicTenant?.name,
      tenantRuc: tenantRuc || publicTenant?.ruc,
      format,
    });
  }, [sessionData, config, tenantName, tenantRuc, publicTenant, format]);

  // 2. Decodificación de líneas exactas
  const parseResult = useMemo(() => {
    return parseEscPosBytes(receiptBytes, config.paperWidth);
  }, [receiptBytes, config.paperWidth]);

  // 3. Renderizado de imagen PNG de alta resolución
  const pngDataUrl = useMemo(() => {
    if (!sessionData || receiptBytes.length === 0) return '';
    try {
      return renderEscPosToDataUrl(parseResult);
    } catch {
      return '';
    }
  }, [parseResult, sessionData, receiptBytes.length]);

  if (!sessionData) return null;

  const isSessionClosed = sessionData.isClosed || !!sessionData.closedAt;

  // Imprimir: USB directo o fallback de navegador con imagen limpia
  const handlePrint = async () => {
    try {
      setIsPrinting(true);
      const isConfigured = await thermalPrinterService.isConfigured();

      if (isConfigured) {
        await thermalPrinterService.printClosingTicket(sessionData, format);
        toast.success('¡Corte de caja impreso directamente por USB!');
        onClose();
        return;
      }

      // Fallback: Diálogo del navegador con imagen limpia
      printImageViaIframe(pngDataUrl, `Corte-Caja-${sessionData.id.slice(0, 8)}`);
      onClose();
    } catch (err: any) {
      console.error('Error al imprimir corte de caja:', err);
      printImageViaIframe(pngDataUrl, `Corte-Caja-${sessionData.id.slice(0, 8)}`);
      onClose();
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownloadPng = () => {
    downloadEscPosImage(parseResult, `corte-caja-${sessionData.id.slice(0, 8)}`);
    toast.success('Imagen PNG del corte descargada para WhatsApp');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[95vh] flex flex-col bg-bg-card border border-border-card p-6 overflow-hidden">
        <DialogHeader className="shrink-0 pb-3 border-b border-border-card">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm font-bold text-secondary flex items-center gap-2">
              <Printer className="w-4 h-4 text-primary" />
              <span>{isSessionClosed ? 'Ticket de Cierre de Caja' : 'Corte Parcial / Arqueo'}</span>
              <span className="text-xs font-mono text-neutral font-normal">
                #{sessionData.id.slice(0, 8)}
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
            Formato: <strong>{config.paperWidth}</strong> ({config.paperWidth === '80mm' ? '42 columnas' : '32 columnas'})
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
              className="text-[11px] h-7 px-2.5 font-bold bg-amber-500 hover:bg-amber-600 text-white cursor-pointer"
            >
              {isConnectingUsb ? 'Conectando...' : 'Vincular USB'}
            </Button>
          </div>
        )}

        {/* Contenedor del Ticket de Cierre (Generado exclusivamente desde los Bytes ESC/POS) */}
        <div className="flex-1 overflow-y-auto py-3 flex justify-center items-start bg-bg-dark/40 rounded-xl my-2 p-3">
          {viewMode === 'paper' ? (
            <div
              className="bg-white text-black shadow-xl border border-neutral-300 rounded-sm font-mono text-[11px] leading-[17px] p-5 select-text h-fit shrink-0 my-1 w-fit"
              style={{ fontFamily: '"Courier New", Courier, monospace' }}
            >
              <div className="space-y-0.5">
                {parseResult.lines.map((line, idx) => {
                  if (line.isDrawer) return null;

                  if (line.isCut) {
                    return (
                      <div
                        key={idx}
                        className="my-3 border-t border-dashed border-neutral-400 text-center text-[9px] text-neutral-400 uppercase tracking-widest pt-1"
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
                  alt={`Cierre de caja ${sessionData.id}`}
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
              <span>Imprimir Corte</span>
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

export default ThermalClosingTicketModal;
