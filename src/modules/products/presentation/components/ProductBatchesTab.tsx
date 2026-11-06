import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PaginationControls } from '@/shared/presentation/components/PaginationControls';
import { useBatches } from '../hooks';
import { useBatchFilters } from '../hooks/useBatchFilters';
import { BatchFilters } from './batches/BatchFilters';
import { LotCard } from './batches/LotCard';

interface ProductBatchesTabProps {
  selectedBranchId: string;
}

/** Lotes de inventario de la sucursal: filtros, lista de lotes desplegables y paginación. */
export const ProductBatchesTab: React.FC<ProductBatchesTabProps> = ({ selectedBranchId }) => {
  const filters = useBatchFilters();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const { lots, meta, isLoading } = useBatches({
    branchId: selectedBranchId || undefined,
    startDate: filters.startDate,
    endDate: filters.endDate,
    search: filters.searchTerm,
    page: filters.page,
    limit: filters.limit,
  });

  // Al cambiar de página o de filtros, los lotes vuelven a verse desplegados.
  useEffect(() => {
    setCollapsed({});
  }, [filters.page, filters.searchTerm, selectedBranchId, filters.startDate, filters.endDate]);

  const toggle = (lotId: string) => setCollapsed((prev) => ({ ...prev, [lotId]: !prev[lotId] }));
  const collapseAll = () => setCollapsed(Object.fromEntries(lots.map((lot) => [lot.id, true])));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <BatchFilters
          dateRange={filters.dateRange}
          onDateRangeChange={filters.setDateRange}
          search={filters.search}
          onSearchChange={filters.setSearch}
          onExpandAll={() => setCollapsed({})}
          onCollapseAll={collapseAll}
        />
      </div>

      <Card className="border border-border-card bg-bg-card rounded-2xl shadow-sm p-4 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-7 h-7 text-primary animate-spin" />
            <p className="text-xs text-neutral">Cargando lotes de inventario...</p>
          </div>
        ) : lots.length === 0 ? (
          <div className="text-center py-16 text-neutral text-xs italic">No se encontraron lotes registrados para los filtros seleccionados.</div>
        ) : (
          <div className="space-y-3">
            {lots.map((lot) => (
              <LotCard key={lot.id} lot={lot} isExpanded={!collapsed[lot.id]} onToggle={() => toggle(lot.id)} />
            ))}
          </div>
        )}

        {!isLoading && lots.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border-card">
            <PaginationControls meta={meta} onPageChange={filters.setPage} onLimitChange={filters.setLimit} />
          </div>
        )}
      </Card>
    </div>
  );
};
