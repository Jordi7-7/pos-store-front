import React from 'react';
import { ChevronRight } from 'lucide-react';
import { BatchStatus } from '../../../domain/enums';
import type { InventoryLotVM } from '../../view-models/inventory.vm';
import { LevelFill, OriginBadge, StatusBadge } from './BatchBadges';
import { LotItemsTable } from './LotItemsTable';

/** Columnas de la lista de lotes; la cabecera (`LotListHeader`) usa la misma plantilla para que alineen. */
export const LOT_GRID = 'md:grid-cols-[20px_minmax(0,1.6fr)_minmax(0,1.3fr)_140px_120px]';

/** Cabecera de columnas de la lista de lotes (solo en pantallas anchas). */
export const LotListHeader: React.FC = () => (
 <div className={`hidden gap-x-4 border-b border-border-card bg-muted/50 px-4 py-2 text-xs font-semibold text-muted-foreground md:grid ${LOT_GRID}`}>
    <span />
    <span>Lote</span>
    <span>Origen y estado</span>
    <span className="text-right">Stock</span>
    <span className="text-right">Valor</span>
  </div>
);

interface LotCardProps {
  lot: InventoryLotVM;
  isExpanded: boolean;
  onToggle: () => void;
}

/** Una fila por lote (cerrada por defecto); al abrirla muestra los productos que llegaron en él. */
export const LotCard: React.FC<LotCardProps> = ({ lot, isExpanded, onToggle }) => {
  const itemsLabel = `${lot.items.length} ${lot.items.length === 1 ? 'producto' : 'productos'}`;
  const isCancelled = lot.status === BatchStatus.CANCELLED;
  const stockTone = isCancelled ? 'text-rose-500' : lot.hasStock ? 'text-secondary' : 'text-muted-foreground';

  return (
    <div className="border-b border-border-card last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className={`grid w-full grid-cols-[20px_1fr_auto] items-center gap-x-4 gap-y-2 px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/40 ${LOT_GRID} ${isExpanded ? 'bg-muted/30' : ''}`}
      >
        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />

        <div className="min-w-0">
          <p className="truncate font-mono text-sm font-semibold text-secondary">{lot.displayTitle}</p>
          <p className="truncate text-xs text-muted-foreground">
            {lot.dateFormatted} · {lot.branchName} · {itemsLabel}
          </p>
        </div>

        {/* Valor en pantallas pequeñas: a la derecha del título */}
        <div className="text-right md:hidden">
          <p className="font-mono text-sm font-semibold text-secondary">{lot.totalCostFormatted}</p>
          <p className={`font-mono text-xs ${stockTone}`}>
            {lot.totalRemainingQuantity} / {lot.totalInitialQuantity}
          </p>
        </div>

        <div className="col-start-2 col-end-4 flex flex-wrap items-center gap-1.5 md:col-auto">
          <OriginBadge originType={lot.originType} originLabel={lot.originName} />
          <StatusBadge status={lot.status} />
        </div>

        <div className="hidden md:block">
          <p className={`text-right font-mono text-sm font-semibold ${stockTone}`}>
            {lot.totalRemainingQuantity} <span className="font-normal text-muted-foreground">/ {lot.totalInitialQuantity}</span>
          </p>
          {lot.totalInitialQuantity > 0 && !isCancelled && (
            <div className="ml-auto mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <LevelFill percent={lot.percentRemaining} />
            </div>
          )}
        </div>

        <div className="hidden text-right md:block">
          <p className="font-mono text-sm font-semibold text-secondary">{lot.totalCostFormatted}</p>
          <p className="font-mono text-xs text-muted-foreground">de {lot.totalInitialCostFormatted}</p>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-border-card bg-muted/20 px-4 py-3">
          <LotItemsTable items={lot.items} />
        </div>
      )}
    </div>
  );
};
