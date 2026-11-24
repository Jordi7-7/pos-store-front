import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PaginationControls } from '@/shared/presentation/components/PaginationControls';
import { useInventoryMovements, useMovementFilters } from '../hooks';
import { MovementFilters } from './movements/MovementFilters';
import { InventoryDocumentModal } from './movements/InventoryDocumentModal';
import { MovementsTable } from './movements/MovementsTable';

interface ProductMovementsTabProps {
  selectedBranchId: string;
}

/** Historial de movimientos de inventario de la sucursal: filtros, tabla y paginación. */
export const ProductMovementsTab: React.FC<ProductMovementsTabProps> = ({ selectedBranchId }) => {
  const filters = useMovementFilters();
  const [openDocumentId, setOpenDocumentId] = useState<string | null>(null);
  const { movements, meta, isLoading, isError } = useInventoryMovements({
    branchId: selectedBranchId || undefined,
    type: filters.type,
    category: filters.category,
    startDate: filters.startDate,
    endDate: filters.endDate,
    search: filters.searchTerm,
    page: filters.page,
    limit: filters.limit,
  });

  return (
    <div className="space-y-4">
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

      <Card className="gap-0 overflow-hidden p-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-7 h-7 text-primary animate-spin" />
            <p className="text-xs text-neutral">Cargando movimientos...</p>
          </div>
        ) : isError ? (
          <div className="text-center py-16 text-destructive text-xs">No se pudieron cargar los movimientos. Inténtalo de nuevo.</div>
        ) : movements.length === 0 ? (
          <div className="text-center py-16 text-neutral text-xs italic">No hay movimientos para los filtros seleccionados.</div>
        ) : (
          <MovementsTable movements={movements} onOpenDocument={setOpenDocumentId} />
        )}

        {!isLoading && movements.length > 0 && (
          <div className="border-t border-border-card px-4 py-3">
            <PaginationControls meta={meta} onPageChange={filters.setPage} onLimitChange={filters.setLimit} />
          </div>
        )}
      </Card>
      <InventoryDocumentModal documentId={openDocumentId} onClose={() => setOpenDocumentId(null)} />
    </div>
  );
};
