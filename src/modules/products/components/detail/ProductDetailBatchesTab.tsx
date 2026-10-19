import React, { useState } from 'react';
import type { VariantBatchEntity } from '../../entities';
import { BatchStatus } from '../../enums';
import { useVariantBatches } from '../../hooks';
import { ProductPagination } from '../ProductPagination';
import { Badge } from '@/components/ui/badge';
import { Boxes, Loader2 } from 'lucide-react';

interface ProductDetailBatchesTabProps {
  activeVariantId: string;
  selectedBranchId?: string;
}

export const ProductDetailBatchesTab: React.FC<ProductDetailBatchesTabProps> = ({
  activeVariantId,
  selectedBranchId,
}) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);

  const { batchEntities: batches, meta, isLoading } = useVariantBatches(
    activeVariantId,
    page,
    limit,
    selectedBranchId
  );

  return (
    <div className="space-y-4">
      <ProductPagination
        meta={meta}
        onPageChange={setPage}
        onLimitChange={(nextLimit) => {
          setLimit(nextLimit);
          setPage(1);
        }}
      />

      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground font-medium">Cargando información...</span>
        </div>
      ) : batches.length === 0 ? (
        <div className="py-16 text-center space-y-2 border border-dashed border-border rounded-xl">
          <Boxes className="w-8 h-8 text-muted-foreground/40 mx-auto" />
          <p className="text-sm font-medium text-muted-foreground">
            No hay lotes registrados para esta variante.
          </p>
          <p className="text-xs text-muted-foreground/70">
            Los lotes se generan automáticamente al realizar compras o aperturas de inventario.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  <th className="px-4 py-3">Lote / Referencia</th>
                  <th className="px-4 py-3">Sucursal</th>
                  <th className="px-4 py-3">Fecha Ingreso</th>
                  <th className="px-4 py-3 text-right">Inicial</th>
                  <th className="px-4 py-3 text-right">Consumido</th>
                  <th className="px-4 py-3 text-right">Quedan</th>
                  <th className="px-4 py-3 text-right">Costo Unit.</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {batches.map((batch: VariantBatchEntity) => {
                  const percentRemaining =
                    batch.initialQuantity > 0
                      ? Math.round((batch.remainingQuantity / batch.initialQuantity) * 100)
                      : 0;

                  return (
                    <tr key={batch.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        <div className="font-mono font-bold text-primary">{batch.batchCode}</div>
                        <div className="text-[10.5px] text-muted-foreground">{batch.originLabel}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{batch.branchName}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono">
                        {batch.dateFormatted}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">
                        {batch.initialQuantity}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                        {batch.consumedQuantity}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-mono font-bold text-foreground">
                          {batch.remainingQuantity} pzs
                        </div>
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden ml-auto mt-1">
                          <div
                            className={`h-full rounded-full ${
                              batch.remainingQuantity > 0 ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                            }`}
                            style={{ width: `${percentRemaining}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">
                        ${Number(batch.unitCost).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={batch.status === BatchStatus.ACTIVE ? 'default' : 'secondary'}
                          className={
                            batch.status === BatchStatus.ACTIVE
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : 'text-muted-foreground'
                          }
                        >
                          {batch.status === BatchStatus.ACTIVE ? 'Activo' : 'Agotado'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
