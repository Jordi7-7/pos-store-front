import React, { useState } from 'react';
import type { ProductHistorySaleDTO } from '../../types';
import { useVariantSales } from '../../hooks';
import { ProductPagination } from '../ProductPagination';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Loader2 } from 'lucide-react';

interface ProductDetailSalesTabProps {
  activeVariantId: string;
  selectedBranchId?: string;
}

export const ProductDetailSalesTab: React.FC<ProductDetailSalesTabProps> = ({
  activeVariantId,
  selectedBranchId,
}) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);

  const { sales, meta, isLoading } = useVariantSales(
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
      ) : sales.length === 0 ? (
        <div className="py-16 text-center space-y-2 border border-dashed border-border rounded-xl">
          <ShoppingCart className="w-8 h-8 text-muted-foreground/40 mx-auto" />
          <p className="text-sm font-medium text-muted-foreground">
            No hay ventas registradas para esta variante.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  <th className="px-4 py-3">Factura / Ticket</th>
                  <th className="px-4 py-3">Fecha y Hora</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3 text-right">Cant. Vendida</th>
                  <th className="px-4 py-3 text-right">Precio Venta</th>
                  <th className="px-4 py-3 text-right">Total Factura</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sales.map((sale: ProductHistorySaleDTO) => {
                  const matchingItem = sale.items?.find(
                    (it: any) => it.variant?.id === activeVariantId || it.variantId === activeVariantId
                  ) || sale.items?.[0];
                  const soldQty = matchingItem ? Number(matchingItem.quantity) : 1;
                  const soldPrice = matchingItem ? Number(matchingItem.price) : Number(sale.total);

                  return (
                    <tr key={sale.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-primary">
                        {sale.invoiceNumber || 'S/Ref'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono">
                        {new Date(sale.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-foreground font-medium">
                        {sale.customer?.name || 'Consumidor Final'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold">
                        <Badge variant="outline" className="font-mono">
                          {soldQty} pzs
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-muted-foreground">
                        ${soldPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                        ${Number(sale.total || 0).toFixed(2)}
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
