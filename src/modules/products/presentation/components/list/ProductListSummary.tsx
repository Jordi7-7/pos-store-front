import React from 'react';
import { Barcode, FilterX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductListSummaryProps {
  total: number;
  /** Sin sucursal elegida, las existencias son la suma de todas. */
  isConsolidated: boolean;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  canPrint: boolean;
  selectedCount: number;
  onPrintSelected: () => void;
}

const countFormat = new Intl.NumberFormat('es');

/**
 * Franja de la tarjeta, sobre la tabla: a la izquierda cuántos productos hay con los filtros puestos y de qué sucursal(es) son
 * las existencias; a la derecha las acciones que dependen del contexto (limpiar filtros si hay alguno, imprimir lo seleccionado).
 */
export const ProductListSummary: React.FC<ProductListSummaryProps> = ({ total, isConsolidated, hasActiveFilters, onClearFilters, canPrint, selectedCount, onPrintSelected }) => (
  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border px-4 py-3">
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className="text-sm font-medium text-foreground">{countFormat.format(total)} producto(s)</span>
      <span className={`text-xs ${isConsolidated ? 'text-amber-600' : 'text-muted-foreground'}`}>
        {isConsolidated ? 'Existencias sumadas de todas las sucursales' : 'Existencias de la sucursal seleccionada'}
      </span>
    </div>

    {(hasActiveFilters || (canPrint && selectedCount > 0)) && (
      <div className="flex flex-wrap items-center gap-2">
        {hasActiveFilters && (
          <Button type="button" variant="ghost" size="sm" onClick={onClearFilters} className="gap-1.5 text-xs text-muted-foreground">
            <FilterX /> Limpiar filtros
          </Button>
        )}
        {canPrint && selectedCount > 0 && (
          <Button type="button" size="sm" onClick={onPrintSelected} className="gap-1.5">
            <Barcode /> Imprimir etiquetas ({selectedCount})
          </Button>
        )}
      </div>
    )}
  </div>
);
