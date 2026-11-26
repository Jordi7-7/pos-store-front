import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import type { BarcodeLabelItem } from './types';
import { formatMoney } from '@/modules/auth/presentation/hooks/useSession';

interface BarcodeQueueListProps {
  items: BarcodeLabelItem[];
  previewIndex: number;
  onSelectPreview: (index: number) => void;
  onQuantityChange: (sku: string, delta: number) => void;
  onSetQuantity: (sku: string, qty: number) => void;
  onRemoveItem: (sku: string) => void;
  onSetAllQuantities: (qty: number) => void;
}

/** Lo que se va a imprimir: una fila por producto o variante, con cuántas etiquetas de cada una. */
export const BarcodeQueueList: React.FC<BarcodeQueueListProps> = ({ items, previewIndex, onSelectPreview, onQuantityChange, onSetQuantity, onRemoveItem, onSetAllQuantities }) => (
  <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border/80 bg-card">
    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-muted/30 p-3">
      <span className="truncate text-sm font-semibold text-foreground">Qué se imprime ({items.length})</span>
      <div className="flex shrink-0 items-center gap-1.5 text-xs">
        <span className="hidden text-muted-foreground sm:inline">Etiquetas de cada una:</span>
        {[1, 5, 10].map((num) => (
          <button key={num} type="button" onClick={() => onSetAllQuantities(num)} className="cursor-pointer rounded-md border border-border/50 bg-muted px-2.5 py-1 font-semibold text-foreground transition-colors hover:bg-muted/80">
            {num}
          </button>
        ))}
      </div>
    </div>

    <ul className="flex-1 space-y-2 overflow-y-auto p-3">
      {items.length === 0 ? (
        <li className="py-16 text-center text-sm text-muted-foreground">No hay productos para imprimir.</li>
      ) : (
        items.map((item, index) => (
          <li
            key={item.sku}
            aria-current={previewIndex === index}
            onClick={() => onSelectPreview(index)}
            className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 transition-all ${previewIndex === index ? 'border-primary/50 bg-primary/10 ring-1 ring-primary/20' : 'border-border/80 bg-background hover:border-primary/40'}`}
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-foreground" title={item.name}>{item.name}</div>
              {item.detail && <div className="truncate text-xs font-medium text-foreground/80">{item.detail}</div>}
              <div className="mt-0.5 flex items-center gap-2 text-xs">
                <span className="font-mono font-semibold text-primary">{item.sku}</span>
                <span className="font-mono font-semibold text-emerald-600">{formatMoney(Number(item.price))}</span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <div className="flex items-center overflow-hidden rounded-lg border border-border bg-card shadow-2xs">
                <button type="button" aria-label={`Una etiqueta menos de ${item.sku}`} onClick={(e) => { e.stopPropagation(); onQuantityChange(item.sku, -1); }} className="cursor-pointer p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <input type="number" min="1" aria-label={`Cantidad de etiquetas de ${item.sku}`} value={item.quantity} onClick={(e) => e.stopPropagation()} onChange={(e) => onSetQuantity(item.sku, parseInt(e.target.value))} className="w-11 bg-transparent text-center font-mono text-sm font-semibold focus:outline-none" />
                <button type="button" aria-label={`Una etiqueta más de ${item.sku}`} onClick={(e) => { e.stopPropagation(); onQuantityChange(item.sku, 1); }} className="cursor-pointer p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <button type="button" aria-label={`Quitar ${item.sku}`} onClick={(e) => { e.stopPropagation(); onRemoveItem(item.sku); }} className="cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" title="Quitar de la lista">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))
      )}
    </ul>
  </div>
);
