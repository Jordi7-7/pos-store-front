import React, { useState } from 'react';
import { usePurchases, useCancelPurchase } from '../hooks/usePurchases';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import {
  ClipboardList,
  Calendar,
  User,
  MapPin,
  Loader2,
  XCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type { Purchase, PurchaseItem } from '../services/purchases.service';
import { toast } from 'sonner';

export const PurchaseHistory: React.FC = () => {
  const { purchases, isLoading } = usePurchases();
  const { cancelPurchase, isCancelling, cancellingId } = useCancelPurchase();
  const timezone = useAuthStore((state) => state.timezone) || 'America/Guayaquil';
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const handleCancelClick = (id: string) => {
    setConfirmingId(id);
  };

  const handleConfirmCancel = async (id: string) => {
    setConfirmingId(null);
    try {
      await cancelPurchase(id);
      toast.success('Ingreso anulado correctamente. El stock ha sido revertido.');
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo anular el ingreso.');
    }
  };

  const handleDismissConfirm = () => {
    setConfirmingId(null);
  };

  return (
    <div className="bg-bg-card border border-border-card rounded-2xl p-6 shadow-sm space-y-4 animate-fade-in">
      <div className="border-b border-border-card pb-3">
        <h4 className="text-xs font-bold text-secondary uppercase tracking-wide flex items-center gap-1.5">
          <ClipboardList className="w-4 h-4 text-primary" />
          <span>Historial de Órdenes de Compra</span>
        </h4>
        <p className="text-xs text-neutral mt-0.5 font-medium">Auditoría y registro de abastecimientos cargados al Kardex general.</p>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-xs text-neutral flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span>Cargando historial de compras...</span>
        </div>
      ) : purchases.length === 0 ? (
        <div className="text-center py-16 text-xs text-neutral italic border-2 border-dashed border-border-card rounded-2xl">
          No se han registrado compras en el historial todavía.
        </div>
      ) : (
        <div className="space-y-4">
          {purchases.map((pur: Purchase) => {
            const isCancellingThis = isCancelling && cancellingId === pur.id;
            const isConfirming = confirmingId === pur.id;
            const isCancelled = pur.status === 'CANCELLED';

            return (
              <div
                key={pur.id}
                className={`border rounded-2xl p-4.5 text-secondary space-y-3 shadow-sm transition-all ${
                  isCancelled
                    ? 'bg-red-500/5 border-red-500/20 opacity-70'
                    : 'bg-bg-dark/40 border-border-card hover:border-primary/30'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-card/60 pb-2.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-mono font-bold text-primary">
                      {pur.invoiceNumber || 'S/Ref'}
                    </span>
                    <span className="text-[10px] text-neutral flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(pur.createdAt).toLocaleString(undefined, { timeZone: timezone })}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status badge */}
                    {isCancelled ? (
                      <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        Anulada
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {pur.status}
                      </span>
                    )}

                    <span className="text-xs font-bold text-primary font-mono">
                      Total: ${Number(pur.totalAmount || 0).toFixed(2)}
                    </span>

                    {/* Cancel button or disabled indicator */}
                    {!isCancelled && (
                      pur.isCancellable ? (
                        <button
                          onClick={() => handleCancelClick(pur.id)}
                          disabled={isCancellingThis}
                          title="Anular este ingreso y revertir el stock"
                          className="flex items-center gap-1 text-[10px] font-bold text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400/60 bg-red-500/5 hover:bg-red-500/15 px-2.5 py-1 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isCancellingThis ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {isCancellingThis ? 'Anulando...' : 'Anular'}
                        </button>
                      ) : (
                        <span
                          title="No se puede anular: ya se vendieron unidades de este lote"
                          className="flex items-center gap-1 text-[10px] font-bold text-neutral border border-border-card bg-muted/20 px-2.5 py-1 rounded-lg cursor-not-allowed opacity-50"
                        >
                          <XCircle className="w-3 h-3" />
                          No anulable
                        </span>
                      )
                    )}
                  </div>
                </div>

                {/* Confirmation dialog */}
                {isConfirming && (
                  <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                    <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <p className="text-xs font-semibold text-red-300">
                        ¿Confirmar anulación de ingreso?
                      </p>
                      <p className="text-[10px] text-neutral leading-relaxed">
                        Se revertirá el stock de todos los productos de esta orden. Esta acción queda registrada en el Kardex como <strong className="text-secondary">ANULACION_COMPRA</strong> y no puede deshacerse.
                      </p>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleConfirmCancel(pur.id)}
                          className="text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Sí, anular ingreso
                        </button>
                        <button
                          onClick={handleDismissConfirm}
                          className="text-[10px] font-bold text-secondary border border-border-card hover:border-primary/40 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Supplier / Branch */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-secondary">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-neutral" />
                    <div>
                      <span className="text-[10px] text-neutral block font-bold uppercase tracking-wider">Proveedor</span>
                      <span className="font-semibold">{pur.supplier?.name || 'Proveedor General'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-neutral" />
                    <div>
                      <span className="text-[10px] text-neutral block font-bold uppercase tracking-wider">Sucursal Destino</span>
                      <span className="font-semibold">{pur.branch?.name || 'Matriz'}</span>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="border-t border-border-card/40 pt-2.5">
                  <span className="text-[9.5px] font-bold text-neutral uppercase tracking-wider block mb-1.5">Desglose de Artículos</span>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {(pur.items || []).map((item: PurchaseItem) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center text-[11px] bg-bg-card border border-border-card/60 p-2 rounded-xl"
                      >
                        <div>
                          <span className="font-bold">{item.variant?.product?.name || 'Producto'}</span>
                          <span className="text-[9.5px] text-neutral font-mono block">SKU: {item.variant?.sku}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold block">x{item.quantity}</span>
                          <span className="text-[9.5px] text-neutral font-mono block">
                            Costo U: ${Number(item.purchasePrice || item.unitCost || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default PurchaseHistory;
