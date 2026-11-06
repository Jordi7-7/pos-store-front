import React, { useState } from 'react';
import { AlertCircle, Building, ClipboardList, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getErrorMessage } from '@/shared/presentation/formatting/error-messages';
import { useLayoutContext } from '@/providers/LayoutContext';
import { filledLines, toPurchaseRequest } from '../../domain/rules/purchase-lines';
import { useDefaultSupplier } from '../hooks/useDefaultSupplier';
import { usePurchaseLines } from '../hooks/usePurchaseLines';
import { useRegisterPurchase } from '../hooks/usePurchaseOrders';
import { useSuppliers } from '../hooks/useSuppliers';
import { BulkPurchaseModal } from './BulkPurchaseModal';
import { PurchaseLinesTable } from './PurchaseLinesTable';
import { SupplierCombobox } from './SupplierCombobox';

interface PurchaseFormProps {
  selectedBranchId?: string;
  onSuccess: () => void;
}

/** Ingreso de mercancía: proveedor, referencia y filas por SKU. Las filas y sus reglas viven en `usePurchaseLines`. */
export const PurchaseForm: React.FC<PurchaseFormProps> = ({ onSuccess }) => {
  const { selectedBranchId, selectedBranchName } = useLayoutContext();
  const { suppliers } = useSuppliers();
  const { registerPurchase, isRegistering } = useRegisterPurchase();
  const { supplierId, setSupplierId } = useDefaultSupplier(suppliers);
  const rows = usePurchaseLines();
  const [invoice, setInvoice] = useState('');
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedBranchId) {
      toast.warning('Por favor selecciona una sucursal específica en la barra superior antes de registrar ingresos.');
      return;
    }
    if (filledLines(rows.lines).length === 0) {
      toast.warning('Debes añadir al menos un artículo válido (selecciona un producto de la lista).');
      return;
    }
    try {
      await registerPurchase(toPurchaseRequest(rows.lines, selectedBranchId, supplierId, invoice));
      toast.success('¡Ingreso registrado en Kardex y stock incrementado!');
      setInvoice('');
      rows.reset();
      onSuccess();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Error al registrar el ingreso.'));
    }
  };

  // Enter dentro de un campo mueve el foco de la tabla; no debe enviar el formulario.
  const preventEnterSubmit = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Enter' && (event.target as HTMLElement).tagName === 'INPUT') event.preventDefault();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {!selectedBranchId && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Para registrar compras, selecciona una sucursal en la barra superior.</span>
        </div>
      )}

      <Card className="border border-border/80 shadow-xs">
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-primary" />
                <span>Registrar Ingreso de Mercancía</span>
                {selectedBranchId && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 font-normal">
                    <Building className="w-3 h-3" />
                    {selectedBranchName}
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                Ingresa mercancía al inventario indicando el SKU del producto. El sistema te mostrará sugerencias a medida que escribes.
              </CardDescription>
            </div>
            <button
              type="button"
              onClick={() => setIsBulkOpen(true)}
              className="flex items-center gap-1.5 text-xs text-primary font-bold border border-primary/20 hover:border-primary/40 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs self-start sm:self-center"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Carga Masiva (Excel)
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} onKeyDown={preventEnterSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold mb-1 text-muted-foreground">Proveedor Comercial *</label>
                <SupplierCombobox
                  suppliers={suppliers}
                  value={supplierId}
                  onChange={setSupplierId}
                  placeholder="Buscar o seleccionar proveedor..."
                  emptyText="No se encontraron proveedores."
                  inputClassName="text-xs shadow-none h-9 bg-muted/30 border-border rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold mb-1 text-muted-foreground">Referencia / Factura (Opcional)</label>
                <input
                  type="text"
                  value={invoice}
                  onChange={(event) => setInvoice(event.target.value)}
                  placeholder="Ej. Guía, FAC-123"
                  className="w-full bg-muted/30 border border-border rounded-xl py-2 px-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary h-9"
                />
              </div>
            </div>

            <PurchaseLinesTable
              lines={rows.lines}
              total={rows.total}
              onUpdateRow={rows.updateRow}
              onRemoveRow={rows.removeRow}
              onProductSelect={rows.selectProduct}
              onKeyDown={rows.onKeyDown}
              onAddRow={rows.addRow}
            />

            <button
              type="submit"
              disabled={isRegistering || filledLines(rows.lines).length === 0}
              className="w-full py-3 bg-primary hover:bg-primary/95 disabled:bg-muted disabled:text-muted-foreground text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isRegistering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Registrar Ingreso (Kardex)</span>
            </button>
          </form>
          <BulkPurchaseModal isOpen={isBulkOpen} onClose={() => setIsBulkOpen(false)} />
        </CardContent>
      </Card>
    </div>
  );
};
export default PurchaseForm;
