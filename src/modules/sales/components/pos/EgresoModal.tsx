import React from 'react';
import { ArrowRightLeft, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface EgresoModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseDesc: string;
  setExpenseDesc: (val: string) => void;
  expenseAmount: string;
  setExpenseAmount: (val: string) => void;
  onAddExpense: () => void;
  isRegistering: boolean;
}

export const EgresoModal: React.FC<EgresoModalProps> = ({
  isOpen,
  onClose,
  expenseDesc,
  setExpenseDesc,
  expenseAmount,
  setExpenseAmount,
  onAddExpense,
  isRegistering,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-amber-500" />
            <span>Registrar Gasto</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div>
            <label className="block text-[10px] text-neutral mb-1 uppercase tracking-wider font-bold">
              Descripción del Gasto
            </label>
            <input 
              type="text" 
              placeholder="Ej. Compra de bolsas, Pago limpieza..." 
              value={expenseDesc}
              onChange={(e) => setExpenseDesc(e.target.value)}
              className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none placeholder-neutral"
            />
          </div>
          <div>
            <label className="block text-[10px] text-neutral mb-1 uppercase tracking-wider font-bold">
              Monto ($)
            </label>
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
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isRegistering && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Guardar Gasto</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
