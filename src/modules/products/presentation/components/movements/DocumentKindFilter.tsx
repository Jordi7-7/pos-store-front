import React from 'react';
import { ChevronDown } from 'lucide-react';
import { InventoryDocumentKind } from '../../../domain/enums';

const KIND_LABELS: Record<InventoryDocumentKind, string> = {
  [InventoryDocumentKind.ENTRY]: 'Entradas',
  [InventoryDocumentKind.EXIT]: 'Salidas',
  [InventoryDocumentKind.COUNT]: 'Conteos físicos',
  [InventoryDocumentKind.TRANSFER]: 'Traslados',
};

interface DocumentKindFilterProps {
  kind: InventoryDocumentKind | undefined;
  onChange: (kind: InventoryDocumentKind | undefined) => void;
}

/** Desplegable del tipo de documento (entrada, salida, conteo o traslado); sin elegir, todos. */
export const DocumentKindFilter: React.FC<DocumentKindFilterProps> = ({ kind, onChange }) => (
  <div className="relative">
    <select
      aria-label="Tipo de documento"
      value={kind ?? ''}
      onChange={(event) => onChange(Object.values(InventoryDocumentKind).find((candidate) => candidate === event.target.value))}
      className={`h-9 cursor-pointer appearance-none rounded-xl border bg-bg-dark pl-3 pr-9 text-xs font-semibold text-secondary transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${kind ? 'border-primary/40 text-primary' : 'border-border-card'}`}
    >
      <option value="">Todos los tipos</option>
      {Object.values(InventoryDocumentKind).map((value) => (
        <option key={value} value={value}>
          {KIND_LABELS[value]}
        </option>
      ))}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral" />
  </div>
);
