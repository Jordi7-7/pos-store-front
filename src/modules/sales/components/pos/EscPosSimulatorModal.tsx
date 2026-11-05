import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Printer,
  Scissors,
  Zap,
  Copy,
  Check,
  FileText,
  Binary,
  AlertTriangle,
  Download,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { parseEscPosBytes } from '../../services/escpos-parser';
import {
  renderEscPosToDataUrl,
  downloadEscPosImage,
} from '../../services/escpos-image';
import {
  buildSaleReceiptBytes,
  buildClosingReceiptBytes,
  EscPosBuilder,
  type PaperWidth,
} from '../../services/escpos-builder';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';
import type { TicketSaleData } from './ThermalTicketModal';

interface EscPosSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Buffer binario opcional; si no se provee, se genera uno de prueba */
  rawBytes?: Uint8Array;
  /** Datos de venta opcionales para generar los bytes en vivo */
  saleData?: TicketSaleData | null;
  /** Datos de cierre de caja opcionales para generar los bytes en vivo */
  closingData?: any;
  tenantRuc?: string;
  currencyCode?: string;
  defaultPaperWidth?: PaperWidth;
}

// Datos de venta de ejemplo para simulación
const SAMPLE_SALE_DATA: TicketSaleData = {
  invoiceNumber: 'FAC-001092',
  createdAt: new Date().toLocaleString(),
  branchName: 'Aura Store Centro',
  branchAddress: 'Av. Central 450, Col. Comercio',
  clientName: 'Juan Carlos Perez Gomez',
  clientIdentity: '0928374651',
  userName: 'Cajero 1',
  paymentMethod: 'CASH' as any,
  subtotal: 185.0,
  discountAmount: 15.0,
  total: 170.0,
  items: [
    {
      variantSku: 'CAM-BLA-M',
      productName: 'Camiseta de Algodon Premium',
      quantity: 2,
      price: 65.0,
      discountAmount: 10.0,
    },
    {
      variantSku: 'GOR-DEP-NEG',
      productName: 'Gorra Deportiva Ajustable',
      quantity: 1,
      price: 55.0,
      discountAmount: 5.0,
    },
  ],
};

// Datos de cierre de caja de ejemplo para simulación
const SAMPLE_CLOSING_DATA = {
  id: 'c8f49a21-9981-42cb-b1b0-128471923011',
  branchName: 'Aura Store Centro',
  userName: 'Cajero Principal',
  openedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
  closedAt: new Date().toISOString(),
  openingBalance: 100.0,
  salesTotal: 650.0,
  expensesTotal: 40.0,
  refundsTotal: 15.0,
  expectedBalance: 710.0,
  closingBalance: 710.0,
  paymentsBreakdown: {
    EFECTIVO: 380.0,
    TARJETA: 270.0,
  },
  expensesList: [
    { description: 'Pago de limpieza', amount: 25.0, createdAt: new Date().toISOString() },
    { description: 'Compra de bolsas', amount: 15.0, createdAt: new Date().toISOString() },
  ],
  salesList: [
    { invoiceNumber: '001-001-000000683', createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(), total: 380.0, paymentMethods: ['EFECTIVO'] },
    { invoiceNumber: '001-001-000000682', createdAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(), total: 270.0, paymentMethods: ['TARJETA'] },
  ],
};

