import React from 'react';
import { AlertCircle, Building, FileDown, Upload } from 'lucide-react';
import { downloadPurchasesTemplate } from '@/lib/excelTemplates';
import type { SupplierEntity } from '../../domain/entities/supplier.entity';
import { SupplierCombobox } from './SupplierCombobox';

interface BulkUploadStepProps {
  branchId?: string;
  branchName?: string;
  suppliers: SupplierEntity[];
  supplierId: string;
  onSupplierChange: (supplierId: string) => void;
  invoiceNumber: string;
  onInvoiceChange: (value: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onPickFile: () => void;
  onFileSelected: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

/** Paso 1 del ingreso masivo: plantilla, proveedor, referencia y zona para subir el archivo. */
export const BulkUploadStep: React.FC<BulkUploadStepProps> = ({ branchId, branchName, suppliers, supplierId, onSupplierChange, invoiceNumber, onInvoiceChange, fileInputRef, onPickFile, onFileSelected }) => (
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

            {!branchId && (
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
                  {branchId && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-primary font-semibold bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                      <Building className="w-2.5 h-2.5" />
                      {branchName}
                    </span>
                  )}
                </div>
                <SupplierCombobox
                  suppliers={suppliers}
                  value={supplierId}
                  onChange={onSupplierChange}
                  placeholder="Buscar o seleccionar proveedor..."
                  emptyText="No se encontraron proveedores."
                  inputClassName="text-xs shadow-none h-9 bg-muted/40 border-border rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                  N° de Factura o Referencia (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: F-001293 o REF-99"
                  value={invoiceNumber}
                  onChange={(e) => onInvoiceChange(e.target.value)}
                  className="w-full bg-muted/40 border border-border rounded-xl py-2 px-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary h-9"
                />
              </div>
            </div>

            {/* Upload Zone */}
            <div 
              onClick={onPickFile}
              className={`border-2 border-dashed border-border hover:border-primary/50 bg-muted/10 hover:bg-muted/20 transition-all rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer group ${!branchId ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={onFileSelected}
                accept=".xlsx, .xls"
                className="hidden"
                disabled={!branchId}
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
);
