import {
  Wallet,
  ArrowRightLeft,
  Receipt,
  ArrowLeftRight,
  X,
  Printer,
  Clock,
  Timer,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';
import { APP_PERMISSIONS } from '@/constants/permissions';

interface POSHeaderProps {
  currentTime: string;
  shiftDuration: string;
  activeSession: any;
  availableRegistersForUser: any[];
  onOpenApertura: () => void;
  onOpenEgreso: () => void;
  onOpenHistorial: () => void;
  onOpenCambios: () => void;
  onOpenCierre: () => void;
  onOpenPrinterConfig?: () => void;
}

export const POSHeader: React.FC<POSHeaderProps> = ({
  currentTime,
  shiftDuration,
  activeSession,
  availableRegistersForUser,
  onOpenApertura,
  onOpenEgreso,
  onOpenHistorial,
  onOpenCambios,
  onOpenCierre,
  onOpenPrinterConfig,
}) => {
  const { can } = usePermissions();
  const canOpenCloseCash = can(APP_PERMISSIONS.CASH_OPEN_CLOSE);
  const canCreateExpense = can(APP_PERMISSIONS.CASH_CREATE_EXPENSE);
  const canRefund = can(APP_PERMISSIONS.SALES_REFUND);

  const hasAvailableRegisters = availableRegistersForUser.length > 0;
  const isAperturaDisabled = !canOpenCloseCash || !hasAvailableRegisters;

  const handleAperturaClick = () => {
    if (!canOpenCloseCash) {
      toast.error('No tienes permisos para abrir turnos de caja.');
      return;
    }
    if (!hasAvailableRegisters) {
      toast.error(
        'No tienes ninguna caja registradora asignada para operar. Contacta a un administrador.',
      );
      return;
    }
    onOpenApertura();
  };

  const aperturaTooltip = !canOpenCloseCash
    ? 'No tienes permiso para abrir turnos de caja'
    : !hasAvailableRegisters
    ? 'No tienes cajas registradoras asignadas'
    : 'Abrir turno en caja';
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-bg-card border border-border-card rounded-2xl px-4 py-3 shadow-sm">
      {/* Compact Unified Status Widget: Register + Current Time + Shift Open Duration */}
      <div className="flex items-center">
        <div className="inline-flex items-center bg-bg-dark border border-border-card rounded-xl p-1 text-xs shadow-xs">
          {/* Status Indicator & Register */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-colors ${
              activeSession
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                activeSession ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="font-bold">
              {activeSession
                ? (activeSession.cashRegisterName || activeSession.cashRegister?.name || 'Caja')
                : 'Caja Cerrada'}
            </span>
          </div>

          {/* Time & Shift Duration */}
          <div className="flex items-center gap-2 px-2.5 py-1 text-secondary font-mono text-[11px]">
            <div className="flex items-center gap-1.5" title="Hora actual">
              <Clock className="w-3.5 h-3.5 text-neutral shrink-0" />
              <span>{currentTime}</span>
            </div>

            {activeSession && (
              <>
                <span className="text-border-card select-none">|</span>
                <div
                  className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold"
                  title="Tiempo transcurrido del turno abierto"
                >
                  <Timer className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{shiftDuration}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {onOpenPrinterConfig && (
          <button
            type="button"
            onClick={onOpenPrinterConfig}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-dark border border-border-card rounded-xl text-xs font-semibold text-secondary hover:border-primary/40 hover:text-primary transition-all cursor-pointer shadow-sm"
            title="Configurar Impresora Térmica USB"
          >
            <Printer className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Impresora</span>
          </button>
        )}

        {activeSession ? (
          <>
            {canCreateExpense && (
              <button
                type="button"
                onClick={onOpenEgreso}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-dark border border-border-card rounded-xl text-xs font-semibold text-secondary hover:border-amber-500/30 hover:text-amber-500 transition-all cursor-pointer shadow-sm"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-amber-500" />
                <span>Registrar Gasto</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenHistorial}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-dark border border-border-card rounded-xl text-xs font-semibold text-secondary hover:border-primary/30 hover:text-primary transition-all cursor-pointer shadow-sm"
            >
              <Receipt className="w-3.5 h-3.5 text-primary" />
              <span>Historial</span>
            </button>

            {canRefund && (
              <button
                type="button"
                onClick={onOpenCambios}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-dark border border-border-card rounded-xl text-xs font-semibold text-secondary hover:border-indigo-500/30 hover:text-indigo-400 transition-all cursor-pointer shadow-sm"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" />
                <span>Cambios</span>
              </button>
            )}

            {canOpenCloseCash && (
              <button
                type="button"
                onClick={onOpenCierre}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/20 transition-all cursor-pointer shadow-sm"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cerrar Caja</span>
              </button>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={handleAperturaClick}
            disabled={isAperturaDisabled}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm ${
              isAperturaDisabled
                ? 'bg-neutral/10 border border-neutral/20 text-neutral cursor-not-allowed opacity-60'
                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 cursor-pointer'
            }`}
            title={aperturaTooltip}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Apertura de Caja</span>
          </button>
        )}
      </div>
    </div>
  );
};
