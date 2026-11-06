import React from 'react';
import { Building2, Calendar as CalendarIcon, ChevronDown, ChevronRight, Layers, Receipt } from 'lucide-react';
import { BatchStatus } from '../../../domain/enums';
import type { InventoryLotVM } from '../../view-models/inventory.vm';
import { LevelFill, OriginBadge, StatusBadge } from './BatchBadges';
import { LotItemsTable } from './LotItemsTable';

interface LotCardProps {
  lot: InventoryLotVM;
  isExpanded: boolean;
  onToggle: () => void;
}

/** Un lote de inventario: cabecera con origen, estado, stock y valor; al expandirlo, sus productos. */
export const LotCard: React.FC<LotCardProps> = ({ lot, isExpanded, onToggle }) => {
  const totalItems = lot.items.length;
  return (
    <div
      className={`border rounded-xl transition-all overflow-hidden ${
        isExpanded ? 'border-primary/40 bg-bg-dark/30 shadow-sm' : 'border-border-card bg-bg-dark/20 hover:border-border-card/80'
      }`}
    >
        {/* Lot Header Row */}
        <div
          onClick={() => onToggle()}
          className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none hover:bg-muted/10 transition-colors"
        >
          {/* Left: Origin & Identifier */}
          <div className="flex items-start md:items-center gap-3">
            <div className="mt-0.5 md:mt-0 text-neutral">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-primary" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-secondary text-sm flex items-center gap-1.5 font-mono">
                  <Layers className="w-4 h-4 text-primary" />
                  {lot.displayTitle}
                </span>
                {<OriginBadge originType={lot.originType} originLabel={lot.originName} />}
                {<StatusBadge status={lot.status} />}
                <span className="text-[10px] text-neutral flex items-center gap-1 font-sans">
                  <Building2 className="w-3 h-3 text-neutral/70" />
                  {lot.branchName}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-neutral">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3 text-neutral/70" />
                  {lot.dateFormatted}
                </span>
                <span>•</span>
                <span className="font-medium text-secondary">
                  {totalItems} {totalItems === 1 ? 'producto en este lote' : 'productos en este lote'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Aggregated Quantities and Cost */}
          <div className="flex flex-wrap items-center justify-between md:justify-end gap-5 pl-7 md:pl-0 border-t md:border-t-0 pt-2 md:pt-0 border-border-card/40">
            <div className="text-left md:text-right">
              <span className="text-[10px] uppercase font-bold text-neutral block">
                Stock Total Lote
              </span>
              <div className="font-mono text-xs font-semibold text-secondary">
                <span className={lot.status === BatchStatus.CANCELLED ? 'text-rose-500 font-bold' : lot.hasStock ? 'text-emerald-500 font-bold' : 'text-neutral'}>
                  {lot.totalRemainingQuantity}
                </span>
                <span className="text-neutral/70 text-[11px]"> / {lot.totalInitialQuantity}</span>
              </div>
              {lot.totalInitialQuantity > 0 && lot.status !== BatchStatus.CANCELLED && (
                <div className="w-20 md:ml-auto mt-1 h-1.5 rounded-full bg-muted/60 overflow-hidden">
                  <LevelFill percent={lot.percentRemaining} />
                </div>
              )}
            </div>

            {/* Financial Value: Initial vs Remaining */}
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-neutral block">
                Valor Lote
              </span>
              <div className="font-mono font-bold text-xs text-primary">
                {lot.totalCostFormatted}
                <span className="text-[10.5px] font-normal text-neutral/80 block">
                  Inicial: {lot.totalInitialCostFormatted}
                </span>
              </div>
              <span className={`text-[10px] font-semibold ${
                lot.status === BatchStatus.CANCELLED 
                  ? 'text-rose-500' 
                  : lot.hasStock 
                    ? 'text-emerald-500' 
                    : 'text-neutral/60'
              }`}>
                {lot.status === BatchStatus.CANCELLED ? 'Anulado' : lot.hasStock ? `${lot.percentDisplay}% disponible` : 'Agotado'}
              </span>
            </div>
          </div>
        </div>

      {isExpanded && (
        <div className="border-t border-border-card/80 bg-bg-card p-3">
          <div className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5 text-[10px]">
            <Receipt className="w-3.5 h-3.5 text-primary" />
            <span>Detalle de productos llegados en este lote ({lot.items.length}):</span>
          </div>
          <LotItemsTable items={lot.items} />
        </div>
      )}
    </div>
  );
};
