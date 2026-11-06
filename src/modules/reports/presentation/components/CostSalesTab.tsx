import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet,
  FileText,
  Loader2,
  CalendarIcon,
  ChevronDown,
  ChevronRight,
  Package
} from 'lucide-react';
import { format } from 'date-fns';
import { type DateRange } from 'react-day-picker';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useFormatters } from '@/modules/auth/presentation/hooks/useFormatters';
import { printHtml } from '@/shared/presentation/export/print-html';
import { downloadCsv } from '@/shared/presentation/export/download-csv';
import { salesCostTotals } from '../../domain/rules/report-totals';
import { salesCostCsv, salesCostPrintHtml } from '../view-models/sales-cost.export';
import { useSalesCostReport } from '../hooks/useReports';
import { Calendar } from '@/components/ui/calendar';
import { Field } from '@/components/ui/field';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney, useTenant } from '@/modules/auth/presentation/hooks/useSession';

interface CostSalesTabProps {
  selectedBranchId?: string;
}

export const CostSalesTab: React.FC<CostSalesTabProps> = ({ selectedBranchId }) => {
  const fmt = useFormatters();
  const currentTenant = useTenant(); // el nombre del negocio ya está en la sesión: no hace falta pedirlo

  // Use modular hook
  const { loading: costLoading, data: salesCostData, fetchSalesCost } = useSalesCostReport();

  // State to track expanded sales for product-level details
  const [expandedSaleIds, setExpandedSaleIds] = useState<Set<string>>(new Set());

  const toggleSaleExpand = (saleId: string) => {
    setExpandedSaleIds((prev) => {
      const next = new Set(prev);
      if (next.has(saleId)) {
        next.delete(saleId);
      } else {
        next.add(saleId);
      }
      return next;
    });
  };

  // Date Picker Range state (Defaults: start of month to today)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });


  const loadCostReport = () => {
    if (!dateRange?.from) {
      toast.warning('Por favor selecciona una fecha de inicio');
      return;
    }
    const startStr = format(dateRange.from, 'yyyy-MM-dd');
    const endStr = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : startStr;
    fetchSalesCost(startStr, endStr, selectedBranchId);
  };

  // Initial load when dateRange or selectedBranchId changes
  useEffect(() => {
    if (dateRange?.from) {
      loadCostReport();
    }
  }, [dateRange, selectedBranchId]);

  const totals = useMemo(() => salesCostTotals(salesCostData), [salesCostData]);
  const formatReportDate = (iso: string) => fmt.shortDate(iso);

  const periodText = () => {
    const from = dateRange?.from ? format(dateRange.from, 'dd/MM/yyyy') : '';
    const to = dateRange?.to ? format(dateRange.to, 'dd/MM/yyyy') : from;
    return `${from} al ${to}`;
  };

  const handlePrintCostReport = () => {
    if (salesCostData.length === 0) {
      toast.warning('No hay datos para imprimir');
      return;
    }
    printHtml(salesCostPrintHtml(salesCostData, totals, fmt, { tenantName: currentTenant?.name || '', period: periodText(), printedOn: fmt.shortDate(new Date()) }));
  };

  const handleExportExcel = () => {
    if (salesCostData.length === 0) {
      toast.warning('No hay datos para exportar');
      return;
    }
    downloadCsv(`cogs_report_${format(dateRange?.from || new Date(), 'yyyyMMdd')}.csv`, salesCostCsv(salesCostData, totals, fmt));
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Filter Panel Bar */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/5 to-bg-card border border-primary/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-secondary mb-1">Costo de Ventas por Documentos</h2>
          <p className="text-xs text-neutral">Analiza la rentabilidad detallada cruzando el costo de tus variantes vendidas contra el precio final.</p>
        </div>

        {/* Inputs & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Shadcn DatePickerWithRange Integration */}
          <Field className="w-64">
            <Popover>
              <PopoverTrigger render={
                <Button 
                  variant="outline" 
                  id="date-picker-range" 
                  className="w-full justify-start px-3 py-2 text-xs font-semibold bg-bg-dark border border-border-card rounded-xl h-9 hover:bg-muted text-secondary"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-neutral" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy")
                    )
                  ) : (
                    <span>Selecciona un rango</span>
                  )}
                </Button>
              } />
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </Field>

          <div className="flex gap-2">
            <Button 
              onClick={loadCostReport} 
              disabled={costLoading}
              className="px-4 text-xs font-semibold h-9"
            >
              {costLoading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Consultar
            </Button>
            <button
              type="button"
              onClick={handlePrintCostReport}
              disabled={salesCostData.length === 0}
              title="Exportar a PDF / Imprimir"
              className="flex items-center justify-center bg-bg-dark border border-border-card hover:bg-muted text-secondary disabled:opacity-40 w-9 h-9 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <FileText className="w-4 h-4 text-rose-500" />
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={salesCostData.length === 0}
              title="Exportar a Excel"
              className="flex items-center justify-center bg-bg-dark border border-border-card hover:bg-muted text-secondary disabled:opacity-40 w-9 h-9 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Table Container Card */}
      <Card className="border border-border-card bg-bg-card rounded-2xl shadow-sm p-6 overflow-hidden">
        {costLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-neutral">Calculando precios de costo por documento...</p>
          </div>
        ) : salesCostData.length === 0 ? (
          <div className="text-center py-16 text-neutral text-xs italic">
            No hay ventas registradas en el período seleccionado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="uppercase tracking-wider text-[10px] font-bold">
                  <TableHead className="w-8 px-1"></TableHead>
                  <TableHead className="pr-2">Factura</TableHead>
                  <TableHead className="px-2">Fecha</TableHead>
                  <TableHead className="px-2">Cliente</TableHead>
                  <TableHead className="px-2 text-right">Pzas</TableHead>
                  <TableHead className="px-2 text-right">Precio de venta</TableHead>
                  <TableHead className="px-2 text-right">Precio de costo</TableHead>
                  <TableHead className="pl-2 text-right">Diferencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesCostData.map((row) => {
                  const isExpanded = expandedSaleIds.has(row.id);
                  const hasItems = row.items && row.items.length > 0;

                  return (
                    <React.Fragment key={row.id}>
                      <TableRow 
                        onClick={() => hasItems && toggleSaleExpand(row.id)}
                        className={`text-secondary hover:bg-muted/10 transition-colors cursor-pointer ${isExpanded ? 'bg-muted/5' : ''}`}
                      >
                        <TableCell className="w-8 px-1 py-3 text-center">
                          {hasItems ? (
                            <button
                              type="button"
                              className="p-1 rounded hover:bg-muted text-neutral hover:text-secondary transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSaleExpand(row.id);
                              }}
                            >
                              {isExpanded ? <ChevronDown className="w-4 h-4 text-primary" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                          ) : null}
                        </TableCell>
                        <TableCell className="py-3 pr-2 font-mono font-semibold text-primary">
                          <div className="flex items-center gap-1.5">
                            {row.invoiceNumber}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-2 text-neutral">{formatReportDate(row.createdAt)}</TableCell>
                        <TableCell className="py-3 px-2 uppercase font-medium max-w-[200px] truncate">{row.clientName}</TableCell>
                        <TableCell className="py-3 px-2 text-right font-mono font-semibold">{Math.floor(row.pieces)}</TableCell>
                        <TableCell className="py-3 px-2 text-right font-mono font-bold">{formatMoney(Number(row.salePrice))}</TableCell>
                        <TableCell className="py-3 px-2 text-right font-mono font-bold text-rose-500/80">{formatMoney(Number(row.costPrice))}</TableCell>
                        <TableCell className={`py-3 pl-2 text-right font-mono font-bold ${row.difference >= 0 ? 'text-emerald-500' : 'text-rose-600'}`}>
                          {formatMoney(Number(row.difference))}
                        </TableCell>
                      </TableRow>

                      {/* Expanded Product Details */}
                      {isExpanded && row.items && (
                        <TableRow className="bg-muted/15 border-b border-border/80 hover:bg-muted/15">
                          <TableCell colSpan={8} className="p-3 pl-6 sm:pl-10 whitespace-normal">
                            <div className="rounded-xl border border-border/60 bg-bg-dark/50 overflow-hidden shadow-inner">
                              <div className="px-3 py-2 bg-muted/40 border-b border-border/60 flex items-center justify-between text-[11px] font-semibold text-secondary">
                                <span className="flex items-center gap-1.5">
                                  <Package className="w-3.5 h-3.5 text-primary" />
                                  Productos vendidos ({row.items.length})
                                </span>
                                <span className="text-[10px] text-neutral">
                                  Costos y márgenes individuales de la factura
                                </span>
                              </div>
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-border/40 text-[10px] uppercase font-medium text-neutral bg-muted/20">
                                    <th className="py-1.5 px-3 text-left">SKU</th>
                                    <th className="py-1.5 px-3 text-left">Producto</th>
                                    <th className="py-1.5 px-3 text-right">Cant.</th>
                                    <th className="py-1.5 px-3 text-right">Costo Unit.</th>
                                    <th className="py-1.5 px-3 text-right">Costo Total</th>
                                    <th className="py-1.5 px-3 text-right">Precio Venta</th>
                                    <th className="py-1.5 px-3 text-right">Venta Total</th>
                                    <th className="py-1.5 px-3 text-right">Ganancia</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {row.items.map((item) => (
                                    <tr key={item.id} className="border-b border-border/20 last:border-0 hover:bg-muted/10">
                                      <td className="py-2 px-3 font-mono text-[11px] text-primary">{item.sku || '-'}</td>
                                      <td className="py-2 px-3">
                                        <div className="font-medium text-secondary">{item.productName}</div>
                                      </td>
                                      <td className="py-2 px-3 text-right font-mono font-semibold">
                                        {item.quantity}
                                        {item.refundedQuantity > 0 && (
                                          <span className="block text-[9px] text-rose-500 font-normal">
                                            ({item.refundedQuantity} dev.)
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-2 px-3 text-right font-mono text-neutral">{formatMoney(item.unitCost)}</td>
                                      <td className="py-2 px-3 text-right font-mono font-medium text-rose-500/90">{formatMoney(item.totalCost)}</td>
                                      <td className="py-2 px-3 text-right font-mono text-neutral">{formatMoney(item.unitPrice)}</td>
                                      <td className="py-2 px-3 text-right font-mono font-semibold text-secondary">
                                        {formatMoney(item.totalPrice)}
                                        {item.discountAmount > 0 && (
                                          <span className="block text-[9px] text-amber-500 font-normal">
                                            (-{formatMoney(item.discountAmount)})
                                          </span>
                                        )}
                                      </td>
                                      <td className={`py-2 px-3 text-right font-mono font-bold ${item.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {formatMoney(item.profit)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
              <TableFooter className="font-bold text-secondary bg-muted/20">
                <TableRow>
                  <TableCell className="w-8 px-1"></TableCell>
                  <TableCell className="py-3 pr-2 font-bold text-secondary" colSpan={3}>Gran total...</TableCell>
                  <TableCell className="py-3 px-2 text-right font-mono font-bold">{Math.floor(totals.pieces)}</TableCell>
                  <TableCell className="py-3 px-2 text-right font-mono font-bold text-primary">{formatMoney(Number(totals.sales))}</TableCell>
                  <TableCell className="py-3 px-2 text-right font-mono font-bold text-rose-500">{formatMoney(Number(totals.cost))}</TableCell>
                  <TableCell className={`py-3 pl-2 text-right font-mono font-extrabold ${totals.difference >= 0 ? 'text-emerald-500' : 'text-rose-600'}`}>
                    {formatMoney(Number(totals.difference))}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
};
