import React from 'react';
import { ChevronDown, ListFilter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { InventoryMovementCategory, InventoryMovementCategoryLabels } from '../../../domain/enums';

const ALL = 'ALL';

interface MovementCategoryFilterProps {
  category: InventoryMovementCategory | undefined;
  onChange: (category: InventoryMovementCategory | undefined) => void;
}

/** Desplegable de categorías (una sola opción): el botón muestra la elegida. Son pocas y fijas: la clase de operación. */
export const MovementCategoryFilter: React.FC<MovementCategoryFilterProps> = ({ category, onChange }) => {
  const label = category ? InventoryMovementCategoryLabels[category] : 'Categoría';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            id="movements-category-filter"
            aria-label={category ? `Categoría: ${label}` : 'Filtrar por categoría'}
            className={`h-9 w-full justify-start gap-2 rounded-xl border bg-bg-dark px-3 text-xs font-semibold hover:bg-muted sm:w-auto ${category ? 'border-primary/40 text-primary' : 'border-border-card text-secondary'}`}
          >
            <ListFilter className="h-4 w-4 text-neutral" />
            <span>{label}</span>
            <ChevronDown className="ml-auto h-4 w-4 text-neutral sm:ml-1" />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuRadioGroup value={category ?? ALL} onValueChange={(value) => onChange(value === ALL ? undefined : Object.values(InventoryMovementCategory).find((candidate) => candidate === value))}>
          <DropdownMenuRadioItem value={ALL} className="py-2 text-xs font-medium">
            Todas las categorías
          </DropdownMenuRadioItem>
          {Object.values(InventoryMovementCategory).map((value) => (
            <DropdownMenuRadioItem key={value} value={value} className="py-2 text-xs font-medium">
              {InventoryMovementCategoryLabels[value]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
