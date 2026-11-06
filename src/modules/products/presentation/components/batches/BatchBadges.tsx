import React from 'react';
import { ArrowDownRight, Boxes, Clock, Package, SlidersHorizontal } from 'lucide-react';
import { barWidth, stockLevel } from '../../../domain/rules/batch-level';
import { BatchStatus } from '../../../domain/enums';

const LEVEL_COLOR = { high: 'bg-emerald-500', medium: 'bg-amber-500', low: 'bg-rose-500' } as const;

/** Relleno de una barra de progreso: ancho según el porcentaje que queda y color según su nivel. */
export const LevelFill: React.FC<{ percent: number }> = ({ percent }) => (
  <div className={`h-full rounded-full ${LEVEL_COLOR[stockLevel(percent)]}`} style={{ width: `${barWidth(percent)}%` }} />
);

/** Etiqueta del origen de un lote: compra, stock inicial, ajuste, devolución u otro. */
export const OriginBadge: React.FC<{ originType: string; originLabel: string }> = ({ originType, originLabel }) => {
  switch (originType) {
  case 'PURCHASE':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <Boxes className="w-3 h-3" />
          {originLabel}
        </span>
      );
  case 'INITIAL_STOCK':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
          <Package className="w-3 h-3" />
          {originLabel || 'Stock inicial'}
        </span>
      );
  case 'ADJUSTMENT':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
          <SlidersHorizontal className="w-3 h-3" />
          {originLabel || 'Ajuste de inventario'}
        </span>
      );
  case 'REFUND':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <ArrowDownRight className="w-3 h-3" />
          {originLabel}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <Clock className="w-3 h-3" />
          {originLabel}
        </span>
      );
  }
};

/** Etiqueta del estado de un lote: disponible, agotado o anulado. */
export const StatusBadge: React.FC<{ status: BatchStatus }> = ({ status }) => {
  switch (status) {
  case BatchStatus.CANCELLED:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Anulado
        </span>
      );
  case BatchStatus.DEPLETED:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-neutral/10 text-neutral border border-neutral/20">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral/60" />
          Agotado
        </span>
      );
  case BatchStatus.ACTIVE:
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Disponible
        </span>
      );
  }
};
