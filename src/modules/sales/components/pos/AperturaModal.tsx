import React from 'react';
import { Wallet, Loader2, CreditCard, Building, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { MyCashRegisterItem } from '@/modules/cash-registers/services/cash-registers.service';

interface AperturaModalProps {
  isOpen: boolean;
  onClose: () => void;
  openingBalance: string;
  setOpeningBalance: (val: string) => void;
  availableRegisters: MyCashRegisterItem[];
  selectedRegisterId: string;
  setSelectedRegisterId: (id: string) => void;
  isSingleAssigned: boolean;
  onOpenSession: () => void;
  isOpening: boolean;
}

export const AperturaModal: React.FC<AperturaModalProps> = ({
  isOpen,
  onClose,
  openingBalance,
  setOpeningBalance,
  availableRegisters,
  selectedRegisterId,
  setSelectedRegisterId,
  isSingleAssigned,
  onOpenSession,
  isOpening,
}) => {
  const selectedRegister = availableRegisters.find((r) => r.id === selectedRegisterId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-bg-card border border-border-card p-6">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-500" />
            <span>Apertura de Caja Registradora</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Register Selector / Card */}
          {isSingleAssigned && selectedRegister ? (
            <div className="p-3 bg-bg-dark rounded-xl border border-border-card flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-secondary block">{selectedRegister.name}</span>
                  <span className="text-[10px] text-neutral flex items-center gap-1">
                    <Building className="w-3 h-3 text-neutral/70" /> {selectedRegister.branchName}
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                Asignada
              </span>
            </div>
          ) : (
            <div>
              <label className="block text-[10px] text-neutral mb-1.5 uppercase tracking-wider font-bold">
                Selecciona la Caja en la que vas a operar hoy:
              </label>

              {availableRegisters.length === 0 ? (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>No hay cajas configuradas en esta sucursal o no tienes autorización asignada.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                  {availableRegisters.map((reg) => {
                    const isSelected = reg.id === selectedRegisterId;
                    const isOccupied = reg.isOpen;

                    return (
                      <div
                        key={reg.id}
                        onClick={() => {
                          if (!isOccupied) setSelectedRegisterId(reg.id);
                        }}
                        className={`p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                          isOccupied
                            ? 'bg-bg-dark/40 border-border-card/40 opacity-50 cursor-not-allowed'
                            : isSelected
                            ? 'bg-primary/10 border-primary text-secondary cursor-pointer shadow-sm'
                            : 'bg-bg-dark border-border-card hover:border-neutral/50 text-neutral cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <CreditCard className={`w-4 h-4 shrink-0 ${isSelected ? 'text-primary' : 'text-neutral'}`} />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-secondary block truncate">
                              {reg.name}
                            </span>
                            <span className="text-[10px] text-neutral block truncate">
                              {reg.branchName}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 pl-2">
                          {isOccupied ? (
                            <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                              En uso
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              Disponible
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-[10px] text-neutral mb-1 uppercase tracking-wider font-bold">
              Monto Fondo Inicial ($)
            </label>
            <input 
              type="number" 
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              placeholder="0.00"
              className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none focus:border-primary font-mono"
            />
          </div>

          <button 
            onClick={onOpenSession}
            disabled={isOpening || !selectedRegisterId}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isOpening && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Abrir Turno de Caja</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
