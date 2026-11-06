import React from 'react';
import { History, Lock, Unlock, User, Clock, Calendar, Printer, HelpCircle } from 'lucide-react';
import type { CashSessionDetailsVM } from '../../view-models/cash-session.vm';
import { Button } from '@/components/ui/button';

/** Cabecera de la auditoría: estado, caja, acciones de impresión y datos de apertura/cierre. */
interface AuditHeaderProps {
  details: CashSessionDetailsVM;
  showFormulasGuide: boolean;
  onToggleFormulasGuide: () => void;
  onPrintSessionTicket: () => void;
}

export const AuditHeader: React.FC<AuditHeaderProps> = ({ details, showFormulasGuide, onToggleFormulasGuide, onPrintSessionTicket }) => {
  return (
    <div className="border-b border-border/80 pb-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-xs">
            <History className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-secondary tracking-tight">
                Arqueo y Auditoría de Caja
              </h2>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  details.session.isClosed
                    ? 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                    : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                }`}
              >
                {details.session.isClosed ? (
                  <Lock className="w-3 h-3" />
                ) : (
                  <Unlock className="w-3 h-3 animate-pulse" />
                )}
                {details.session.isClosed ? 'Cerrada' : 'En Curso'}
              </span>
            </div>
            <p className="text-xs text-neutral mt-0.5">
              Supervisión integral de movimientos, arqueo en efectivo y balance de caja.
            </p>
          </div>
        </div>

        {/* Badges de Caja y Sucursal + Botón Imprimir Ticket de Sesión */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            onClick={() => onToggleFormulasGuide()}
            variant="outline"
            size="sm"
            className={`h-8 px-3 rounded-xl border text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition-all ${
              showFormulasGuide
                ? 'border-primary/40 bg-primary/20 text-primary'
                : 'border-border-card bg-bg-dark text-secondary hover:border-primary/40'
            }`}
            title="Explicación detallada de cómo se calcula cada valor de esta sesión"
          >
            <HelpCircle className="w-3.5 h-3.5 text-primary" />
            <span>{showFormulasGuide ? 'Ocultar Fórmulas' : '¿Cómo se calculan?'}</span>
          </Button>

          <Button
            type="button"
            onClick={onPrintSessionTicket}
            variant="outline"
            size="sm"
            className="h-8 px-3 rounded-xl border-primary/20 bg-primary/10 hover:bg-primary/20 text-xs font-bold text-primary shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
            title="Imprimir ticket de arqueo y cierre de sesión"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Ticket de Sesión</span>
          </Button>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-xl bg-bg-dark border border-border-card text-secondary">
            <span className="w-2 h-2 rounded-full bg-primary" />
            {details.session.cashRegisterName} (#{details.session.cashRegisterCode})
          </span>
          {details.session.branchName && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-xl bg-bg-dark border border-border-card text-neutral">
              {details.session.branchName}
            </span>
          )}
        </div>
      </div>

      {/* Meta details bar: Cajero, Duración, Apertura y Cierre */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border/50 text-xs">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-neutral shrink-0" />
          <div className="truncate">
            <span className="text-[10px] uppercase font-bold text-neutral block leading-none">
              Abierta por
            </span>
            <span className="font-semibold text-secondary truncate block mt-0.5">
              {details.session.openedByName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-neutral shrink-0" />
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral block leading-none">
              Tiempo Abierta
            </span>
            <span className="font-semibold text-primary font-mono block mt-0.5">
              {details.session.durationFormatted}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-neutral shrink-0" />
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral block leading-none">
              Hora Apertura
            </span>
            <span className="font-semibold text-secondary font-mono block mt-0.5">
              {details.session.openedAtFormatted}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-neutral shrink-0" />
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral block leading-none">
              Hora Cierre
            </span>
            <span className="font-semibold text-secondary font-mono block mt-0.5">
              {details.session.isClosed ? (
                details.session.closedAtFormatted
              ) : (
                <span className="text-emerald-600 font-sans font-bold">
                  Sesión activa
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
