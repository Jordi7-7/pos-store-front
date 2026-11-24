import { useEffect, useState } from 'react';
import { format, subDays } from 'date-fns';
import { type DateRange } from 'react-day-picker';
import { useTimezone } from '@/modules/auth/presentation/hooks/useSession';
import { requireDateRange, todayRange, type RequiredDateSpan } from '@/shared/domain/rules/date-range';
import type { InventoryMovementCategory, InventoryMovementType } from '../../domain/enums';

const DEFAULT_DAYS = 7;

/** Filtros y paginación del historial de movimientos. La fecha siempre está puesta (por defecto, los últimos 7 días en la zona de la tienda). La búsqueda espera 350 ms a que se deje de teclear; cualquier filtro vuelve a la página 1. */
export function useMovementFilters() {
  const timezone = useTimezone();
  const [dateRange, setDateRangeState] = useState<RequiredDateSpan>(() => {
    const today = todayRange(timezone);
    return { from: subDays(today.from, DEFAULT_DAYS - 1), to: today.to ?? today.from };
  });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [type, setTypeState] = useState<InventoryMovementType | undefined>();
  const [category, setCategoryState] = useState<InventoryMovementCategory | undefined>();
  const [page, setPage] = useState(1);
  const [limit, setLimitState] = useState(20);

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
  const setType = (value: InventoryMovementType | undefined) => {
    setTypeState(value);
    setPage(1);
  };
  const setCategory = (value: InventoryMovementCategory | undefined) => {
    setCategoryState(value);
    setPage(1);
  };
  const setLimit = (value: number) => {
    setLimitState(value);
    setPage(1);
  };

  return {
    dateRange,
    setDateRange,
    type,
    setType,
    category,
    setCategory,
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
