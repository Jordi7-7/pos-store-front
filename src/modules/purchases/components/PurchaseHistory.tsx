import React from 'react';
import { usePurchases } from '../hooks/usePurchases';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { ClipboardList, Calendar, User, MapPin, Loader2 } from 'lucide-react';
import type { Purchase, PurchaseItem } from '../services/purchases.service';

export const PurchaseHistory: React.FC = () => {
  const { purchases, isLoading } = usePurchases();
  const timezone = useAuthStore((state) => state.timezone) || 'America/Guayaquil';

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
          {purchases.map((pur: Purchase) => (
            <div key={pur.id} className="bg-bg-dark/40 border border-border-card rounded-2xl p-4.5 text-secondary space-y-3 shadow-sm hover:border-primary/30 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-card/60 pb-2.5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-mono font-bold text-primary">{pur.invoiceNumber || 'S/Ref'}</span>
                  <span className="text-[10px] text-neutral flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(pur.createdAt).toLocaleString(undefined, { timeZone: timezone })}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {pur.status}
                  </span>
                  <span className="text-xs font-bold text-primary font-mono">
                    Total: ${Number(pur.totalAmount || 0).toFixed(2)}
                  </span>
                </div>
              </div>

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

              <div className="border-t border-border-card/40 pt-2.5">
                <span className="text-[9.5px] font-bold text-neutral uppercase tracking-wider block mb-1.5">Desglose de Artículos</span>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {(pur.items || []).map((item: PurchaseItem) => (
                    <div key={item.id} className="flex justify-between items-center text-[11px] bg-bg-card border border-border-card/60 p-2 rounded-xl">
                      <div>
                        <span className="font-bold">{item.variant?.product?.name || 'Producto'}</span>
                        <span className="text-[9.5px] text-neutral font-mono block">SKU: {item.variant?.sku}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold block">x{item.quantity}</span>
                        <span className="text-[9.5px] text-neutral font-mono block">Costo U: ${Number(item.purchasePrice || item.unitCost || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default PurchaseHistory;
