import React from 'react';
import { AlertTriangle, ArrowRight, Building, CheckCircle2, FileSpreadsheet, Loader2, RefreshCw } from 'lucide-react';
import { BulkImportPreviewTable } from '@/components/BulkImportPreviewTable';
import type { SheetItem } from '../../domain/rules/purchase-sheet';

interface BulkPreviewStepProps {
  fileName: string;
  items: SheetItem[];
  errors: Record<string, string>;
  names: Record<string, string>;
  errorCount: number;
  invoiceNumber: string;
  branchId?: string;
  branchName?: string;
  globalError: string | null;
  isValidating: boolean;
  isValidated: boolean;
  isImporting: boolean;
  canConfirm: boolean;
  onReset: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Paso 2 del ingreso masivo: vista previa del archivo, avisos de validación y confirmación. */
export const BulkPreviewStep: React.FC<BulkPreviewStepProps> = ({ fileName, items, errors, names, errorCount, invoiceNumber, branchId, branchName, globalError, isValidating, isValidated, isImporting, canConfirm, onReset, onConfirm, onCancel }) => (
          <div className="space-y-4 py-3">
            <div className="flex flex-wrap justify-between items-center gap-2 bg-muted/20 border border-border rounded-xl p-3">
              <div className="flex flex-wrap items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono font-bold text-secondary truncate max-w-[200px]">{fileName}</span>
                <span className="text-[10px] text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-md font-mono">
                  {items.length} registros
                </span>
                {invoiceNumber && (
                  <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md font-mono font-bold">
                    Ref: {invoiceNumber}
                  </span>
                )}
                {branchId && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md font-semibold">
                    <Building className="w-2.5 h-2.5" />
                    {branchName}
                  </span>
                )}
              </div>

              <button
                onClick={onReset}
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
                  items={items}
                  errors={errors}
                  names={names}
                  type="purchases"
                />

                {/* Confirmations */}
                <div className="flex justify-end gap-3 pt-3 border-t border-border mt-3">
                  <button
                    onClick={onCancel}
                    disabled={isImporting}
                    className="text-xs font-semibold text-secondary hover:bg-muted border border-border px-4 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={onConfirm}
                    disabled={!canConfirm}
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
);
