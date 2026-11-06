import React from 'react';
import { Info, DollarSign, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatMoney } from '@/modules/auth/presentation/hooks/useSession';
import { classifyDifference } from '@/modules/cash-sessions/domain/cash-closing';

/** Conteo físico del efectivo y banner de cuadre. El esperado solo se muestra si hay resumen real del turno. */
interface ClosingCountFormProps {
  closingBalance: string;
  setClosingBalance: (value: string) => void;
  /** `null` mientras el resumen del turno no está disponible. */
  expectedCash: number | null;
  /** `null` si no hay esperado o el importe contado no es válido. */
  difference: number | null;
}

export const ClosingCountForm: React.FC<ClosingCountFormProps> = ({ closingBalance, setClosingBalance, expectedCash, difference }) => {
  const kind = difference === null ? null : classifyDifference(difference);
  const isExact = kind === 'EXACT';
  const isSurplus = kind === 'SURPLUS';
  const isShortage = kind === 'SHORTAGE';

  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center justify-between">
        <label className="block text-[10px] text-neutral uppercase tracking-wider font-bold">
          Monto de Cierre Físico en Gaveta ($)
        </label>
        {expectedCash !== null && (
          <span className="text-[10px] text-neutral">
            Esperado: <strong className="text-primary font-mono">{formatMoney(expectedCash)}</strong>
          </span>
        )}
      </div>

      <div className="relative">
        <DollarSign className="w-4 h-4 text-neutral absolute left-3 top-1/2 -translate-y-1/2" />
        <input 
          type="number" 
          step="0.01"
          value={closingBalance}
          onChange={(e) => setClosingBalance(e.target.value)}
          placeholder="Ingresa el dinero físico contado en el cajón..."
          className="w-full bg-bg-dark border border-border-card rounded-xl py-2.5 pl-9 pr-3.5 text-xs text-foreground font-mono font-bold focus:outline-none focus:ring-1 focus:ring-primary"
          autoFocus
        />
      </div>

      {/* Banner de Estado del Cuadre */}
      {closingBalance !== '' && difference !== null && (
        <div
          className={`p-2.5 rounded-xl border flex justify-between items-center text-xs font-bold transition-all ${
            isExact
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
              : isShortage
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
              : isSurplus
              ? 'bg-blue-500/10 border-blue-500/30 text-blue-500'
              : 'bg-muted/10 border-muted text-muted-foreground'
          }`}
        >
          <div className="flex items-center gap-1.5">
            {isExact ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span className="text-[10px] uppercase tracking-wider">
              {isExact
                ? '✓ Caja Cuadrada Exacta'
                : isShortage
                ? '⚠ Faltante en Caja'
                : '▲ Sobrante en Caja'}
            </span>
          </div>
          <span className="font-mono text-sm font-black">
            {difference > 0 ? `+${formatMoney(difference)}` : formatMoney(difference)}
          </span>
        </div>
      )}

      <p className="text-[9.5px] text-neutral flex items-center gap-1 leading-normal">
        <Info className="w-3 h-3 text-primary shrink-0" />
        Cuenta el dinero físico real (billetes y monedas) en la gaveta. Al confirmar se generará el ticket de corte Z.
      </p>
    </div>
  );
};
