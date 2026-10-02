import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Loader2, 
  Boxes, 
  ArrowDownRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  Calendar
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { productsService, type ProductBatch } from '../services/products.service';
import { ProductPagination } from './ProductPagination';

interface ProductBatchesTabProps {
  selectedBranchId: string;
}

export const ProductBatchesTab: React.FC<ProductBatchesTabProps> = ({ selectedBranchId }) => {
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'exhausted'>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  // Debounce search input only
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Single unified fetch triggered only when query params actually change
  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      try {
        setLoading(true);
        const res = await productsService.getBatches({
          branchId: selectedBranchId || undefined,
          search: debouncedSearch.trim() || undefined,
          status: statusFilter,
          page,
          limit,
        });
        if (!isCancelled) {
          setBatches(res.data);
          setMeta(res.meta);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Error fetching product batches:', error);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [selectedBranchId, debouncedSearch, statusFilter, page, limit]);

  const getOriginBadge = (batch: ProductBatch) => {
    switch (batch.originType) {
      case 'PURCHASE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Boxes className="w-3 h-3" />
            {batch.originLabel}
          </span>
        );
      case 'INITIAL_STOCK':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <Package className="w-3 h-3" />
            {batch.originLabel}
          </span>
        );
      case 'REFUND':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <ArrowDownRight className="w-3 h-3" />
            {batch.originLabel}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Clock className="w-3 h-3" />
            {batch.originLabel}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral" />
          <Input
            placeholder="Buscar por producto, SKU o factura..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs bg-bg-dark border-border-card rounded-xl h-9"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1 bg-bg-dark border border-border-card p-1 rounded-xl self-start sm:self-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => { setStatusFilter('all'); setPage(1); }}
            className={`h-7 px-3 text-[11px] rounded-lg font-medium transition-all ${
              statusFilter === 'all' ? 'bg-primary/10 text-primary font-bold shadow-sm' : 'text-neutral hover:text-secondary'
            }`}
          >
            Todos
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => { setStatusFilter('active'); setPage(1); }}
            className={`h-7 px-3 text-[11px] rounded-lg font-medium transition-all ${
              statusFilter === 'active' ? 'bg-emerald-500/15 text-emerald-500 font-bold shadow-sm' : 'text-neutral hover:text-secondary'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Con Stock
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => { setStatusFilter('exhausted'); setPage(1); }}
            className={`h-7 px-3 text-[11px] rounded-lg font-medium transition-all ${
              statusFilter === 'exhausted' ? 'bg-muted text-secondary font-bold shadow-sm' : 'text-neutral hover:text-secondary'
            }`}
          >
            <AlertCircle className="w-3 h-3 mr-1" />
            Agotados
          </Button>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="border border-border-card bg-bg-card rounded-2xl shadow-sm p-4 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-7 h-7 text-primary animate-spin" />
            <p className="text-xs text-neutral">Cargando capas y lotes de inventario...</p>
          </div>
        ) : batches.length === 0 ? (
          <div className="text-center py-16 text-neutral text-xs italic">
            No se encontraron lotes registrados para los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="uppercase tracking-wider text-[10px] font-bold">
                  <TableHead className="pr-2">Fecha Ingreso</TableHead>
                  <TableHead className="px-2">Producto / SKU</TableHead>
                  <TableHead className="px-2">Origen / Comprobante</TableHead>
                  <TableHead className="px-2">Sucursal</TableHead>
                  <TableHead className="px-2 text-right">Cant. Inicial</TableHead>
                  <TableHead className="px-2 text-right">Disponible</TableHead>
                  <TableHead className="px-2 text-right">Costo Unit.</TableHead>
                  <TableHead className="pl-2 text-right">Valor Total Disp.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => {
                  const isAvailable = batch.remainingQuantity > 0;
                  const percentLeft = batch.initialQuantity > 0
                    ? Math.round((batch.remainingQuantity / batch.initialQuantity) * 100)
                    : 0;

                  return (
                    <TableRow 
                      key={batch.id} 
                      className={`text-secondary hover:bg-muted/10 transition-colors ${!isAvailable ? 'opacity-55' : ''}`}
                    >
                      {/* Date */}
                      <TableCell className="py-3 pr-2 text-neutral text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-neutral/70" />
                          <span>{new Date(batch.createdAt).toLocaleDateString()}</span>
                        </div>
                      </TableCell>

                      {/* Product & SKU */}
                      <TableCell className="py-3 px-2">
                        <div className="font-semibold text-secondary text-xs">{batch.productName}</div>
                        <div className="font-mono text-[10px] text-primary">{batch.sku || '-'}</div>
                      </TableCell>

                      {/* Origin & Reference */}
                      <TableCell className="py-3 px-2">
                        <div className="flex flex-col items-start gap-1">
                          {getOriginBadge(batch)}
                          {batch.originReference && (
                            <span className="text-[10px] text-neutral font-medium">
                              {batch.originReference}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Branch */}
                      <TableCell className="py-3 px-2 text-neutral text-xs">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-neutral/70" />
                          <span>{batch.branchName}</span>
                        </div>
                      </TableCell>

                      {/* Initial Quantity */}
                      <TableCell className="py-3 px-2 text-right font-mono font-medium text-xs">
                        {batch.initialQuantity}
                      </TableCell>

                      {/* Remaining Quantity with Visual Bar */}
                      <TableCell className="py-3 px-2 text-right">
                        <div className="font-mono font-bold text-xs">
                          {batch.remainingQuantity}
                        </div>
                        {batch.initialQuantity > 0 && (
                          <div className="w-16 ml-auto mt-1 h-1.5 rounded-full bg-muted/60 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                percentLeft > 50 ? 'bg-emerald-500' : percentLeft > 20 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, percentLeft))}%` }}
                            />
                          </div>
                        )}
                      </TableCell>

                      {/* Unit Cost */}
                      <TableCell className="py-3 px-2 text-right font-mono text-neutral font-medium text-xs">
                        ${batch.unitCost.toFixed(2)}
                      </TableCell>

                      {/* Total Value */}
                      <TableCell className="py-3 pl-2 text-right font-mono font-bold text-xs text-primary">
                        ${batch.totalCostValue.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {!loading && batches.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border-card">
            <ProductPagination
              meta={meta}
              onPageChange={setPage}
              onLimitChange={(l) => { setLimit(l); setPage(1); }}
            />
          </div>
        )}
      </Card>
    </div>
  );
};
