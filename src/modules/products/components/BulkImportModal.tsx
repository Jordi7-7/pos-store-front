import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { downloadProductsTemplate } from '@/lib/excelTemplates';
import { BulkImportPreviewTable } from '@/components/BulkImportPreviewTable';
import { useBranches } from '../../branches/hooks/useBranches';
import type { Branch } from '../../branches/services/branches.service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { FileDown, Upload, FileSpreadsheet, Loader2, RefreshCw, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const { branches = [] } = useBranches();
  
  // States
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set default branch
  React.useEffect(() => {
    if (branches.length > 0 && !selectedBranchId) {
      setSelectedBranchId(branches[0].id);
    }
  }, [branches, selectedBranchId]);

  // Mutation for validation
  const validateMutation = useMutation({
    mutationFn: async (items: { sku: string; name: string }[]) => {
      return apiClient.post<{ errors: Record<string, string> }>('/products/validate-import', { items });
    },
    onSuccess: (data) => {
      setValidationErrors(data.errors);
      setIsValidating(false);
    },
    onError: (err: any) => {
      setIsValidating(false);
      toast.error(err.message || 'Error al validar el archivo.');
    }
  });

  // Mutation for final import
  const importMutation = useMutation({
    mutationFn: async (data: { branchId?: string; items: any[] }) => {
      return apiClient.post('/products/import', data);
    },
    onSuccess: (res: any) => {
      toast.success(`¡Importación completada! Se crearon ${res.importedCount} productos.`);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      handleReset();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al importar los productos.');
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

        const required = ['sku', 'nombre']; // Name is strictly required to create new products
        const hasAllRequired = required.every(req => fileHeaders.includes(req) || fileHeaders.includes('name'));

        if (!hasAllRequired || (fileHeaders.includes('cantidad') && !fileHeaders.includes('nombre') && !fileHeaders.includes('name'))) {
          toast.error('Plantilla incorrecta. Para la creación masiva de productos usa la plantilla oficial que incluye las columnas: SKU, Nombre, Codigo, Precio Compra, Precio Venta y Existencias.');
          setIsValidating(false);
          setFileName('');
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        const rawJson: any[] = XLSX.utils.sheet_to_json(ws);

        // Normalize columns (handle casing or accent variants if any)
        const normalized = rawJson.map((row) => ({
          sku: String(row.SKU || row.sku || '').trim(),
          name: String(row.Nombre || row.nombre || '').trim(),
          barcode: String(row.Codigo || row.codigo || row.Barra || row.barra || '').trim(),
          purchasePrice: Number(row['Precio Compra'] || row.precio_compra || 0),
          salePrice: Number(row['Precio Venta'] || row.precio_venta || 0),
          quantity: Number(row.Existencias || row.existencias || row.cantidad || 0),
        })).filter((item) => item.sku && item.name);

        if (normalized.length === 0) {
          toast.error('El archivo Excel no tiene filas válidas o está vacío.');
          setIsValidating(false);
          return;
        }

        setParsedData(normalized);

        // Run validation against the backend
        const validationItems = normalized.map(it => ({ sku: it.sku, name: it.name }));
        validateMutation.mutate(validationItems);

      } catch (error) {
        toast.error('Error al procesar el archivo Excel. Asegúrate que tiene el formato correcto.');
        setIsValidating(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleReset = () => {
    setParsedData([]);
    setValidationErrors({});
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = () => {
    if (parsedData.length === 0) return;
    importMutation.mutate({
      branchId: selectedBranchId || undefined,
      items: parsedData,
    });
  };

  const errorCount = Object.keys(validationErrors).length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-4xl w-full bg-card border border-border rounded-2xl shadow-2xl p-6 text-foreground">
        <DialogHeader className="border-b border-border pb-3">
          <DialogTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            <span>Creación Masiva de Productos (Excel)</span>
          </DialogTitle>
        </DialogHeader>

        {parsedData.length === 0 ? (
          /* Step 1: Upload File & Instructions */
          <div className="space-y-6 py-4">
            <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wide text-secondary flex items-center gap-1.5">
                <FileDown className="w-4 h-4 text-primary" />
                <span>Descarga la Plantilla Oficial</span>
              </h5>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Utiliza nuestra plantilla de Excel estructurada para asegurar la correcta carga de tus productos. Las columnas necesarias son: <strong className="text-secondary">SKU, Nombre, Codigo, Precio Compra, Precio Venta, Existencias</strong>.
              </p>
              <button
                type="button"
                onClick={downloadProductsTemplate}
                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-bold border border-primary/20 bg-primary/5 hover:bg-primary/10 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                Descargar Plantilla (.xlsx)
              </button>
            </div>

            {/* Sucursal Destino para existencias iniciales */}
            <div className="max-w-xs">
              <label className="block text-[10px] uppercase tracking-wider font-bold mb-1 text-muted-foreground">
                Sucursal para Cargar Existencias Iniciales
              </label>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full bg-muted/40 border border-border rounded-xl py-2 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">No cargar existencias (Solo crear catálogo)</option>
                {branches.map((b: Branch) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Drop Zone */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-primary/50 bg-muted/10 hover:bg-muted/20 transition-all rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer group"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx, .xls"
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-primary/5 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-xs font-bold text-secondary">Sube o arrastra tu archivo de Excel aquí</p>
                <p className="text-[10px] text-muted-foreground">Soporta formatos estándar .xlsx o .xls</p>
              </div>
            </div>
          </div>
        ) : (
          /* Step 2: Preview & Validation Table */
          <div className="space-y-4 py-3">
            <div className="flex justify-between items-center bg-muted/20 border border-border rounded-xl p-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono font-bold text-secondary truncate max-w-[200px]">{fileName}</span>
                <span className="text-[10px] text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-md font-mono">
                  {parsedData.length} productos
                </span>
              </div>
              
              <button
                onClick={handleReset}
                disabled={importMutation.isPending}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border hover:bg-muted px-2.5 py-1.2 rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Cambiar Archivo
              </button>
            </div>

            {isValidating ? (
              <div className="py-16 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span>Corriendo validaciones de SKUs...</span>
              </div>
            ) : (
              <>
                {errorCount > 0 ? (
                  <div className="flex gap-2.5 bg-rose-500/10 border border-rose-500/25 rounded-xl p-3 text-xs text-rose-300">
                    <AlertTriangle className="w-4.5 h-4.5 text-rose-400 shrink-0" />
                    <div>
                      <p className="font-semibold">El archivo contiene {errorCount} fila(s) con errores.</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Corrige el archivo de Excel y súbelo de nuevo para poder continuar con la importación masiva.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-3 text-xs text-emerald-300">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                    <div>
                      <p className="font-semibold">¡Validación exitosa!</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Todos los SKUs son nuevos y la información tiene la estructura correcta para ser cargada.</p>
                    </div>
                  </div>
                )}

                {/* Preview Table */}
                <BulkImportPreviewTable 
                  items={parsedData} 
                  errors={validationErrors} 
                  type="products" 
                />

                {/* Confirm Actions */}
                <div className="flex justify-end gap-3 pt-3 border-t border-border mt-3">
                  <button
                    onClick={onClose}
                    disabled={importMutation.isPending}
                    className="text-xs font-semibold text-secondary hover:bg-muted border border-border px-4 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    disabled={errorCount > 0 || importMutation.isPending || isValidating}
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-primary hover:bg-primary/95 disabled:bg-muted disabled:text-muted-foreground px-4 py-2 rounded-xl transition-all shadow-lg cursor-pointer disabled:cursor-not-allowed"
                  >
                    {importMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Confirmar e Importar
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
export default BulkImportModal;
