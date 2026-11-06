import React from 'react';
import { Loader2, Receipt, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { ActiveCashSessionEntity } from '@/modules/cash-sessions/domain/entities/cash-session.entity';
import type { CashSessionDetailsVM } from '@/modules/cash-sessions/presentation/view-models/cash-session.vm';
import type { ClosingDetailsStatus } from '@/modules/cash-sessions/presentation/view-models/closing-details-status';
import { buildClosingSummary } from '@/modules/cash-sessions/domain/rules/closing-summary';
import { cashDifference, parseCountedCash } from '@/modules/cash-sessions/domain/rules/cash-closing';
import { ClosingCashAudit } from './ClosingCashAudit';
import { ClosingSalesSummary } from './ClosingSalesSummary';
import { ClosingMovements } from './ClosingMovements';
import { ClosingCountForm } from './ClosingCountForm';

interface CierreModalProps {
  isOpen: boolean;
  onClose: () => void;
  closingBalance: string;
  setClosingBalance: (val: string) => void;
  onCloseSession: () => void;
  isClosing: boolean;
  activeSession: ActiveCashSessionEntity | null;
  sessionDetails?: CashSessionDetailsVM | null;
  detailsStatus: ClosingDetailsStatus;
}

/** Cierre de caja (corte Z): resumen real del turno, conteo del efectivo y cuadre. */
export const CierreModal: React.FC<CierreModalProps> = ({
  isOpen,
  onClose,
  closingBalance,
  setClosingBalance,
  onCloseSession,
  isClosing,
  activeSession,
  sessionDetails,
  detailsStatus,
}) => {
  const isReady = detailsStatus === 'ready';
  const summary = buildClosingSummary(sessionDetails ?? null, activeSession?.openingBalance ?? 0);
  const countedCash = parseCountedCash(closingBalance);
  const difference = isReady && countedCash !== null ? cashDifference(countedCash, summary.expectedCash) : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-xl bg-card border border-border text-card-foreground rounded-2xl shadow-2xl p-5 max-h-[92vh] flex flex-col">
        {/* Encabezado */}
        <DialogHeader className="border-b border-border pb-3 shrink-0">
          <div className="flex items-center justify-between">
 <DialogTitle className="text-base font-semibold text-secondary flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" />
              <span>Cierre de Caja Registradora (Corte Z)</span>
            </DialogTitle>
            <div className="flex items-center gap-2">
              {activeSession?.cashRegisterName && (
                <span className="text-xs text-neutral bg-bg-dark border border-border-card px-2 py-0.5 rounded-lg font-medium">
                  Caja: <strong className="text-secondary">{activeSession.cashRegisterName}</strong>
                </span>
              )}
              {activeSession?.openedByName && (
                <span className="text-xs text-neutral bg-bg-dark border border-border-card px-2 py-0.5 rounded-lg font-medium">
                  Cajero: <strong className="text-secondary">{activeSession.openedByName}</strong>
                </span>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Contenedor desplazable */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 py-3 min-h-0 text-xs">
          
          {!isReady && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-600">
              {detailsStatus === 'loading' ? (
                <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <p className="text-xs font-medium leading-snug">
                {detailsStatus === 'loading'
                  ? 'Cargando el resumen del turno…'
                  : 'No se pudo cargar el resumen del turno (efectivo esperado y movimientos). Puedes cerrar la caja contando el efectivo; el sistema calculará la diferencia. Si falla siempre, pide a un administrador el permiso para consultar sesiones de caja.'}
              </p>
            </div>
          )}

          {isReady && (
            <>
              {/* Bloques sincronizados 1:1 con el ticket térmico de cierre */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ClosingCashAudit summary={summary} />
                <ClosingSalesSummary summary={summary} />
              </div>
              <ClosingMovements
                sales={sessionDetails?.sales ?? []}
                expenses={sessionDetails?.expenses ?? []}
                refunds={sessionDetails?.refunds ?? []}
                productsSummary={summary.productsSummary}
                salesCount={summary.salesCount}
              />
            </>
          )}

          <ClosingCountForm
            closingBalance={closingBalance}
            setClosingBalance={setClosingBalance}
            expectedCash={isReady ? summary.expectedCash : null}
            difference={difference}
          />
        </div>

        {/* Botón de Confirmación */}
        <div className="border-t border-border pt-3 shrink-0">
          <button 
            onClick={onCloseSession}
            disabled={isClosing || closingBalance === ''}
            className="w-full h-10 bg-primary hover:bg-primary-hover disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isClosing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Cerrar Caja y Emitir Corte Z</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CierreModal;
