import React, { useState } from 'react';
import { X, Wallet, ArrowRightLeft, Receipt, Loader2 } from 'lucide-react';

interface CashSessionModalsProps {
  // Opening Modal
  isAperturaOpen: boolean;
  onCloseApertura: () => void;
  openingBalance: string;
  setOpeningBalance: (val: string) => void;
  onOpenSession: () => void;
  isOpening: boolean;

  // Expense Modal
  isEgresoOpen: boolean;
  onCloseEgreso: () => void;
  expenseDesc: string;
  setExpenseDesc: (val: string) => void;
  expenseAmount: string;
  setExpenseAmount: (val: string) => void;
  onAddExpense: () => void;
  isRegistering: boolean;

  // Closing Modal
  isCierreOpen: boolean;
  onCloseCierre: () => void;
  closingBalance: string;
  setClosingBalance: (val: string) => void;
  onCloseSession: () => void;
  isClosing: boolean;

  // History Modal
  isHistorialOpen: boolean;
  onCloseHistorial: () => void;
  activeSessionSales: any[];
  activeSessionExpenses: any[];
}

export const CashSessionModals: React.FC<CashSessionModalsProps> = ({
  isAperturaOpen,
  onCloseApertura,
  openingBalance,
  setOpeningBalance,
  onOpenSession,
  isOpening,

  isEgresoOpen,
  onCloseEgreso,
  expenseDesc,
  setExpenseDesc,
  expenseAmount,
  setExpenseAmount,
  onAddExpense,
  isRegistering,

  isCierreOpen,
  onCloseCierre,
  closingBalance,
  setClosingBalance,
  onCloseSession,
  isClosing,

  isHistorialOpen,
  onCloseHistorial,
  activeSessionSales,
  activeSessionExpenses
}) => {
  const [historyTab, setHistoryTab] = useState<'sales' | 'expenses'>('sales');

  return (
    <>
      {/* APERTURA DE CAJA MODAL */}
      {isAperturaOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-bg-card border border-border-card rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
            <button onClick={onCloseApertura} className="absolute top-4 right-4 text-neutral hover:text-secondary">
              <X className="w-4 h-4" />
            </button>
            <div className="border-b border-border-card pb-3 mb-4">
              <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-500" />
                <span>Apertura de Caja Registradora</span>
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-neutral mb-1 uppercase tracking-wider font-bold">Monto Fondo Inicial ($)</label>
                <input 
                  type="number" 
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none"
                />
              </div>
              <button 
                onClick={onOpenSession}
                disabled={isOpening}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all shadow flex items-center justify-center gap-1.5"
              >
                {isOpening ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Abrir Caja</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGISTRAR EGRESO MODAL */}
      {isEgresoOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-bg-card border border-border-card rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
            <button onClick={onCloseEgreso} className="absolute top-4 right-4 text-neutral hover:text-secondary">
              <X className="w-4 h-4" />
            </button>
            <div className="border-b border-border-card pb-3 mb-4">
              <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-amber-500" />
                <span>Registrar Egreso (Salida)</span>
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-neutral mb-1 uppercase tracking-wider font-bold">Descripción del Egreso</label>
                <input 
                  type="text" 
                  placeholder="Ej. Compra de bolsas, Pago limpieza..." 
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none placeholder-neutral"
                />
              </div>
              <div>
                <label className="block text-[10px] text-neutral mb-1 uppercase tracking-wider font-bold">Monto ($)</label>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none placeholder-neutral"
                />
              </div>
              <button 
                onClick={onAddExpense}
                disabled={isRegistering}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all shadow flex items-center justify-center gap-1.5"
              >
                {isRegistering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Guardar Egreso</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CIERRE DE CAJA MODAL */}
      {isCierreOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-bg-card border border-border-card rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
            <button onClick={onCloseCierre} className="absolute top-4 right-4 text-neutral hover:text-secondary">
              <X className="w-4 h-4" />
            </button>
            <div className="border-b border-border-card pb-3 mb-4">
              <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
                <X className="w-4 h-4 text-rose-500" />
                <span>Cierre de Caja Registradora</span>
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-neutral mb-1 uppercase tracking-wider font-bold">Monto de Cierre ($)</label>
                <input 
                  type="number" 
                  value={closingBalance}
                  onChange={(e) => setClosingBalance(e.target.value)}
                  className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none"
                />
              </div>
              <button 
                onClick={onCloseSession}
                disabled={isClosing}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all shadow flex items-center justify-center gap-1.5"
              >
                {isClosing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Cerrar Caja y Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HISTORIAL DE LA SESIÓN MODAL */}
      {isHistorialOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-bg-card border border-border-card rounded-2xl p-6 w-full max-w-lg shadow-2xl relative">
            <button onClick={onCloseHistorial} className="absolute top-4 right-4 text-neutral hover:text-secondary">
              <X className="w-4 h-4" />
            </button>
            <div className="border-b border-border-card pb-3 mb-4">
              <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2 mb-3">
                <Receipt className="w-4 h-4 text-primary" />
                <span>Historial de la Sesión Activa</span>
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setHistoryTab('sales')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    historyTab === 'sales'
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-bg-dark text-neutral hover:text-secondary border border-border-card'
                  }`}
                >
                  Ventas ({activeSessionSales.length})
                </button>
                <button
                  onClick={() => setHistoryTab('expenses')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    historyTab === 'expenses'
                      ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                      : 'bg-bg-dark text-neutral hover:text-secondary border border-border-card'
                  }`}
                >
                  Gastos ({activeSessionExpenses.length})
                </button>
              </div>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {historyTab === 'sales' ? (
                activeSessionSales.length === 0 ? (
                  <div className="py-12 text-center text-xs text-neutral">No has registrado ninguna venta en esta sesión todavía.</div>
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
                  <div className="py-12 text-center text-xs text-neutral">No has registrado ningún gasto en esta sesión todavía.</div>
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
          </div>
        </div>
      )}
    </>
  );
};
export default CashSessionModals;
