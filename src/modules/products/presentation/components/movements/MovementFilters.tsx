import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { type DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SearchInput } from '@/shared/presentation/components/SearchInput';
import { InventoryMovementType, type InventoryMovementCategory } from '../../../domain/enums';
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
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              id="movements-date-picker-range"
              className="w-full sm:w-64 justify-start px-3 py-2 text-xs font-semibold bg-bg-dark border border-border-card rounded-xl h-9 hover:bg-muted text-secondary"
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-neutral" />
              {dateRange.from && dateRange.to && dateRange.to.getTime() !== dateRange.from.getTime()
                ? `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}`
                : dateRange.from && format(dateRange.from, 'dd/MM/yyyy')}
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="range" defaultMonth={dateRange.from} selected={dateRange} onSelect={onDateRangeChange} numberOfMonths={2} />
        </PopoverContent>
      </Popover>

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
