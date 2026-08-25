import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { apiClient } from '@/lib/apiClient';
import { useBranches } from '../../branches/hooks/useBranches';
import {
  Package, Search, ArrowUpRight, ArrowDownLeft, Calendar,
  MapPin, Loader2, ClipboardList
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface KardexTabProps {
  products: any[];
  isLoadingProducts: boolean;
}

interface InventoryMovement {
  id: string;
  quantity: number;
  type: string;
  reason: string;
  createdAt: string;
  variant?: { sku: string; product?: { name: string } };
  originBranch?: { name: string } | null;
  destinationBranch?: { name: string } | null;
}

export const KardexTab: React.FC<KardexTabProps> = ({ products, isLoadingProducts }) => {
  const { branches } = useBranches();
  const timezone = useAuthStore((state) => state.timezone) || 'America/Guayaquil';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVariantForMovements, setSelectedVariantForMovements] = useState<any | null>(null);
  const [isMovementsModalOpen, setIsMovementsModalOpen] = useState(false);

  const variantRows = React.useMemo(() => {
    if (!products) return [];
    const rows: any[] = [];
    products.forEach((prod: any) => {
      (prod.variants || []).forEach((v: any) => {
        const combText = v.attributeValues && v.attributeValues.length > 0
          ? v.attributeValues.map((av: any) => `${av.attribute?.name || 'Attr'}: ${av.value}`).join(' / ')
          : 'Estándar';
        rows.push({
          productId: prod.id,
          productName: prod.name,
          variantId: v.id,
          sku: v.sku,
          barcode: v.barcode,
          combinationText: combText,
          stocks: v.stocks || [],
          rawVariant: v,
          rawProduct: prod
        });
      });
    });
    return rows;
  }, [products]);

  const filteredVariantRows = React.useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return variantRows;
    return variantRows.filter(r =>
      r.productName.toLowerCase().includes(term) ||
      r.sku.toLowerCase().includes(term) ||
      (r.barcode && r.barcode.toLowerCase().includes(term))
    );
  }, [variantRows, searchTerm]);

  const { data: movements = [], isLoading: isLoadingMovements } = useQuery<InventoryMovement[]>({
    queryKey: ['variant-movements', selectedVariantForMovements?.variantId],
    queryFn: async () => {
      if (!selectedVariantForMovements?.variantId) return [];
      return apiClient.get<InventoryMovement[]>(`/products/inventory-movements?variantId=${selectedVariantForMovements.variantId}`);
    },
    enabled: !!selectedVariantForMovements?.variantId,
  });

  const handleRowClick = (row: any) => {
    setSelectedVariantForMovements(row);
    setIsMovementsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filtrar por SKU o producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-xs"
              />
            </div>
            <Badge variant="secondary" className="text-[10px] whitespace-nowrap">
              {filteredVariantRows.length} variante(s) en almacén
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Table */}
      {isLoadingProducts ? (
        <Card>
          <CardContent className="py-16 text-center flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Cargando existencias de inventario...</span>
          </CardContent>
        </Card>
      ) : filteredVariantRows.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center flex flex-col items-center justify-center gap-3">
            <Package className="w-12 h-12 text-muted-foreground opacity-35" />
            <span className="text-xs text-muted-foreground">No se encontraron artículos o variaciones registradas.</span>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted border-b border-border text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="p-4">SKU / Variante</th>
                    <th className="p-4">Producto</th>
                    {branches.map(b => (
                      <th key={b.id} className="p-4 text-center">{b.name}</th>
                    ))}
                    <th className="p-4 text-center">Stock Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVariantRows.map((row) => {
                    const totalStock = row.stocks.reduce((sum: number, s: any) => sum + (Number(s.quantity) || 0), 0);
                    return (
                      <tr
                        key={row.variantId}
                        onClick={() => handleRowClick(row)}
                        className="border-b border-border/60 hover:bg-muted/30 transition-all cursor-pointer"
                      >
                        <td className="p-4 font-mono font-bold text-primary">
                          {row.sku}
                          <span className="text-[10px] text-muted-foreground font-sans block font-normal mt-0.5">{row.combinationText}</span>
                        </td>
                        <td className="p-4 font-semibold">{row.productName}</td>
                        {branches.map(b => {
                          const qty = row.stocks.find((s: any) => s.branchId === b.id)?.quantity || 0;
                          return (
                            <td key={b.id} className="p-4 text-center font-bold font-mono">
                              <span className={qty <= 0 ? 'text-destructive' : ''}>{qty}</span>
                            </td>
                          );
                        })}
                        <td className="p-4 text-center">
                          <Badge
                            variant={totalStock > 0 ? 'secondary' : 'destructive'}
                            className="font-mono text-[11px]"
                          >
                            {totalStock}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Movements Dialog */}
      <Dialog
        open={isMovementsModalOpen}
        onOpenChange={(open) => {
          setIsMovementsModalOpen(open);
          if (!open) setSelectedVariantForMovements(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xs uppercase tracking-wider flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              Kardex / Historial de Movimientos
            </DialogTitle>
          </DialogHeader>

          {selectedVariantForMovements && (
            <div className="mt-2 p-3 bg-muted rounded-xl border border-border flex flex-wrap gap-x-6 gap-y-1 text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Producto</span>
                <span className="font-semibold">{selectedVariantForMovements.productName}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">SKU Variante</span>
                <span className="font-semibold font-mono text-primary">{selectedVariantForMovements.sku}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">Combinación</span>
                <span className="font-semibold">{selectedVariantForMovements.combinationText}</span>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {isLoadingMovements ? (
              <div className="py-16 text-center flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Cargando movimientos de inventario...</span>
              </div>
            ) : movements.length === 0 ? (
              <div className="py-16 text-center text-xs text-muted-foreground italic border-2 border-dashed border-border rounded-xl">
                No hay movimientos registrados para esta variante. Genera una venta o una compra.
              </div>
            ) : (
              <div className="space-y-2.5 mt-4">
                {movements.map((mov) => {
                  const isInput = mov.type === 'INPUT' || mov.type === 'IN';

                  let reasonText = mov.reason;
                  if (mov.reason === 'PURCHASE' || mov.reason === 'COMPRA') reasonText = 'Compra (Abastecimiento)';
                  else if (mov.reason === 'SALE' || mov.reason === 'VENTA') reasonText = 'Venta (POS)';
                  else if (mov.reason === 'REFUND' || mov.reason === 'DEVOLUCION') reasonText = 'Devolución';
                  else if (mov.reason === 'INITIAL_STOCK') reasonText = 'Stock de Apertura';
                  else if (mov.reason === 'ADJUSTMENT') reasonText = 'Ajuste de Stock';

                  return (
                    <div
                      key={mov.id}
                      className={`p-3 border rounded-xl flex items-center justify-between gap-3 bg-muted/20 ${
                        isInput ? 'border-emerald-500/20 hover:border-emerald-500/40' : 'border-destructive/20 hover:border-destructive/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isInput ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'
                        }`}>
                          {isInput ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold flex items-center gap-1.5">
                            <span>{reasonText}</span>
                            <span className="text-[9px] text-muted-foreground font-mono font-normal">ID: {mov.id.substring(0, 8)}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(mov.createdAt).toLocaleString(undefined, { timeZone: timezone })}
                            </span>
                            {(mov.originBranch || mov.destinationBranch) && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {isInput
                                  ? `Destino: ${mov.destinationBranch?.name || 'Matriz'}`
                                  : `Origen: ${mov.originBranch?.name || 'Matriz'}`
                                }
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-mono font-bold">
                        <span className={`text-xs ${isInput ? 'text-emerald-500' : 'text-destructive'}`}>
                          {isInput ? '+' : '-'}{Math.round(mov.quantity)}
                        </span>
                        <span className="text-[9px] text-muted-foreground block font-normal font-sans">pzs</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default KardexTab;
