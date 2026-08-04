import React from 'react';
import { X, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CierreModalProps {
  isOpen: boolean;
  onClose: () => void;
  closingBalance: string;
  setClosingBalance: (val: string) => void;
  onCloseSession: () => void;
  isClosing: boolean;
}

export const CierreModal: React.FC<CierreModalProps> = ({
  isOpen,
  onClose,
  closingBalance,
  setClosingBalance,
  onCloseSession,
  isClosing,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
            <X className="w-4 h-4 text-rose-500" />
            <span>Cierre de Caja Registradora</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-[10px] text-neutral mb-1 uppercase tracking-wider font-bold">
              Monto de Cierre ($)
            </label>
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
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isClosing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Cerrar Caja y Sesión</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
