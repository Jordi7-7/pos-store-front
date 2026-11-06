import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { type DateRange } from 'react-day-picker';

/** Filtros y paginación de la lista de lotes. La búsqueda espera 350 ms a que se deje de teclear; cualquier filtro vuelve a la página 1. */
export function useBatchFilters() {
  const [dateRange, setDateRangeState] = useState<DateRange | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimitState] = useState(10);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const setDateRange = (range: DateRange | undefined) => {
    setDateRangeState(range);
    setPage(1);
  };
  const setLimit = (value: number) => {
    setLimitState(value);
    setPage(1);
  };

  return {
    dateRange,
    setDateRange,
    search,
    setSearch,
    page,
    setPage,
    limit,
    setLimit,
    startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
    searchTerm: debouncedSearch.trim() || undefined,
  };
}
