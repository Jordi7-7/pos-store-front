import React, { useState, useRef } from 'react';
import { downloadPurchasesTemplate } from '@/lib/excelTemplates';
import { BulkImportPreviewTable } from '@/components/BulkImportPreviewTable';
import { useSuppliers, usePurchaseImport } from '../hooks';
import type { Supplier, BulkPurchaseItemInput } from '../types';
import { useLayoutContext } from '@/providers/LayoutContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from '@/components/ui/combobox';
import { toast } from 'sonner';
import { FileDown, Upload, FileSpreadsheet, Loader2, RefreshCw, AlertTriangle, ArrowRight, CheckCircle2, Building, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

const MAX_BULK_PURCHASE_ROWS = 3000;

interface BulkPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BulkPurchaseModal: React.FC<BulkPurchaseModalProps> = ({ isOpen, onClose }) => {
  const { selectedBranchId, selectedBranchName } = useLayoutContext();
  const { suppliers = [] } = useSuppliers();

  // States
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [parsedData, setParsedData] = useState<BulkPurchaseItemInput[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set default generic supplier
  React.useEffect(() => {
    if (!selectedSupplierId && suppliers.length > 0) {
      const generic = suppliers.find(
        (s: Supplier) =>
          s.identityNumber?.toUpperCase() === 'GENERICO' ||
          s.name?.toUpperCase().includes('GENERICO')
      );
      if (generic) {
        setSelectedSupplierId(generic.id);
      } else {
        setSelectedSupplierId(suppliers[0].id);
      }
    }
  }, [suppliers, selectedSupplierId]);

  // Hook for bulk purchases import
  const {
    validateImport,
    importPurchases,
    isImporting,
    resetValidation,
  } = usePurchaseImport({
    onImportSuccess: () => {
      toast.success('¡Ingreso masivo registrado con éxito en Kardex y stock actualizado!');
      handleReset();
      onClose();
    },
    onImportError: (err) => {
      toast.error(err.message || 'Error al procesar la carga masiva.');
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedBranchId) {
      toast.warning('Por favor selecciona una sucursal destino antes de subir el archivo.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setFileName(file.name);
    setIsValidating(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        // Read headers to validate template strictly
        const range = XLSX.utils.decode_range(ws['!ref'] || '');
        const fileHeaders: string[] = [];
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell = ws[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
          if (cell && cell.t) {
            fileHeaders.push(String(cell.v).trim().toLowerCase());
          }
        }

        const required = ['sku', 'cantidad'];
        const forbidden = ['nombre', 'precio compra', 'precio venta', 'existencias', 'codigo'];

        const hasForbidden = fileHeaders.some(h => forbidden.includes(h));
        const hasAllRequired = required.every(req => fileHeaders.includes(req));

        if (hasForbidden || !hasAllRequired) {
          toast.error('Plantilla incorrecta. Para el ingreso de existencias usa la plantilla correcta que tiene únicamente las columnas: SKU y Cantidad.');
          setIsValidating(false);
          setFileName('');
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        const rawJson: any[] = XLSX.utils.sheet_to_json(ws);

        // Normalize data
        const normalized = rawJson.map((row) => ({
          sku: String(row.SKU || row.sku || '').trim(),
          quantity: Number(row.Cantidad || row.cantidad || 0),
        })).filter((item) => item.sku);

        if (normalized.length === 0) {
          toast.error('El archivo Excel no tiene registros válidos o está vacío.');
          setIsValidating(false);
          return;
        }

        setParsedData(normalized);

        // Pre-check row limit client-side
        if (normalized.length > MAX_BULK_PURCHASE_ROWS) {
          const limitMsg = `El archivo contiene ${normalized.length} filas. El límite máximo permitido por importación es de ${MAX_BULK_PURCHASE_ROWS.toLocaleString()} registros.`;
          setGlobalError(limitMsg);
          setIsValidated(false);
          setIsValidating(false);
          toast.error(limitMsg);
          return;
        }

        setGlobalError(null);
        setIsValidated(false);

        // Validate items against backend
        validateImport(normalized, {
          onSuccess: (data) => {
            const mergedErrors = { ...data.errors };
            for (const item of normalized) {
              if (item.quantity <= 0) {
                mergedErrors[item.sku] = 'La cantidad a ingresar debe ser mayor a 0.';
              }
            }
            setValidationErrors(mergedErrors);
            setProductNames(data.names);
            setIsValidated(true);
            setIsValidating(false);
          },
          onError: (err) => {
            setIsValidating(false);
            setIsValidated(false);
            const msg = err.message || 'Error al validar el archivo de ingresos.';
            setGlobalError(msg);
            toast.error(msg);
          },
        });

      } catch {
        toast.error('Error al parsear el archivo Excel. Revisa las columnas SKU y Cantidad.');
        setIsValidating(false);
        setIsValidated(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleReset = () => {
    setParsedData([]);
    setValidationErrors({});
    setProductNames({});
    setFileName('');
    setInvoiceNumber('');
    setGlobalError(null);
    setIsValidated(false);
    setIsValidating(false);
    resetValidation();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = () => {
    if (parsedData.length === 0 || !selectedBranchId) return;
    importPurchases({
      branchId: selectedBranchId,
      supplierId: selectedSupplierId || undefined,
      items: parsedData,
      invoiceNumber: invoiceNumber.trim() || undefined,
    });
  };

  const errorCount = Object.keys(validationErrors).length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-4xl w-full bg-card border border-border rounded-2xl shadow-2xl p-6 text-foreground">
        <DialogHeader className="border-b border-border pb-3">
          <DialogTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            <span>Ingreso Masivo de Mercancía (Excel)</span>
          </DialogTitle>
        </DialogHeader>

        {parsedData.length === 0 ? (
          /* Step 1: Destination branch, reference/invoice, template and upload */
          <div className="space-y-6 py-4">
            <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wide text-secondary flex items-center gap-1.5">
                <FileDown className="w-4 h-4 text-primary" />
                <span>Descarga la Plantilla de Ingresos</span>
              </h5>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Registra tus compras en lote subiendo un archivo Excel con las columnas: <strong className="text-secondary">SKU</strong> y <strong className="text-secondary">Cantidad</strong>. Los productos deben existir previamente en el catálogo.
              </p>
              <button
                type="button"
                onClick={downloadPurchasesTemplate}
                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-bold border border-primary/20 bg-primary/5 hover:bg-primary/10 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                Descargar Plantilla (.xlsx)
              </button>
            </div>

            {!selectedBranchId && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Para ingresar compras masivas, selecciona una sucursal en la barra superior.</span>
              </div>
            )}

            {/* Inputs: Proveedor Comercial & Nro Factura / Referencia */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                    Proveedor Comercial *
                  </label>
                  {selectedBranchId && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-primary font-semibold bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                      <Building className="w-2.5 h-2.5" />
                      {selectedBranchName}
                    </span>
                  )}
                </div>
                <Combobox
                  value={selectedSupplierId || ''}
                  onValueChange={(val) => setSelectedSupplierId(val || '')}
                >
                  <ComboboxInput
                    placeholder="Buscar o seleccionar proveedor..."
                    className="text-xs shadow-none h-9 bg-muted/40 border-border rounded-xl"
                    showTrigger
                    value={(() => {
                      const s = suppliers.find((sup: Supplier) => sup.id === selectedSupplierId);
                      return s ? `${s.name} (${s.identityNumber})` : '';
                    })()}
                  />
                  <ComboboxContent className="bg-popover border border-border rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                    <ComboboxEmpty className="p-3 text-center text-xs text-muted-foreground">
                      No se encontraron proveedores.
                    </ComboboxEmpty>
                    <ComboboxList className="p-1">
                      {suppliers.map((sup: Supplier) => (
                        <ComboboxItem key={sup.id} value={sup.id} className="text-xs py-1.5 cursor-pointer">
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground">{sup.name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              RUC / ID: {sup.identityNumber}
                            </span>
                          </div>
                        </ComboboxItem>
                      ))}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                  N° de Factura o Referencia (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: F-001293 o REF-99"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full bg-muted/40 border border-border rounded-xl py-2 px-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary h-9"
                />
              </div>
            </div>

            {/* Upload Zone */}
            <div 
              onClick={() => {
                if (!selectedBranchId) {
                  toast.warning('Por favor, selecciona primero la sucursal de destino.');
                  return;
                }
                fileInputRef.current?.click();
              }}
              className={`border-2 border-dashed border-border hover:border-primary/50 bg-muted/10 hover:bg-muted/20 transition-all rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer group ${!selectedBranchId ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx, .xls"
                className="hidden"
                disabled={!selectedBranchId}
              />
              <div className="w-12 h-12 rounded-full bg-primary/5 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-xs font-bold text-secondary">Sube o arrastra tu archivo Excel de Cantidades</p>
                <p className="text-[10px] text-muted-foreground">Debe tener las columnas SKU y Cantidad</p>
              </div>
            </div>
          </div>
        ) : (
          /* Step 2: Preview table, error highlights, confirm button */
          <div className="space-y-4 py-3">
            <div className="flex flex-wrap justify-between items-center gap-2 bg-muted/20 border border-border rounded-xl p-3">
              <div className="flex flex-wrap items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono font-bold text-secondary truncate max-w-[200px]">{fileName}</span>
                <span className="text-[10px] text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-md font-mono">
                  {parsedData.length} registros
                </span>
                {invoiceNumber && (
                  <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md font-mono font-bold">
                    Ref: {invoiceNumber}
                  </span>
                )}
                {selectedBranchId && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md font-semibold">
                    <Building className="w-2.5 h-2.5" />
                    {selectedBranchName}
                  </span>
                )}
              </div>

              <button
                onClick={handleReset}
                disabled={isImporting}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border hover:bg-muted px-2.5 py-1.2 rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Cambiar Archivo
              </button>
            </div>

            {isValidating ? (
              <div className="py-16 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span>Validando existencia de SKUs...</span>
              </div>
            ) : (
              <>
                {globalError ? (
                  <div className="flex gap-2.5 bg-rose-500/10 border border-rose-500/25 rounded-xl p-3 text-xs text-rose-300">
                    <AlertTriangle className="w-4.5 h-4.5 text-rose-400 shrink-0" />
                    <div>
                      <p className="font-semibold">Límite excedido o error de validación</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{globalError}</p>
                    </div>
                  </div>
                ) : errorCount > 0 ? (
                  <div className="flex gap-2.5 bg-rose-500/10 border border-rose-500/25 rounded-xl p-3 text-xs text-rose-300">
                    <AlertTriangle className="w-4.5 h-4.5 text-rose-400 shrink-0" />
                    <div>
                      <p className="font-semibold">El archivo de compras contiene {errorCount} SKU(s) no válidos.</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Las filas marcadas en rojo no existen en el sistema. Agrégalos al catálogo antes de ingresar mercadería.</p>
                    </div>
                  </div>
                ) : isValidated ? (
                  <div className="flex gap-2.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-3 text-xs text-emerald-300">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                    <div>
                      <p className="font-semibold">¡Validación exitosa!</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Todos los SKUs existen y están listos para ingresar al inventario de la sucursal.</p>
                    </div>
                  </div>
                ) : null}

                {/* Preview Table */}
                <BulkImportPreviewTable
                  items={parsedData}
                  errors={validationErrors}
                  names={productNames}
                  type="purchases"
                />

                {/* Confirmations */}
                <div className="flex justify-end gap-3 pt-3 border-t border-border mt-3">
                  <button
                    onClick={onClose}
                    disabled={isImporting}
                    className="text-xs font-semibold text-secondary hover:bg-muted border border-border px-4 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    disabled={!isValidated || errorCount > 0 || !!globalError || isImporting || isValidating}
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-primary hover:bg-primary/95 disabled:bg-muted disabled:text-muted-foreground px-4 py-2 rounded-xl transition-all shadow-lg cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Confirmar e Ingresar
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
export default BulkPurchaseModal;
