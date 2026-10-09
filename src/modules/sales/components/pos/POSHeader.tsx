import React from 'react';
import {
  Wallet,
  ArrowRightLeft,
  Receipt,
  ArrowLeftRight,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface POSHeaderProps {
  currentTime: string;
  shiftDuration: string;
  activeSession: any;
  currentUser: any;
  availableRegistersForUser: any[];
  userRole?: string;
  onOpenApertura: () => void;
  onOpenEgreso: () => void;
  onOpenHistorial: () => void;
  onOpenCambios: () => void;
  onOpenCierre: () => void;
}

export const POSHeader: React.FC<POSHeaderProps> = ({
  currentTime,
  shiftDuration,
  activeSession,
  currentUser,
  availableRegistersForUser,
  userRole,
  onOpenApertura,
  onOpenEgreso,
  onOpenHistorial,
  onOpenCambios,
  onOpenCierre,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 bg-bg-card border border-border-card rounded-2xl p-4 shadow-sm">
      {/* Digital Clock & Shift Status */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-dark border border-border-card rounded-xl text-xs text-secondary font-mono font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span>{currentTime}</span>
        </div>

        <div
          className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl text-xs font-semibold ${
            activeSession
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
              : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              activeSession ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span>
            {activeSession
              ? `${activeSession.cashRegisterName || activeSession.cashRegister?.name || 'Caja'} Abierta: ${shiftDuration} (${
                  activeSession.openedByName || currentUser?.name || activeSession.user?.name || 'Vendedor'
                })`
              : 'Caja Cerrada'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {activeSession ? (
          <>
            <button
              type="button"
              onClick={onOpenEgreso}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-dark border border-border-card rounded-xl text-xs font-semibold text-secondary hover:border-amber-500/30 hover:text-amber-500 transition-all cursor-pointer shadow-sm"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-amber-500" />
              <span>Registrar Gasto</span>
            </button>

            <button
              type="button"
              onClick={onOpenHistorial}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-dark border border-border-card rounded-xl text-xs font-semibold text-secondary hover:border-primary/30 hover:text-primary transition-all cursor-pointer shadow-sm"
            >
              <Receipt className="w-3.5 h-3.5 text-primary" />
              <span>Historial</span>
            </button>

            <button
              type="button"
              onClick={onOpenCambios}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-dark border border-border-card rounded-xl text-xs font-semibold text-secondary hover:border-indigo-500/30 hover:text-indigo-400 transition-all cursor-pointer shadow-sm"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" />
              <span>Cambios</span>
            </button>

            <button
              type="button"
              onClick={onOpenCierre}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/20 transition-all cursor-pointer shadow-sm"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cerrar Caja</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (userRole !== 'OWNER' && availableRegistersForUser.length === 0) {
                toast.error(
                  'No tienes ninguna caja registradora asignada para operar. Contacta a un administrador.',
                );
                return;
              }
              onOpenApertura();
            }}
            disabled={userRole !== 'OWNER' && availableRegistersForUser.length === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm ${
              userRole !== 'OWNER' && availableRegistersForUser.length === 0
                ? 'bg-neutral/10 border border-neutral/20 text-neutral cursor-not-allowed opacity-60'
                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 cursor-pointer'
            }`}
            title={
              userRole !== 'OWNER' && availableRegistersForUser.length === 0
                ? 'No tienes cajas registradoras asignadas'
                : 'Abrir turno en caja'
            }
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Apertura de Caja</span>
          </button>
        )}
      </div>
    </div>
  );
};
