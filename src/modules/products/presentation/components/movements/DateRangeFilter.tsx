import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { type DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DateRangeFilterProps {
  dateRange: DateRange;
  onChange: (range: DateRange | undefined) => void;
}

/** Selector de rango de fechas de los historiales de inventario: el botón muestra el rango y abre un calendario doble. */
export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ dateRange, onChange }) => (
  <Popover>
    <PopoverTrigger
      render={
        <Button variant="outline" id="movements-date-picker-range" className="h-9 w-full justify-start rounded-xl border border-border-card bg-bg-dark px-3 py-2 text-xs font-semibold text-secondary hover:bg-muted sm:w-64">
          <CalendarIcon className="mr-2 h-4 w-4 text-neutral" />
          {dateRange.from && dateRange.to && dateRange.to.getTime() !== dateRange.from.getTime()
            ? `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}`
            : dateRange.from && format(dateRange.from, 'dd/MM/yyyy')}
        </Button>
      }
    />
    <PopoverContent className="w-auto p-0" align="start">
      <Calendar mode="range" defaultMonth={dateRange.from} selected={dateRange} onSelect={onChange} numberOfMonths={2} />
    </PopoverContent>
  </Popover>
);
