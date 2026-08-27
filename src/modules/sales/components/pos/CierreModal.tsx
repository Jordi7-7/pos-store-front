import React, { useMemo } from 'react';
import { X, Loader2, ArrowUpRight, ArrowDownLeft, Wallet, Info, FileText, Package } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuthStore } from '../../../auth/hooks/useAuthStore';

interface CierreModalProps {
  isOpen: boolean;
  onClose: () => void;
  closingBalance: string;
  setClosingBalance: (val: string) => void;
  onCloseSession: () => void;
  isClosing: boolean;
  activeSession: any;
  activeSessionSales: any[];
  activeSessionExpenses: any[];
}

export const CierreModal: React.FC<CierreModalProps> = ({
  isOpen,
  onClose,
  closingBalance,
  setClosingBalance,
  onCloseSession,
  isClosing,
  activeSession,
  activeSessionSales,
  activeSessionExpenses,
}) => {
  const openingBalance = activeSession?.openingBalance ? Number(activeSession.openingBalance) : 0;
  const timezone = useAuthStore((state) => state.timezone) || 'America/Guayaquil';

  const salesTotal = useMemo(() => {
    return activeSessionSales.reduce((sum, s) => sum + Number(s.total || 0), 0);
  }, [activeSessionSales]);

  const expensesTotal = useMemo(() => {
    return activeSessionExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [activeSessionExpenses]);

  const expectedBalance = openingBalance + salesTotal - expensesTotal;

  // Group products sold for this session
  const productsSummary = useMemo(() => {
    const summary: { [sku: string]: { name: string; quantity: number; total: number } } = {};
    activeSessionSales.forEach((sale) => {
      (sale.items || []).forEach((item: any) => {
        const sku = item.variantSku || 'S/SKU';
        if (!summary[sku]) {
          summary[sku] = {
            name: item.productName || 'Producto',
            quantity: 0,
            total: 0,
          };
        }
        summary[sku].quantity += Number(item.quantity || 0);
        const itemDiscount = item.discountAmount || 0;
        summary[sku].total += (Number(item.price || 0) - itemDiscount) * Number(item.quantity || 0);
      });
    });
    return Object.entries(summary).map(([sku, data]) => ({
      sku,
      ...data,
    }));
  }, [activeSessionSales]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-card border border-border text-card-foreground rounded-2xl shadow-xl p-6 max-h-[90vh] flex flex-col">
        <DialogHeader className="border-b border-border pb-3 shrink-0">
          <DialogTitle className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
            <X className="w-4 h-4 text-rose-500" />
            <span>Cierre de Caja Registradora</span>
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 py-3 min-h-0">
          
          {/* Cash Summary Dashboard */}
          <div className="bg-muted/30 border border-border rounded-xl p-4.5 space-y-3 shadow-inner">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block border-b border-border/60 pb-1.5 flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5 text-primary" /> Resumen del Turno
            </span>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>(+) Saldo Inicial (Apertura):</span>
                <span className="font-mono font-semibold text-foreground">${openingBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span className="flex items-center gap-1 text-emerald-500">
                  <ArrowUpRight className="w-3.5 h-3.5" /> (+) Ventas Registradas:
                </span>
                <span className="font-mono font-semibold text-emerald-500 font-bold">${salesTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span className="flex items-center gap-1 text-rose-500">
                  <ArrowDownLeft className="w-3.5 h-3.5" /> (-) Gastos:
                </span>
                <span className="font-mono font-semibold text-rose-500 font-bold">${expensesTotal.toFixed(2)}</span>
              </div>

              <div className="border-t border-dashed border-border/80 pt-2 flex justify-between items-center font-bold text-sm">
                <span className="text-secondary">(=) Total Esperado en Caja:</span>
                <span className="font-mono text-primary font-extrabold text-base">${expectedBalance.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Breakdown Section */}
          <div className="space-y-3">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-primary" /> Desglose de Movimientos
            </span>

            {/* List of Sales */}
            <div className="border border-border rounded-xl p-3 bg-muted/10 space-y-3">
              <div>
                <span className="text-[9.5px] font-bold text-secondary uppercase tracking-wider block mb-1">Ventas Realizadas ({activeSessionSales.length})</span>
                {activeSessionSales.length === 0 ? (
                  <span className="text-[10px] text-muted-foreground italic block">Sin ventas en este turno</span>
                ) : (
                  <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                    {activeSessionSales.map((sale) => {
                      const timeStr = new Date(sale.createdAt).toLocaleTimeString(undefined, {
                        timeZone: timezone,
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      });
                      const methods = (sale.payments || []).map((p: any) => p.paymentMethod).join('/') || 'EFE';
                      return (
                        <div key={sale.id} className="flex justify-between items-center text-[10.5px] border-b border-border/40 pb-1 last:border-b-0 last:pb-0">
                          <span className="text-muted-foreground font-mono">[{timeStr}] {sale.invoiceNumber} ({methods})</span>
                          <span className="font-mono font-semibold text-foreground">${Number(sale.total || 0).toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Detailed Products List */}
              <div className="border-t border-border/60 pt-2">
                <span className="text-[9.5px] font-bold text-secondary uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <Package className="w-3 h-3 text-primary" /> Detalle de Artículos Vendidos
                </span>
                {productsSummary.length === 0 ? (
                  <span className="text-[10px] text-muted-foreground italic block">Sin artículos vendidos en este turno</span>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {productsSummary.map((prod) => (
                      <div key={prod.sku} className="text-[10.5px] border-b border-border/40 pb-1.5 last:border-b-0 last:pb-0">
                        <div className="flex justify-between items-center font-semibold text-foreground">
                          <span className="font-mono font-bold text-[10px] text-primary">{prod.sku}</span>
                          <span className="truncate max-w-[180px] uppercase text-[10px]">{prod.name}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground pl-3 text-[9.5px]">
                          <span>Cant: x{prod.quantity}</span>
                          <span className="text-foreground font-bold font-mono">${prod.total.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* List of Expenses */}
              <div className="border-t border-border/60 pt-2">
                <span className="text-[9.5px] font-bold text-secondary uppercase tracking-wider block mb-1">Gastos de Caja ({activeSessionExpenses.length})</span>
                {activeSessionExpenses.length === 0 ? (
                  <span className="text-[10px] text-muted-foreground italic block">Sin gastos en este turno</span>
                ) : (
                  <div className="space-y-1.5 max-h-20 overflow-y-auto pr-1">
                    {activeSessionExpenses.map((exp) => {
                      const timeStr = new Date(exp.createdAt).toLocaleTimeString(undefined, {
                        timeZone: timezone,
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      });
                      return (
                        <div key={exp.id} className="flex justify-between items-center text-[10.5px] border-b border-border/40 pb-1 last:border-b-0 last:pb-0">
                          <span className="text-muted-foreground font-mono">[{timeStr}] {exp.description}</span>
                          <span className="font-mono font-semibold text-rose-500">${Number(exp.amount || 0).toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form input */}
          <div className="space-y-1.5">
            <label className="block text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-bold">
              Monto de Cierre Físico ($)
            </label>
            <input 
              type="number" 
              value={closingBalance}
              onChange={(e) => setClosingBalance(e.target.value)}
              placeholder="Ingresa el efectivo contado..."
              className="w-full bg-muted/40 border border-border rounded-xl py-2.5 px-3.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-[9px] text-muted-foreground flex items-center gap-1 leading-normal">
              <Info className="w-3.5 h-3.5 text-primary shrink-0" />
              Cuenta el efectivo real de tu caja e ingresa el total. El sistema calculará automáticamente cualquier descuadre.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-border pt-3 shrink-0">
          <button 
            onClick={onCloseSession}
            disabled={isClosing}
            className="w-full py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isClosing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Cerrar Caja y Sesión</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default CierreModal;
