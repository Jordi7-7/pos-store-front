import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Loader2, 
  Boxes, 
  ArrowDownRight, 
  Clock, 
  Building2,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronRight,
  Receipt,
  Layers,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { type DateRange } from 'react-day-picker';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useBatches } from '../hooks';
import { BatchStatus } from '../enums';
import { ProductPagination } from './ProductPagination';

interface ProductBatchesTabProps {
  selectedBranchId: string;
}

export const ProductBatchesTab: React.FC<ProductBatchesTabProps> = ({ selectedBranchId }) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
  const endDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;

  // Debounce search input only
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Clean data-fetching hook with React Query & internal entity mapper
  const { lots, meta, isLoading: loading } = useBatches({
    branchId: selectedBranchId || undefined,
    startDate,
    endDate,
    search: debouncedSearch.trim() || undefined,
    page,
    limit,
  });

  // Reset collapsed groups when page or filters change so lots are expanded by default
  useEffect(() => {
    setCollapsedGroups({});
  }, [page, debouncedSearch, selectedBranchId, startDate, endDate]);

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const expandAll = () => {
    setCollapsedGroups({});
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    lots.forEach((l) => {
      next[l.id] = true;
    });
    setCollapsedGroups(next);
  };

  const getOriginBadge = (originType: string, originLabel: string) => {
    switch (originType) {
      case 'PURCHASE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Boxes className="w-3 h-3" />
            {originLabel}
          </span>
        );
      case 'INITIAL_STOCK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <Package className="w-3 h-3" />
            {originLabel || 'Stock inicial'}
          </span>
        );
      case 'ADJUSTMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <SlidersHorizontal className="w-3 h-3" />
            {originLabel || 'Ajuste de inventario'}
          </span>
        );
      case 'REFUND':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <ArrowDownRight className="w-3 h-3" />
            {originLabel}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Clock className="w-3 h-3" />
            {originLabel}
          </span>
        );
    }
  };

  const getStatusBadge = (status: BatchStatus) => {
    switch (status) {
      case BatchStatus.CANCELLED:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Anulado
          </span>
        );
      case BatchStatus.DEPLETED:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-neutral/10 text-neutral border border-neutral/20">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral/60" />
            Agotado
          </span>
        );
      case BatchStatus.ACTIVE:
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Disponible
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-xl">
          {/* Date Range Picker */}
          <div className="relative">
            <Popover>
              <PopoverTrigger render={
                <Button
                  variant="outline"
                  id="batches-date-picker-range"
                  className="w-full sm:w-64 justify-start px-3 py-2 text-xs font-semibold bg-bg-dark border border-border-card rounded-xl h-9 hover:bg-muted text-secondary"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-neutral" />
                  {dateRange?.from ? (
                    dateRange.to ? `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}` : format(dateRange.from, 'dd/MM/yyyy')
                  ) : <span className="text-neutral">Filtrar por fecha...</span>}
                </Button>
              } />
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={(range) => {
                    setDateRange(range);
                    setPage(1);
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            {dateRange?.from && (
              <button
                type="button"
                onClick={() => {
                  setDateRange(undefined);
                  setPage(1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-neutral hover:text-secondary rounded"
                title="Limpiar fecha"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search by batch code or product */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral" />
            <Input
              placeholder="Buscar por lote, producto o factura..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs bg-bg-dark border-border-card rounded-xl h-9"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Actions to Expand / Collapse */}
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={expandAll}
              className="h-8 px-2.5 text-[11px] rounded-lg border-border-card text-neutral hover:text-secondary"
            >
              Expandir todos
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={collapseAll}
              className="h-8 px-2.5 text-[11px] rounded-lg border-border-card text-neutral hover:text-secondary"
            >
              Colapsar todos
            </Button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <Card className="border border-border-card bg-bg-card rounded-2xl shadow-sm p-4 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-7 h-7 text-primary animate-spin" />
            <p className="text-xs text-neutral">Cargando lotes de inventario...</p>
          </div>
        ) : lots.length === 0 ? (
          <div className="text-center py-16 text-neutral text-xs italic">
            No se encontraron lotes registrados para los filtros seleccionados.
          </div>
        ) : (
          <div className="space-y-3">
            {lots.map((lot) => {
              const isExpanded = !collapsedGroups[lot.id];
              const totalItems = lot.items.length;

              return (
                <div 
                  key={lot.id}
                  className={`border rounded-xl transition-all overflow-hidden ${
                    isExpanded 
                      ? 'border-primary/40 bg-bg-dark/30 shadow-sm' 
                      : 'border-border-card bg-bg-dark/20 hover:border-border-card/80'
                  }`}
                >
                  {/* Lot Header Row */}
                  <div
                    onClick={() => toggleGroup(lot.id)}
                    className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none hover:bg-muted/10 transition-colors"
                  >
                    {/* Left: Origin & Identifier */}
                    <div className="flex items-start md:items-center gap-3">
                      <div className="mt-0.5 md:mt-0 text-neutral">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-primary" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-secondary text-sm flex items-center gap-1.5 font-mono">
                            <Layers className="w-4 h-4 text-primary" />
                            {lot.displayTitle}
                          </span>
                          {getOriginBadge(lot.originType, lot.originLabel)}
                          {getStatusBadge(lot.status)}
                          <span className="text-[10px] text-neutral flex items-center gap-1 font-sans">
                            <Building2 className="w-3 h-3 text-neutral/70" />
                            {lot.branchName}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3 text-neutral/70" />
                            {lot.dateFormatted}
                          </span>
                          <span>•</span>
                          <span className="font-medium text-secondary">
                            {totalItems} {totalItems === 1 ? 'producto en este lote' : 'productos en este lote'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Aggregated Quantities and Cost */}
                    <div className="flex flex-wrap items-center justify-between md:justify-end gap-5 pl-7 md:pl-0 border-t md:border-t-0 pt-2 md:pt-0 border-border-card/40">
                      <div className="text-left md:text-right">
                        <span className="text-[10px] uppercase font-bold text-neutral block">
                          Stock Total Lote
                        </span>
                        <div className="font-mono text-xs font-semibold text-secondary">
                          <span className={lot.status === BatchStatus.CANCELLED ? 'text-rose-500 font-bold' : lot.hasStock ? 'text-emerald-500 font-bold' : 'text-neutral'}>
                            {lot.totalRemainingQuantity}
                          </span>
                          <span className="text-neutral/70 text-[11px]"> / {lot.totalInitialQuantity}</span>
                        </div>
                        {lot.totalInitialQuantity > 0 && lot.status !== BatchStatus.CANCELLED && (
                          <div className="w-20 md:ml-auto mt-1 h-1.5 rounded-full bg-muted/60 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                lot.percentRemaining > 50 ? 'bg-emerald-500' : lot.percentRemaining > 20 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, lot.percentRemaining))}%` }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Financial Value: Initial vs Remaining */}
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-neutral block">
                          Valor Lote
                        </span>
                        <div className="font-mono font-bold text-xs text-primary">
                          {lot.totalCostFormatted}
                          <span className="text-[10.5px] font-normal text-neutral/80 block">
                            Inicial: {lot.totalInitialCostFormatted}
                          </span>
                        </div>
                        <span className={`text-[10px] font-semibold ${
                          lot.status === BatchStatus.CANCELLED 
                            ? 'text-rose-500' 
                            : lot.hasStock 
                              ? 'text-emerald-500' 
                              : 'text-neutral/60'
                        }`}>
                          {lot.status === BatchStatus.CANCELLED ? 'Anulado' : lot.hasStock ? `${lot.percentDisplay}% disponible` : 'Agotado'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Lot Content: Products arrived in this batch */}
                  {isExpanded && (
                    <div className="border-t border-border-card/80 bg-bg-card p-3">
                      <div className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5 text-[10px]">
                        <Receipt className="w-3.5 h-3.5 text-primary" />
                        <span>Detalle de productos llegados en este lote ({lot.items.length}):</span>
                      </div>

                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="uppercase tracking-wider text-[10px] font-bold border-b border-border-card">
                              <TableHead className="pr-2">Producto / SKU</TableHead>
                              <TableHead className="px-2 text-right">Cant. Inicial</TableHead>
                              <TableHead className="px-2 text-right">Consumido</TableHead>
                              <TableHead className="px-2 text-right">Disponible</TableHead>
                              <TableHead className="px-2 text-right">Costo Unit.</TableHead>
                              <TableHead className="pl-2 text-right">Valor Restante</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {lot.items.map((item) => (
                              <TableRow
                                key={item.id}
                                className={`text-secondary hover:bg-muted/10 transition-colors ${
                                  !item.isAvailable ? 'opacity-55' : ''
                                }`}
                              >
                                {/* Product Name & SKU */}
                                <TableCell className="py-2.5 pr-2">
                                  <div className="font-semibold text-secondary text-xs">{item.productName}</div>
                                  <div className="font-mono text-[10px] text-primary">{item.sku || '-'}</div>
                                </TableCell>

                                {/* Initial Qty */}
                                <TableCell className="py-2.5 px-2 text-right font-mono font-medium text-xs">
                                  {item.initialQuantity}
                                </TableCell>

                                {/* Consumed Qty */}
                                <TableCell className="py-2.5 px-2 text-right font-mono text-neutral text-xs">
                                  {item.consumedQuantity}
                                </TableCell>

                                {/* Remaining Qty with Bar */}
                                <TableCell className="py-2.5 px-2 text-right">
                                  <span className={`font-mono font-bold text-xs ${item.isAvailable ? 'text-emerald-500' : 'text-neutral'}`}>
                                    {item.remainingQuantity}
                                  </span>
                                  {item.initialQuantity > 0 && (
                                    <div className="w-16 ml-auto mt-1 h-1 rounded-full bg-muted/60 overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full ${
                                          item.percentRemaining > 50 ? 'bg-emerald-500' : item.percentRemaining > 20 ? 'bg-amber-500' : 'bg-rose-500'
                                        }`}
                                        style={{ width: `${Math.min(100, Math.max(0, item.percentRemaining))}%` }}
                                      />
                                    </div>
                                  )}
                                </TableCell>

                                {/* Unit Cost */}
                                <TableCell className="py-2.5 px-2 text-right font-mono text-neutral font-medium text-xs">
                                  {item.unitCostFormatted}
                                </TableCell>

                                {/* Total Value */}
                                <TableCell className="py-2.5 pl-2 text-right font-mono font-bold text-xs text-primary">
                                  {item.totalCostFormatted}
                                  <span className="text-[10px] font-normal text-neutral/80 block">
                                    Ini: {item.initialCostFormatted}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && lots.length > 0 && (
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
