import React from 'react';
import { ArrowDownRight, Boxes, ChevronDown, ListFilter, Package, SlidersHorizontal, X, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BatchOriginLabels, type BatchOriginType } from '../../../domain/enums';
import { BATCH_ORIGIN_TYPES, toggleOriginType } from '../../../domain/rules/batch-origin-filter';

/** Mismos iconos y colores que la etiqueta de origen de cada lote (`OriginBadge`). */
const ORIGIN_ICON: Record<BatchOriginType, { icon: LucideIcon; color: string }> = {
  PURCHASE: { icon: Boxes, color: 'text-emerald-500' },
  INITIAL_STOCK: { icon: Package, color: 'text-blue-500' },
  ADJUSTMENT: { icon: SlidersHorizontal, color: 'text-violet-400' },
  REFUND: { icon: ArrowDownRight, color: 'text-amber-500' },
};

interface BatchOriginFilterProps {
  selected: readonly BatchOriginType[];
  onChange: (types: BatchOriginType[]) => void;
}

/** Selector desplegable de tipos de lote (selección múltiple); el botón muestra cuántos filtros hay aplicados. */
export const BatchOriginFilter: React.FC<BatchOriginFilterProps> = ({ selected, onChange }) => {
  const count = selected.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            id="batches-origin-filter"
            aria-label={count > 0 ? `Tipo de lote: ${count} filtro(s) aplicado(s)` : 'Filtrar por tipo de lote'}
            className={`h-9 w-full justify-start gap-2 rounded-xl border bg-bg-dark px-3 text-xs font-semibold hover:bg-muted sm:w-auto ${
              count > 0 ? 'border-primary/40 text-primary' : 'border-border-card text-secondary'
            }`}
          >
            <ListFilter className="h-4 w-4 text-neutral" />
            <span>Tipo de lote</span>
            {count > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
                {count}
              </span>
            )}
            <ChevronDown className="ml-auto h-4 w-4 text-neutral sm:ml-1" />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{count === 0 ? 'Mostrando todos los tipos' : `${count} de ${BATCH_ORIGIN_TYPES.length} tipos seleccionados`}</DropdownMenuLabel>
          {BATCH_ORIGIN_TYPES.map((type) => {
            const { icon: Icon, color } = ORIGIN_ICON[type];
            return (
              <DropdownMenuCheckboxItem key={type} checked={selected.includes(type)} onCheckedChange={() => onChange(toggleOriginType(selected, type))} className="py-2 text-xs font-medium">
                <Icon className={`h-4 w-4 ${color}`} />
                {BatchOriginLabels[type]}
              </DropdownMenuCheckboxItem>
            );
          })}
        </DropdownMenuGroup>
        {count > 0 && (
          <>
            <DropdownMenuSeparator />
            <button
              type="button"
              onClick={() => onChange([])}
              className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-2 text-xs font-medium text-neutral hover:bg-accent hover:text-secondary"
            >
              <X className="h-4 w-4" />
              Limpiar filtro
            </button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
