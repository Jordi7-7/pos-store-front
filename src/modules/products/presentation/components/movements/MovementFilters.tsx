import React from 'react';
import { type DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/shared/presentation/components/SearchInput';
import { InventoryMovementType, type InventoryMovementCategory } from '../../../domain/enums';
import { DateRangeFilter } from './DateRangeFilter';
import { MovementCategoryFilter } from './MovementCategoryFilter';

interface MovementFiltersProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange | undefined) => void;
  type: InventoryMovementType | undefined;
  onTypeChange: (type: InventoryMovementType | undefined) => void;
  category: InventoryMovementCategory | undefined;
  onCategoryChange: (category: InventoryMovementCategory | undefined) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

const TYPE_OPTIONS: { value: InventoryMovementType | undefined; label: string }[] = [
  { value: undefined, label: 'Todos' },
  { value: InventoryMovementType.IN, label: 'Entradas' },
  { value: InventoryMovementType.OUT, label: 'Salidas' },
];

const chip = (active: boolean) => `h-8 rounded-full px-3 text-xs font-semibold ${active ? '' : 'text-secondary'}`;

/** Filtros del historial de movimientos: fechas, búsqueda, tipo (entrada/salida) y categoría. */
export const MovementFilters: React.FC<MovementFiltersProps> = ({ dateRange, onDateRangeChange, type, onTypeChange, category, onCategoryChange, search, onSearchChange }) => (
  <div className="space-y-3">
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:max-w-3xl">
      <DateRangeFilter dateRange={dateRange} onChange={onDateRangeChange} />

      <MovementCategoryFilter category={category} onChange={onCategoryChange} />

      <SearchInput value={search} onValueChange={onSearchChange} placeholder="Buscar por producto o SKU…" aria-label="Buscar movimiento" className="sm:flex-1" />
    </div>

    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Tipo de movimiento">
      {TYPE_OPTIONS.map((option) => (
        <Button key={option.label} type="button" size="sm" variant={type === option.value ? 'default' : 'outline'} className={chip(type === option.value)} onClick={() => onTypeChange(option.value)}>
          {option.label}
        </Button>
      ))}
    </div>
  </div>
);
