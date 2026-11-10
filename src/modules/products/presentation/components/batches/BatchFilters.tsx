import React from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { type DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { SearchInput } from '@/shared/presentation/components/SearchInput';
import { BatchOriginFilter } from './BatchOriginFilter';
import type { BatchOriginType } from '../../../domain/enums';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface BatchFiltersProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  originTypes: readonly BatchOriginType[];
  onOriginTypesChange: (types: BatchOriginType[]) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

/** Barra de filtros de los lotes: rango de fechas, búsqueda y expandir/colapsar todos. */
export const BatchFilters: React.FC<BatchFiltersProps> = ({ dateRange, onDateRangeChange, originTypes, onOriginTypesChange, search, onSearchChange, onExpandAll, onCollapseAll }) => (
  <>
  {/* Controls Bar */}
  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
    <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:max-w-2xl">
      {/* Date Range Picker */}
      <div className="relative">
        <Popover>
          <PopoverTrigger render={
            <Button
              variant="outline"
              id="batches-date-picker-range"
              className="w-full sm:w-64 justify-start px-3 py-2 text-xs font-semibold bg-bg-dark border border-border-card rounded-xl h-9 hover:bg-muted text-secondary"
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-neutral" />
              {dateRange?.from ? (
                dateRange.to ? `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}` : format(dateRange.from, 'dd/MM/yyyy')
              ) : <span className="text-neutral">Filtrar por fecha...</span>}
            </Button>
          } />
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={onDateRangeChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        {dateRange?.from && (
          <button
            type="button"
            onClick={() => onDateRangeChange(undefined)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral hover:text-secondary rounded"
            title="Limpiar fecha"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <BatchOriginFilter selected={originTypes} onChange={onOriginTypesChange} />

      <SearchInput value={search} onValueChange={onSearchChange} placeholder="Buscar por lote, producto o factura…" aria-label="Buscar lote" className="sm:flex-1" />
    </div>

    <div className="flex flex-wrap items-center gap-2">
      {/* Actions to Expand / Collapse */}
      <div className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={onExpandAll}>
          Expandir todos
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCollapseAll}>
          Cerrar todos
        </Button>
      </div>
    </div>
  </div>
  </>
);
