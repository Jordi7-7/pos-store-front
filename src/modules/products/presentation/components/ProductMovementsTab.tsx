import React, { useState } from 'react';
import { FileText, ListOrdered, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PaginationControls } from '@/shared/presentation/components/PaginationControls';
import { useInventoryDocuments, useInventoryMovements, useMovementFilters } from '../hooks';
import { DocumentFilters } from './movements/DocumentFilters';
import { DocumentsTable } from './movements/DocumentsTable';
import { InventoryDocumentModal } from './movements/InventoryDocumentModal';
import { MovementFilters } from './movements/MovementFilters';
import { MovementsTable } from './movements/MovementsTable';

interface ProductMovementsTabProps {
  selectedBranchId: string;
}

type View = 'movements' | 'documents';

const VIEWS = [
  { value: 'movements', label: 'Movimientos', hint: 'Una fila por producto movido', Icon: ListOrdered },
  { value: 'documents', label: 'Documentos', hint: 'Una fila por documento (entrada, salida, conteo o traslado)', Icon: FileText },
] as const;

/**
 * Historial de inventario de la sucursal, con dos vistas del mismo registro: por movimiento (cada línea del kardex, incluidas
 * ventas y compras) o por documento (uno por fila, solo las operaciones manuales). Comparten fechas, búsqueda y paginación.
 */
export const ProductMovementsTab: React.FC<ProductMovementsTabProps> = ({ selectedBranchId }) => {
  const filters = useMovementFilters();
  const [view, setView] = useState<View>('movements');
  const [openDocumentId, setOpenDocumentId] = useState<string | null>(null);
  const branchId = selectedBranchId || undefined;

  const movementsQuery = useInventoryMovements(
    { branchId, type: filters.type, category: filters.category, startDate: filters.startDate, endDate: filters.endDate, search: filters.searchTerm, page: filters.page, limit: filters.limit },
    view === 'movements',
  );
  const documentsQuery = useInventoryDocuments(
    { branchId, kind: filters.documentKind, startDate: filters.startDate, endDate: filters.endDate, search: filters.searchTerm, page: filters.page, limit: filters.limit },
    view === 'documents',
  );

  const active = view === 'movements' ? movementsQuery : documentsQuery;
  const count = view === 'movements' ? movementsQuery.movements.length : documentsQuery.documents.length;

  const changeView = (next: View) => {
    setView(next);
    filters.setPage(1);
  };

  return (
    <div className="space-y-4">
      <div role="group" aria-label="Vista del historial" className="inline-flex h-9 items-center gap-0.5 rounded-lg border border-border-card bg-muted/60 p-0.5">
        {VIEWS.map(({ value, label, hint, Icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={view === value}
            title={hint}
            onClick={() => changeView(value)}
            className={`flex h-full cursor-pointer items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors ${view === value ? 'bg-background text-foreground shadow-2xs' : 'text-neutral hover:text-foreground'}`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {view === 'movements' ? (
        <MovementFilters
          dateRange={filters.dateRange}
          onDateRangeChange={filters.setDateRange}
          type={filters.type}
          onTypeChange={filters.setType}
          category={filters.category}
          onCategoryChange={filters.setCategory}
          search={filters.search}
          onSearchChange={filters.setSearch}
        />
      ) : (
        <DocumentFilters
          dateRange={filters.dateRange}
          onDateRangeChange={filters.setDateRange}
          kind={filters.documentKind}
          onKindChange={filters.setDocumentKind}
          search={filters.search}
          onSearchChange={filters.setSearch}
        />
      )}

      <Card className="gap-0 overflow-hidden p-0">
        {active.isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-3 py-20">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-xs text-neutral">{view === 'movements' ? 'Cargando movimientos...' : 'Cargando documentos...'}</p>
          </div>
        ) : active.isError ? (
          <div className="py-16 text-center text-xs text-destructive">{view === 'movements' ? 'No se pudieron cargar los movimientos.' : 'No se pudieron cargar los documentos.'} Inténtalo de nuevo.</div>
        ) : count === 0 ? (
          <div className="py-16 text-center text-xs italic text-neutral">{view === 'movements' ? 'No hay movimientos para los filtros seleccionados.' : 'No hay documentos para los filtros seleccionados.'}</div>
        ) : view === 'movements' ? (
          <MovementsTable movements={movementsQuery.movements} onOpenDocument={setOpenDocumentId} />
        ) : (
          <DocumentsTable documents={documentsQuery.documents} onOpenDocument={setOpenDocumentId} />
        )}

        {!active.isLoading && count > 0 && (
          <div className="border-t border-border-card px-4 py-3">
            <PaginationControls meta={active.meta} onPageChange={filters.setPage} onLimitChange={filters.setLimit} />
          </div>
        )}
      </Card>

      <InventoryDocumentModal documentId={openDocumentId} onClose={() => setOpenDocumentId(null)} />
    </div>
  );
};
