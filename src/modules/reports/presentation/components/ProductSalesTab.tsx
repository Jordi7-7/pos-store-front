import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  FileText, 
  Loader2, 
  CalendarIcon,
  ShoppingBag,
  PackageCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { type DateRange } from 'react-day-picker';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useFormatters } from '@/modules/auth/presentation/hooks/useFormatters';
import { printHtml } from '@/shared/presentation/export/print-html';
import { soldPieces } from '../../domain/rules/report-totals';
import { productSalesPrintHtml } from '../view-models/product-sales.export';
import { useProductSalesReport } from '../hooks/useReports';
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

interface ProductSalesTabProps {
  selectedBranchId?: string;
}

export const ProductSalesTab: React.FC<ProductSalesTabProps> = ({ selectedBranchId }) => {
  const fmt = useFormatters();
  const currentTenant = useTenant(); // el nombre del negocio ya está en la sesión: no hace falta pedirlo

  const { loading, data: productSalesData, fetchProductSales } = useProductSalesReport();

  // Date Range Defaults: Start of month to today
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });


  const loadReport = () => {
    if (!dateRange?.from) {
      toast.warning('Por favor selecciona una fecha de inicio');
      return;
    }
    const startStr = format(dateRange.from, 'yyyy-MM-dd');
    const endStr = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : startStr;
    fetchProductSales(startStr, endStr, selectedBranchId);
  };

  useEffect(() => {
    if (dateRange?.from) {
      loadReport();
    }
  }, [dateRange, selectedBranchId]);

  const totals = useMemo(() => ({ soldQuantity: soldPieces(productSalesData) }), [productSalesData]);
  const formatReportDateTime = (iso: string) => fmt.dateTime(iso);

  const periodText = () => {
    const from = dateRange?.from ? format(dateRange.from, 'dd/MM/yyyy') : '';
    const to = dateRange?.to ? format(dateRange.to, 'dd/MM/yyyy') : from;
    return `${from} al ${to}`;
  };

  const handlePrintReport = () => {
    if (productSalesData.length === 0) {
      toast.warning('No hay datos para imprimir');
      return;
    }
    printHtml(productSalesPrintHtml(productSalesData, totals.soldQuantity, fmt, { tenantName: currentTenant?.name || '', period: periodText(), printedOn: fmt.shortDate(new Date()) }), 500);
  };

  // Exportar a Excel
  const handleExportExcel = async () => {
    if (productSalesData.length === 0) {
      toast.warning('No hay datos para exportar');
      return;
    }

    try {
      const XLSX = await import('xlsx');
      const startStr = dateRange?.from ? format(dateRange.from, 'dd/MM/yyyy') : '';
      const endStr = dateRange?.to ? format(dateRange.to, 'dd/MM/yyyy') : startStr;

      const rows: Array<Array<string | number>> = [
        [currentTenant?.name || 'NEGOCIO'],
        ['Reporte de Ventas de Productos'],
        [`Período: ${startStr} al ${endStr}`],
        [],
        ['SKU', 'Nombre del Producto', 'Fecha y Hora', 'Ticket/Factura', 'Stock Vendido', 'Stock Actual', 'Precio Venta']
      ];

      productSalesData.forEach((row) => {
        rows.push([
          row.sku,
          row.name,
          formatReportDateTime(row.createdAt),
          row.invoiceNumber || '-',
          row.soldQuantity,
          row.currentStock,
          Number(row.salePrice)
        ]);
      });

      rows.push([]);
      rows.push([
        'TOTAL PIEZAS VENDIDAS',
        '',
        '',
        '',
        totals.soldQuantity,
        '',
        ''
      ]);

      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Ventas por Producto');

      const fileName = `Ventas_Productos_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success('Archivo Excel descargado exitosamente');
    } catch (e) {
      console.error('Error exportando Excel:', e);
      toast.error('Error al exportar a Excel');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Filter and Actions Header */}
      <div className="flex flex-wrap items-center justify-end gap-3 rounded-xl border border-border-card bg-bg-card p-4 shadow-xs">
        {/* Date Picker Range + Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <Field className="w-auto">
            <Popover>
              <PopoverTrigger render={
                <Button
                  id="date"
                  variant="outline"
                  className="w-[240px] justify-start text-left font-normal text-xs h-9 bg-bg-dark border-border-card"
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
              onClick={loadReport} 
              disabled={loading}
              className="px-4 text-xs font-semibold h-9"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Consultar
            </Button>
            <button
              type="button"
              onClick={handlePrintReport}
              disabled={productSalesData.length === 0}
              title="Exportar a PDF / Imprimir"
              className="flex items-center justify-center bg-bg-dark border border-border-card hover:bg-muted text-secondary disabled:opacity-40 w-9 h-9 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <FileText className="w-4 h-4 text-rose-500" />
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={productSalesData.length === 0}
              title="Exportar a Excel"
              className="flex items-center justify-center bg-bg-dark border border-border-card hover:bg-muted text-secondary disabled:opacity-40 w-9 h-9 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border border-border-card bg-bg-card rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between">
 <span className="text-xs text-neutral font-semibold">Piezas Vendidas</span>
            <div className="p-2 bg-primary/10 rounded-lg"><ShoppingBag className="w-4 h-4 text-primary" /></div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-black text-secondary">{totals.soldQuantity}</h3>
            <p className="text-xs text-neutral mt-0.5">Total de unidades despachadas en el período</p>
          </div>
        </Card>

        <Card className="border border-border-card bg-bg-card rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between">
 <span className="text-xs text-neutral font-semibold">Registros de Venta</span>
            <div className="p-2 bg-blue-500/10 rounded-lg"><PackageCheck className="w-4 h-4 text-blue-500" /></div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-black text-secondary">{productSalesData.length}</h3>
            <p className="text-xs text-neutral mt-0.5">Transacciones / líneas procesadas</p>
          </div>
        </Card>
      </div>

      {/* Table Container Card */}
      <Card className="border border-border-card bg-bg-card rounded-2xl shadow-sm p-6 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-neutral">Generando reporte de ventas de productos...</p>
          </div>
        ) : productSalesData.length === 0 ? (
          <div className="text-center py-16 text-neutral text-xs italic">
            No se encontraron ventas para los productos en el período seleccionado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border-card hover:bg-transparent">
                  <TableHead className="text-xs font-bold text-neutral uppercase tracking-wider">SKU</TableHead>
                  <TableHead className="text-xs font-bold text-neutral uppercase tracking-wider">Nombre</TableHead>
                  <TableHead className="text-xs font-bold text-neutral uppercase tracking-wider">Fecha / Hora</TableHead>
                  <TableHead className="text-xs font-bold text-neutral uppercase tracking-wider text-right">Stock Vendido</TableHead>
                  <TableHead className="text-xs font-bold text-neutral uppercase tracking-wider text-right">Stock Actual</TableHead>
                  <TableHead className="text-xs font-bold text-neutral uppercase tracking-wider text-right">Precio Venta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productSalesData.map((row, idx) => (
                  <TableRow key={`${row.variantId}-${row.salePrice}-${row.createdAt}-${idx}`} className="border-border-card/50 hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold text-secondary">
                      {row.sku}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-secondary">
                      {row.name}
                    </TableCell>
                    <TableCell className="text-xs text-neutral whitespace-nowrap">
                      <div className="font-medium text-secondary/90">{formatReportDateTime(row.createdAt)}</div>
                      {row.invoiceNumber && (
                        <div className="font-mono text-xs text-neutral/70">Doc: {row.invoiceNumber}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs font-bold text-secondary">
                      {row.soldQuantity}
                    </TableCell>
                    <TableCell className="text-right text-xs font-semibold text-neutral">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-mono ${
                        row.currentStock <= 5 
                          ? 'bg-rose-500/10 text-rose-500 font-bold' 
                          : 'bg-bg-dark text-secondary'
                      }`}>
                        {row.currentStock}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-semibold text-secondary">
                      {formatMoney(row.salePrice)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter className="bg-bg-dark border-t border-border-card font-bold">
                <TableRow className="hover:bg-transparent">
 <TableCell colSpan={3} className="text-xs text-secondary">
                    Total Piezas Vendidas ({productSalesData.length} registros)
                  </TableCell>
                  <TableCell className="text-right text-xs font-bold text-secondary">
                    {totals.soldQuantity}
                  </TableCell>
                  <TableCell className="text-right text-xs text-neutral">
                    -
                  </TableCell>
                  <TableCell className="text-right text-xs text-neutral">
                    -
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