export const EscPosSimulatorModal: React.FC<EscPosSimulatorModalProps> = ({
  isOpen,
  onClose,
  rawBytes: externalBytes,
  saleData,
  closingData,
  tenantRuc,
  currencyCode,
  defaultPaperWidth = '58mm',
}) => {
  const { publicTenant } = useAuthStore();
  const effectiveCurrency = currencyCode || publicTenant?.currencyCode || 'MXN';
  const effectiveRuc = tenantRuc || publicTenant?.ruc || '';

  const [paperWidth, setPaperWidth] = useState<PaperWidth>(defaultPaperWidth);
  const [activeTab, setActiveTab] = useState<'paper' | 'image' | 'hex'>('paper');
  const [copied, setCopied] = useState(false);
  const [sampleMode, setSampleMode] = useState<'sale' | 'closing' | 'test'>(
    closingData ? 'closing' : 'sale'
  );

  // Genera o utiliza el buffer de bytes real
  const currentBytes = useMemo(() => {
    if (externalBytes && externalBytes.length > 0) {
      return externalBytes;
    }

    if (sampleMode === 'test') {
      const builder = new EscPosBuilder(paperWidth);
      builder.openCashDrawer();
      builder
        .align('center')
        .bold(true)
        .line('================================')
        .line('PRUEBA DE CONEXION POS')
        .line('================================')
        .bold(false)
        .line(`Fecha: ${new Date().toLocaleDateString()}`)
        .line(`Formato: ${paperWidth} (${paperWidth === '80mm' ? 42 : 32} columnas)`)
        .line('Cajon: Activado | Corte: Activado')
        .line('')
        .bold(true)
        .line('!IMPRESION DIRECTA EXITOSA!')
        .line('================================')
        .cut();
      return builder.encode();
    }

    if (sampleMode === 'closing') {
      const dataToUse = closingData || SAMPLE_CLOSING_DATA;
      return buildClosingReceiptBytes(dataToUse, {
        paperWidth,
        openDrawer: true,
        cutPaper: true,
      });
    }

    const dataToUse = saleData || SAMPLE_SALE_DATA;
    return buildSaleReceiptBytes(dataToUse, {
      paperWidth,
      openDrawer: true,
      cutPaper: true,
      tenantRuc: effectiveRuc,
      currencyCode: effectiveCurrency,
    });
  }, [externalBytes, saleData, closingData, effectiveRuc, effectiveCurrency, paperWidth, sampleMode]);

  // Decodificar los bytes con el parser
  const parseResult = useMemo(() => {
    return parseEscPosBytes(currentBytes, paperWidth);
  }, [currentBytes, paperWidth]);

  const handleCopyHex = async () => {
    await navigator.clipboard.writeText(parseResult.hexDump);
    setCopied(true);
    toast.success('Bytes hexadecimales copiados al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  const hasOverflows = parseResult.lines.some((l) => l.isOverflow);

  // Crear regla de columnas 1..32 o 1..42
  const columnRuler = useMemo(() => {
    let ruler = '';
    for (let c = 1; c <= parseResult.maxCols; c++) {
      ruler += c % 10 === 0 ? Math.floor(c / 10).toString() : '.';
    }
    return ruler;
  }, [parseResult.maxCols]);

  // Generar imagen PNG del ticket en memoria
  const pngDataUrl = useMemo(() => {
    try {
      return renderEscPosToDataUrl(parseResult);
    } catch {
      return '';
    }
  }, [parseResult]);

  const handleDownloadImage = () => {
    const filename = sampleMode === 'closing' ? 'ticket-cierre-caja' : 'ticket-venta';
    downloadEscPosImage(parseResult, filename);
    toast.success('Imagen PNG del ticket descargada con éxito');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[92vh] flex flex-col bg-bg-card border border-border-card p-6 overflow-hidden">
        <DialogHeader className="shrink-0 pb-3 border-b border-border-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-secondary flex items-center gap-2">
                  <span>Simulador de Salida ESC/POS</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-normal">
                    {parseResult.totalChars} bytes
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-neutral">
                  Visualización exacta de la cuadrícula monospaciada que recibe el cabezal térmico.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Barra de Controles y Filtros */}
          <div className="flex items-center justify-between gap-2 pt-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-neutral font-medium">Ancho:</span>
              <div className="inline-flex rounded-lg bg-bg-dark p-0.5 border border-border-card">
                <button
                  type="button"
                  onClick={() => setPaperWidth('58mm')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    paperWidth === '58mm'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-neutral hover:text-secondary'
                  }`}
                >
                  58mm (32 cols)
                </button>
                <button
                  type="button"
                  onClick={() => setPaperWidth('80mm')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    paperWidth === '80mm'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-neutral hover:text-secondary'
                  }`}
                >
                  80mm (42 cols)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {!externalBytes && (
                <div className="inline-flex rounded-lg bg-bg-dark p-0.5 border border-border-card">
                  <button
                    type="button"
                    onClick={() => setSampleMode('sale')}
                    className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                      sampleMode === 'sale'
                        ? 'bg-card text-secondary shadow-sm'
                        : 'text-neutral hover:text-secondary'
                    }`}
                  >
                    Venta
                  </button>
                  <button
                    type="button"
                    onClick={() => setSampleMode('closing')}
                    className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                      sampleMode === 'closing'
                        ? 'bg-card text-secondary shadow-sm'
                        : 'text-neutral hover:text-secondary'
                    }`}
                  >
                    Cierre
                  </button>
                  <button
                    type="button"
                    onClick={() => setSampleMode('test')}
                    className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                      sampleMode === 'test'
                        ? 'bg-card text-secondary shadow-sm'
                        : 'text-neutral hover:text-secondary'
                    }`}
                  >
                    Prueba
                  </button>
                </div>
              )}

              <div className="inline-flex rounded-lg bg-bg-dark p-0.5 border border-border-card">
                <button
                  type="button"
                  onClick={() => setActiveTab('paper')}
                  className={`p-1.5 rounded-md transition-all ${
                    activeTab === 'paper' ? 'bg-card text-primary' : 'text-neutral hover:text-secondary'
                  }`}
                  title="Vista Papel Térmico"
                >
                  <FileText className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('image')}
                  className={`p-1.5 rounded-md transition-all ${
                    activeTab === 'image' ? 'bg-card text-primary' : 'text-neutral hover:text-secondary'
                  }`}
                  title="Vista Imagen PNG (WhatsApp)"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('hex')}
                  className={`p-1.5 rounded-md transition-all ${
                    activeTab === 'hex' ? 'bg-card text-primary' : 'text-neutral hover:text-secondary'
                  }`}
                  title="Inspector de Bytes (Hex)"
                >
                  <Binary className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {hasOverflows && (
            <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-500 text-[11px] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>
                Atención: Algunas líneas superan las {parseResult.maxCols} columnas y se desbordarán en papel real.
              </span>
            </div>
          )}
        </DialogHeader>

        {/* Contenedor Principal Scrolleable */}
        <div className="flex-1 overflow-y-auto py-4 flex justify-center bg-bg-dark/50 rounded-xl my-2 p-2">
          {activeTab === 'paper' ? (
            /* Papel Térmico Virtual */
            <div
              className="bg-[#fdfcf7] text-neutral-900 shadow-2xl border border-neutral-300 rounded-sm font-mono text-[11.5px] leading-[18px] p-5 select-text transition-all w-fit h-fit shrink-0 my-1"
              style={{
                boxShadow: '0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
                fontFamily: '"Courier New", Courier, monospace',
              }}
            >
              {/* Regla de columnas superior */}
              <div
                className="pb-2 mb-2 border-b border-dashed border-neutral-300 text-[9px] text-neutral-400 select-none tracking-widest overflow-hidden whitespace-nowrap"
                title={`Guía de ancho de papel (${parseResult.maxCols} caracteres)`}
              >
                {columnRuler}
              </div>

              {/* Render de líneas procesadas por el cabezal térmico */}
              <div className="space-y-0.5">
                {parseResult.lines.map((line, idx) => {
                  if (line.isDrawer) {
                    return (
                      <div
                        key={idx}
                        className="my-1.5 py-1 px-2 rounded bg-amber-100 border border-amber-300 text-amber-900 text-[10px] flex items-center justify-center gap-1.5 font-bold"
                      >
                        <Zap className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>[ORDEN DE APERTURA DE CAJON]</span>
                      </div>
                    );
                  }

                  if (line.isCut) {
                    return (
                      <div
                        key={idx}
                        className="my-3 py-1 border-t-2 border-b-2 border-dashed border-neutral-400 text-neutral-500 text-[10px] flex items-center justify-center gap-2 tracking-widest uppercase font-bold"
                      >
                        <Scissors className="w-3.5 h-3.5 shrink-0" />
                        <span>[CORTE DE PAPEL]</span>
                      </div>
                    );
                  }

                  const alignClass =
                    line.align === 'center'
                      ? 'text-center'
                      : line.align === 'right'
                      ? 'text-right'
                      : 'text-left';

                  const boldClass = line.bold ? 'font-bold text-black' : 'font-normal text-neutral-800';

                  const sizeClass =
                    line.doubleWidth && line.doubleHeight
                      ? 'text-base font-extrabold tracking-wide'
                      : line.doubleHeight
                      ? 'text-sm font-bold'
                      : '';

                  return (
                    <div
                      key={idx}
                      className={`whitespace-pre tracking-normal ${alignClass} ${boldClass} ${sizeClass} ${
                        line.isOverflow ? 'bg-red-50 text-red-900 border-l-2 border-red-500 pl-1' : ''
                      }`}
                      style={{
                        minHeight: line.text.trim() === '' ? '14px' : 'auto',
                      }}
                    >
                      {line.text}
                    </div>
                  );
                })}
              </div>

              {/* Diente de sierra / corte inferior simulado */}
              <div className="mt-6 pt-3 border-t border-dashed border-neutral-300 text-center text-[9px] text-neutral-400 uppercase tracking-widest">
                Fin del Rollo Térmico
              </div>
            </div>
          ) : activeTab === 'image' ? (
            /* Vista Imagen Renderizada PNG */
            <div className="flex flex-col items-center gap-3 py-2 w-full">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadImage}
                  className="h-7 text-xs gap-1.5 bg-bg-card border-border-card text-secondary hover:text-white"
                >
                  <Download className="w-3.5 h-3.5 text-primary" />
                  <span>Descargar Archivo PNG</span>
                </Button>
              </div>
              {pngDataUrl ? (
                <img
                  src={pngDataUrl}
                  alt="Ticket Renderizado en PNG"
                  className={`shadow-2xl rounded border border-neutral-300 bg-white select-all ${
                    paperWidth === '80mm' ? 'max-w-[360px]' : 'max-w-[285px]'
                  }`}
                />
              ) : (
                <div className="text-xs text-neutral">Generando imagen...</div>
              )}
            </div>
          ) : (
            /* Inspector Hexadecimal de Bytes */
            <div className="w-full bg-black/90 text-emerald-400 font-mono text-[11px] p-4 rounded-lg overflow-x-auto leading-relaxed border border-border-card select-all">
              <div className="flex justify-between items-center pb-2 mb-2 border-b border-neutral-800 text-neutral-400 text-[10px]">
                <span>Volcado Hexadecimal ({parseResult.totalChars} bytes)</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyHex}
                  className="h-6 text-[10px] gap-1 bg-neutral-900 border-neutral-700 text-neutral-200 hover:text-white"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copiado' : 'Copiar Hex'}
                </Button>
              </div>
              <div className="break-all tracking-wider font-mono">
                {parseResult.hexDump}
              </div>
            </div>
          )}
        </div>

        {/* Footer del Modal */}
        <div className="shrink-0 pt-3 border-t border-border-card flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadImage}
              className="h-8 text-xs gap-1.5 font-medium border-border-card hover:border-primary/50 text-secondary hover:text-white"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              <span>Guardar Imagen PNG</span>
            </Button>
          </div>
          <Button
            size="sm"
            onClick={onClose}
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs font-semibold px-4"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
