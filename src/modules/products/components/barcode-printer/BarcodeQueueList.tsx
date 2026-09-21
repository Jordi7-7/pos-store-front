import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import type { BarcodeLabelItem } from './types';

interface BarcodeQueueListProps {
  items: BarcodeLabelItem[];
  previewIndex: number;
  onSelectPreview: (index: number) => void;
  onQuantityChange: (sku: string, delta: number) => void;
  onSetQuantity: (sku: string, qty: number) => void;
  onRemoveItem: (sku: string) => void;
  onSetAllQuantities: (qty: number) => void;
}

export const BarcodeQueueList: React.FC<BarcodeQueueListProps> = ({
  items,
  previewIndex,
  onSelectPreview,
  onQuantityChange,
  onSetQuantity,
  onRemoveItem,
  onSetAllQuantities,
}) => {
  return (
    <div className="flex flex-col h-full border border-border/80 rounded-xl bg-card overflow-hidden">
      {/* Barra superior de acciones rápidas */}
      <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between gap-2 shrink-0">
        <span className="text-xs font-bold uppercase tracking-wider text-foreground truncate">
          Cola de Impresión ({items.length})
        </span>
        <div className="flex items-center gap-1.5 shrink-0 text-xs">
          <span className="text-[11px] text-muted-foreground hidden sm:inline">Poner a todos:</span>
          {[1, 5, 10].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => onSetAllQuantities(num)}
              className="px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition-colors cursor-pointer border border-border/50"
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de productos scrolleable */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.length === 0 ? (
          <div className="py-16 text-center text-xs text-muted-foreground">
            No has seleccionado ningún producto para imprimir.
          </div>
        ) : (
          items.map((item, idx) => {
            const isSelected = previewIndex === idx;
            return (
              <div
                key={item.sku}
                onClick={() => onSelectPreview(idx)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer gap-3 ${
                  isSelected
                    ? 'bg-primary/10 border-primary/50 ring-1 ring-primary/20 shadow-xs'
                    : 'bg-background border-border/80 hover:border-primary/40'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-primary">{item.sku}</span>
                    <span className="text-[11px] font-bold text-emerald-600 font-mono">
                      ${Number(item.price).toFixed(2)}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-foreground truncate mt-0.5" title={item.name}>
                    {item.name}
                  </div>
                </div>

                {/* Controles de cantidad */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center border border-border rounded-lg bg-card overflow-hidden shadow-2xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuantityChange(item.sku, -1);
                      }}
                      className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Restar 1"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => onSetQuantity(item.sku, parseInt(e.target.value))}
                      className="w-11 text-center text-xs font-mono font-bold bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuantityChange(item.sku, 1);
                      }}
                      className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Sumar 1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveItem(item.sku);
                    }}
                    className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors cursor-pointer"
                    title="Quitar producto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
