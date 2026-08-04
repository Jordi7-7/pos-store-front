import React from 'react';
import { Wallet, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AperturaModalProps {
  isOpen: boolean;
  onClose: () => void;
  openingBalance: string;
  setOpeningBalance: (val: string) => void;
  onOpenSession: () => void;
  isOpening: boolean;
}

export const AperturaModal: React.FC<AperturaModalProps> = ({
  isOpen,
  onClose,
  openingBalance,
  setOpeningBalance,
  onOpenSession,
  isOpening,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-500" />
            <span>Apertura de Caja Registradora</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-[10px] text-neutral mb-1 uppercase tracking-wider font-bold">
              Monto Fondo Inicial ($)
            </label>
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
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isOpening && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Abrir Caja</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
