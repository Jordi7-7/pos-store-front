import React, { useState } from 'react';
import type { InventoryMovementEntity } from '../../entities';
import { InventoryMovementType } from '../../enums';
import { useInventoryMovementsByVariant } from '../../hooks';
import { ProductPagination } from '../ProductPagination';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Loader2 } from 'lucide-react';

interface ProductDetailMovementsTabProps {
  activeVariantId: string;
  activeSku?: string;
  selectedBranchId?: string;
}

export const ProductDetailMovementsTab: React.FC<ProductDetailMovementsTabProps> = ({
  activeVariantId,
  activeSku,
  selectedBranchId,
}) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);

  const { movementEntities: movements, meta, isLoading } = useInventoryMovementsByVariant(
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
      ) : movements.length === 0 ? (
        <div className="py-16 text-center space-y-2 border border-dashed border-border rounded-xl">
          <ClipboardList className="w-8 h-8 text-muted-foreground/40 mx-auto" />
          <p className="text-sm font-medium text-muted-foreground">
            No hay movimientos registrados para esta variante.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Motivo / Razón</th>
                  <th className="px-4 py-3">Fecha y Hora</th>
                  <th className="px-4 py-3">Variante / SKU</th>
                  <th className="px-4 py-3 text-right">Cantidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {movements.map((movement: InventoryMovementEntity) => {
                  const isPositive = movement.type === InventoryMovementType.IN;
                  return (
                    <tr key={movement.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={
                            isPositive
                              ? 'text-emerald-600 border-emerald-500/30 bg-emerald-500/5'
                              : 'text-rose-600 border-rose-500/30 bg-rose-500/5'
                          }
                        >
                          {isPositive ? 'Entrada' : 'Salida'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{movement.reason}</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">
                        {movement.dateFormatted}
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">
                        {movement.sku || activeSku || 'Sin SKU'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold">
                        <span className={isPositive ? 'text-emerald-600' : 'text-destructive'}>
                          {isPositive ? '+' : '-'}
                          {Number(movement.quantity || 0)}
                        </span>
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
