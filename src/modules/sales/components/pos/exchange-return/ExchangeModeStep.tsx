import React from 'react';
import { RotateCcw, ArrowLeftRight } from 'lucide-react';
import type { SaleItemRow } from './exchange-return.types';
import { formatMoney } from './exchange-return.types';

interface ExchangeModeStepProps {
  selectedReturnItems: SaleItemRow[];
  totalToReturn: number;
  onSelectRefund: () => void;
  onSelectExchange: () => void;
}

export const ExchangeModeStep: React.FC<ExchangeModeStepProps> = ({
  selectedReturnItems,
  totalToReturn,
  onSelectRefund,
  onSelectExchange,
}) => {
  return (
    <div className="flex flex-col gap-4 pt-2">
      <p className="text-xs text-muted-foreground">
        ¿Qué deseas hacer con las <strong>{selectedReturnItems.length}</strong> prenda(s) seleccionadas?
      </p>

      {/* Refund only */}
      <button
        type="button"
        onClick={onSelectRefund}
        className="group flex items-start gap-4 rounded-xl border border-border bg-muted/30 hover:bg-rose-500/8 hover:border-rose-500/30 p-4 text-left transition-all active:scale-[0.98] cursor-pointer"
      >
        <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center shrink-0 group-hover:bg-rose-500/25 transition-colors">
          <RotateCcw className="w-5 h-5 text-rose-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Solo Devolución</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Devolución directo de {formatMoney(totalToReturn)} al cliente. Las prendas vuelven al inventario.
          </p>
        </div>
      </button>

      {/* Exchange */}
      <button
        type="button"
        onClick={onSelectExchange}
        className="group flex items-start gap-4 rounded-xl border border-border bg-muted/30 hover:bg-indigo-500/8 hover:border-indigo-500/30 p-4 text-left transition-all active:scale-[0.98] cursor-pointer"
      >
        <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/25 transition-colors">
          <ArrowLeftRight className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Cambio de Prenda</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Devuelve las prendas seleccionadas y escanea las nuevas. Se calcula la diferencia a cobrar o devolver.
          </p>
        </div>
      </button>
    </div>
  );
};
