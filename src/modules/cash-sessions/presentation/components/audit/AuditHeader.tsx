import React from 'react';
import { HelpCircle, Lock, Printer, Unlock } from 'lucide-react';
import type { CashSessionDetailsVM } from '../../view-models/cash-session.vm';
import { Button } from '@/components/ui/button';

interface AuditHeaderProps {
  details: CashSessionDetailsVM;
  showFormulasGuide: boolean;
  onToggleFormulasGuide: () => void;
  onPrintSessionTicket: () => void;
}

const Fact: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="min-w-0">
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="mt-0.5 truncate text-sm font-medium text-secondary">{children}</dd>
  </div>
);

/** Cabecera de la auditoría: qué turno es, su estado, quién lo abrió y cuándo, y las acciones. */
export const AuditHeader: React.FC<AuditHeaderProps> = ({ details, showFormulasGuide, onToggleFormulasGuide, onPrintSessionTicket }) => {
  const { session } = details;
  return (
    <div className="space-y-4 border-b border-border-card pb-5">
      <div className="flex flex-wrap items-start justify-between gap-3 pr-8">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl font-semibold tracking-tight text-secondary">Arqueo y auditoría de caja</h2>
            <span
              className={`inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium ${
                session.isClosed ? 'bg-zinc-500/10 text-zinc-600' : 'bg-emerald-500/10 text-emerald-700'
              }`}
            >
              {session.isClosed ? <Lock className="size-3" /> : <Unlock className="size-3" />}
              {session.isClosed ? 'Cerrada' : 'En curso'}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {session.cashRegisterName} (#{session.cashRegisterCode})
            {session.branchName ? ` · ${session.branchName}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onToggleFormulasGuide}
            aria-pressed={showFormulasGuide}
            aria-label="Cómo se calculan las cifras"
            title="Cómo se calculan las cifras"
            className={showFormulasGuide ? 'border-primary/40 bg-muted' : ''}
          >
            <HelpCircle />
          </Button>
          <Button type="button" variant="outline" onClick={onPrintSessionTicket} title="Imprimir el ticket de arqueo y cierre de este turno">
            <Printer />
            Imprimir ticket
          </Button>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        <Fact label="Abierta por">{session.openedByName}</Fact>
        <Fact label="Apertura">{session.openedAtFormatted}</Fact>
        <Fact label="Cierre">{session.isClosed ? session.closedAtFormatted : <span className="text-emerald-700">Turno activo</span>}</Fact>
        <Fact label="Duración">{session.durationFormatted}</Fact>
      </dl>
    </div>
  );
};
