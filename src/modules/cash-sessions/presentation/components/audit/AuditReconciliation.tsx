import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, Info } from 'lucide-react';
import type { CashSessionDetailsVM } from '../../view-models/cash-session.vm';
import { CashSessionDifferenceStatus } from '../../../domain/enums';

interface StepProps {
  label: string;
  value: string;
  note?: string;
  tone?: 'neutral' | 'in' | 'out';
}

const TONE = { neutral: 'text-secondary', in: 'text-emerald-700', out: 'text-rose-600' } as const;

/** Un paso de la cuenta del efectivo: nombre, importe (con su signo) y una nota corta. */
const Step: React.FC<StepProps> = ({ label, value, note, tone = 'neutral' }) => (
  <div className="min-w-0">
    <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
    <dd className={`mt-1 text-xl font-semibold tabular-nums tracking-tight ${TONE[tone]}`}>{value}</dd>
    <p className="mt-0.5 min-h-4 text-xs text-muted-foreground">{note}</p>
  </div>
);

/** Qué dice el arqueo: cuadró, sobra o falta (o aún no se ha contado). */
const Verdict: React.FC<{ details: CashSessionDetailsVM }> = ({ details }) => {
  const { session } = details;
  if (!session.isClosed) {
    return (
      <div className="flex h-full flex-col justify-between rounded-xl border border-border-card bg-muted/40 p-4 sm:p-5">
        <p className="text-xs font-medium text-muted-foreground">Contado al cierre</p>
        <div>
          <p className="text-xl font-semibold text-muted-foreground">Pendiente</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="size-4" />
            El turno sigue en curso
          </p>
        </div>
      </div>
    );
  }

  const status = session.differenceStatus;
  const exact = status === CashSessionDifferenceStatus.EXACT;
  const surplus = status === CashSessionDifferenceStatus.SURPLUS;
  const palette = exact ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800' : surplus ? 'border-blue-500/30 bg-blue-500/10 text-blue-800' : 'border-rose-500/30 bg-rose-500/10 text-rose-800';
  const Icon = exact ? CheckCircle2 : AlertTriangle;

  return (
    <div className={`flex h-full flex-col justify-between rounded-xl border p-4 sm:p-5 ${palette}`}>
      <p className="text-xs font-medium opacity-80">Contado al cierre</p>
      <div>
        <p className="text-2xl font-semibold tabular-nums tracking-tight">{session.closingBalanceFormatted}</p>
        <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
          <Icon className="size-4" />
          {session.differenceStatusText}
        </p>
      </div>
    </div>
  );
};

/** Conciliación del efectivo de un turno: la cuenta paso a paso, el resultado del conteo y el resumen de ventas. */
export const AuditReconciliation: React.FC<{ details: CashSessionDetailsVM }> = ({ details }) => {
  const { session, kpis } = details;
  return (
    <section aria-label="Conciliación de efectivo" className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-xl border border-border-card bg-bg-dark/60 p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-secondary">Efectivo en la gaveta</h3>
          <p className="text-xs text-muted-foreground">Lo que debería haber según los movimientos del turno.</p>
          <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-5">
            <Step label="Fondo de apertura" value={session.openingBalanceFormatted} note="Base para dar cambio" />
            <Step label="Cobros en efectivo" value={`+${kpis.cashSalesFormatted}`} tone="in" note="Entró a la gaveta" />
            <Step label="Gastos y retiros" value={kpis.totalExpensesFormatted} tone="out" note={kpis.expensesLabel} />
            <Step label="Devoluciones" value={kpis.totalRefundsFormatted} tone="out" note={kpis.refundsLabel} />
            <div className="col-span-2 min-w-0 rounded-lg bg-primary px-3 py-2 text-primary-foreground sm:col-span-1">
              <dt className="text-xs font-medium opacity-80">= Esperado</dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums tracking-tight">{session.expectedBalanceFormatted}</dd>
            </div>
          </dl>
        </div>
        <Verdict details={details} />
      </div>

      <dl className="flex flex-wrap items-center gap-x-8 gap-y-2 rounded-lg bg-muted/40 px-4 py-3 text-sm">
        <div className="flex items-baseline gap-2">
          <dt className="text-muted-foreground">Ventas netas</dt>
          <dd className="font-semibold tabular-nums text-secondary">{kpis.netSalesFormatted}</dd>
        </div>
        <div className="flex items-baseline gap-2">
          <dt className="text-muted-foreground">Efectivo</dt>
          <dd className="font-medium tabular-nums">{kpis.cashSalesFormatted}</dd>
        </div>
        <div className="flex items-baseline gap-2">
          <dt className="text-muted-foreground">Tarjeta</dt>
          <dd className="font-medium tabular-nums">{kpis.cardSalesFormatted}</dd>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground sm:ml-auto">
          <Info className="size-3.5" />
          Las ventas con tarjeta no entran a la gaveta.
        </p>
      </dl>
    </section>
  );
};
