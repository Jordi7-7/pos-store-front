import React, { useState } from 'react';
import type { ProductHistoryPurchaseDTO } from '../../types';
import { useVariantPurchases } from '../../hooks';
import { ProductPagination } from '../ProductPagination';
import { Badge } from '@/components/ui/badge';
import { Truck, Loader2 } from 'lucide-react';

interface ProductDetailPurchasesTabProps {
  activeVariantId: string;
  selectedBranchId?: string;
}

export const ProductDetailPurchasesTab: React.FC<ProductDetailPurchasesTabProps> = ({
  activeVariantId,
  selectedBranchId,
}) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);

  const { purchases, meta, isLoading } = useVariantPurchases(
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
      ) : purchases.length === 0 ? (
        <div className="py-16 text-center space-y-2 border border-dashed border-border rounded-xl">
          <Truck className="w-8 h-8 text-muted-foreground/40 mx-auto" />
          <p className="text-sm font-medium text-muted-foreground">
            No hay compras registradas para esta variante.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  <th className="px-4 py-3">Factura / Orden</th>
                  <th className="px-4 py-3">Fecha Compra</th>
                  <th className="px-4 py-3">Proveedor</th>
                  <th className="px-4 py-3 text-right">Cant. Comprada</th>
                  <th className="px-4 py-3 text-right">Costo Unit.</th>
                  <th className="px-4 py-3 text-right">Total Orden</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {purchases.map((purchase: ProductHistoryPurchaseDTO) => {
                  const matchingItem = purchase.items?.find(
                    (it: any) => it.variant?.id === activeVariantId || it.variantId === activeVariantId
                  ) || purchase.items?.[0];
                  const purchaseQty = matchingItem ? Number(matchingItem.quantity) : 1;
                  const unitCost = matchingItem ? Number(matchingItem.unitPrice) : 0;

                  return (
                    <tr key={purchase.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-primary">
                        {purchase.invoiceNumber || 'S/Ref'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono">
                        {new Date(purchase.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-foreground font-medium">
                        {purchase.supplier?.name || 'Proveedor General'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold">
                        <Badge variant="outline" className="font-mono">
                          {purchaseQty} pzs
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-muted-foreground">
                        ${unitCost.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                        ${Number(purchase.totalAmount || 0).toFixed(2)}
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
