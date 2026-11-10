import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { type DateRange } from 'react-day-picker';
import { useTimezone } from '@/modules/auth/presentation/hooks/useSession';
import { requireDateRange, todayRange, type RequiredDateSpan } from '@/shared/domain/rules/date-range';
import type { BatchOriginType } from '../../domain/enums';

/** Filtros y paginación de la lista de lotes. La fecha siempre está puesta (por defecto, hoy en la zona de la tienda) para no traer todos los lotes. La búsqueda espera 350 ms a que se deje de teclear; cualquier filtro vuelve a la página 1. */
export function useBatchFilters() {
  const timezone = useTimezone();
  const [dateRange, setDateRangeState] = useState<RequiredDateSpan>(() => todayRange(timezone));
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [originTypes, setOriginTypesState] = useState<BatchOriginType[]>([]);
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
    setDateRangeState((current) => requireDateRange(range, current));
    setPage(1);
  };
  const setOriginTypes = (types: BatchOriginType[]) => {
    setOriginTypesState(types);
    setPage(1);
  };
  const setLimit = (value: number) => {
    setLimitState(value);
    setPage(1);
  };

  return {
    dateRange,
    setDateRange,
    originTypes,
    setOriginTypes,
    search,
    setSearch,
    page,
    setPage,
    limit,
    setLimit,
    startDate: format(dateRange.from, 'yyyy-MM-dd'),
    endDate: format(dateRange.to ?? dateRange.from, 'yyyy-MM-dd'),
    searchTerm: debouncedSearch.trim() || undefined,
  };
}
