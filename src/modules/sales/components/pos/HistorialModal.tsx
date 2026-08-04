import React, { useState } from 'react';
import { Receipt } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface HistorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSessionSales: any[];
  activeSessionExpenses: any[];
}

export const HistorialModal: React.FC<HistorialModalProps> = ({
  isOpen,
  onClose,
  activeSessionSales,
  activeSessionExpenses,
}) => {
  const [historyTab, setHistoryTab] = useState<'sales' | 'expenses'>('sales');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2 mb-3">
            <Receipt className="w-4 h-4 text-primary" />
            <span>Historial de la Sesión Activa</span>
          </DialogTitle>
          <div className="flex gap-2 pb-2">
            <button
              onClick={() => setHistoryTab('sales')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                historyTab === 'sales'
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-bg-dark text-neutral hover:text-secondary border border-border-card'
              }`}
            >
              Ventas ({activeSessionSales.length})
            </button>
            <button
              onClick={() => setHistoryTab('expenses')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                historyTab === 'expenses'
                  ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                  : 'bg-bg-dark text-neutral hover:text-secondary border border-border-card'
              }`}
            >
              Gastos ({activeSessionExpenses.length})
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-3 max-h-80 overflow-y-auto pr-1 pt-2">
          {historyTab === 'sales' ? (
            activeSessionSales.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral">
                No has registrado ninguna venta en esta sesión todavía.
              </div>
            ) : (
              activeSessionSales.map((sale: any) => (
                <div key={sale.id} className="flex justify-between items-center bg-bg-dark/40 border border-border-card p-3 rounded-xl text-secondary animate-fade-in">
                  <div>
                    <div className="text-[10px] font-bold font-mono">{sale.invoiceNumber}</div>
                    <div className="text-[9px] text-neutral mt-0.5">{new Date(sale.createdAt).toLocaleTimeString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-primary">${Number(sale.total || sale.totalAmount || 0).toFixed(2)}</div>
                    <span className="text-[8.5px] uppercase tracking-wider font-bold text-neutral-400 bg-bg-card px-2 py-0.5 rounded border border-border-card inline-block mt-0.5">
                      {sale.payments?.[0]?.paymentMethod || 'Efectivo'}
                    </span>
                  </div>
                </div>
              ))
            )
          ) : (
            activeSessionExpenses.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral">
                No has registrado ningún gasto en esta sesión todavía.
              </div>
            ) : (
              activeSessionExpenses.map((exp: any) => (
                <div key={exp.id} className="flex justify-between items-center bg-bg-dark/40 border border-border-card p-3 rounded-xl text-secondary animate-fade-in">
                  <div>
                    <div className="text-[11px] font-bold text-secondary">{exp.desc}</div>
                    <div className="text-[9px] text-neutral mt-0.5">{exp.createdAt ? new Date(exp.createdAt).toLocaleTimeString() : 'Hace un momento'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-amber-500">-${Number(exp.amount || 0).toFixed(2)}</div>
                    <span className="text-[8.5px] uppercase tracking-wider font-bold text-amber-400 bg-bg-card px-2 py-0.5 rounded border border-border-card inline-block mt-0.5">
                      {exp.category || 'Servicios'}
                    </span>
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
