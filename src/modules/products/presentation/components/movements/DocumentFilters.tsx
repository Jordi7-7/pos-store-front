import React from 'react';
import { type DateRange } from 'react-day-picker';
import { SearchInput } from '@/shared/presentation/components/SearchInput';
import type { InventoryDocumentKind } from '../../../domain/enums';
import { DateRangeFilter } from './DateRangeFilter';
import { DocumentKindFilter } from './DocumentKindFilter';

interface DocumentFiltersProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange | undefined) => void;
  kind: InventoryDocumentKind | undefined;
  onKindChange: (kind: InventoryDocumentKind | undefined) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

/** Filtros de la lista de documentos: fechas, tipo y búsqueda (por número, comentario o SKU de alguna línea). */
export const DocumentFilters: React.FC<DocumentFiltersProps> = ({ dateRange, onDateRangeChange, kind, onKindChange, search, onSearchChange }) => (
  <div className="flex flex-col items-stretch gap-2 sm:max-w-3xl sm:flex-row sm:items-center">
    <DateRangeFilter dateRange={dateRange} onChange={onDateRangeChange} />
    <DocumentKindFilter kind={kind} onChange={onKindChange} />
    <SearchInput value={search} onValueChange={onSearchChange} placeholder="Buscar por número, comentario o SKU…" aria-label="Buscar documento" className="sm:flex-1" />
  </div>
);
