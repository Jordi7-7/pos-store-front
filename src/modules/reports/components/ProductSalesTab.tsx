import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from '@/lib/apiClient';
import { 
  FileSpreadsheet, 
  FileText, 
  Loader2, 
  CalendarIcon,
  ShoppingBag,
  PackageCheck,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { type DateRange } from 'react-day-picker';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
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

export const ProductSalesTab: React.FC = () => {
  const timezone = useAuthStore((state) => state.timezone) || 'America/Guayaquil';
  const [currentTenant, setCurrentTenant] = useState<any>(null);

  const { loading, data: productSalesData, fetchProductSales } = useProductSalesReport();

  // Date Range Defaults: Start of month to today
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });

  useEffect(() => {
    apiClient.request('/tenants/current')
      .then((t) => setCurrentTenant(t))
      .catch((e) => console.error('Error fetching tenant metadata:', e));
  }, []);

  const loadReport = () => {
    if (!dateRange?.from) {
      toast.warning('Por favor selecciona una fecha de inicio');
      return;
    }
    const startStr = format(dateRange.from, 'yyyy-MM-dd');
    const endStr = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : startStr;
    fetchProductSales(startStr, endStr);
  };

  useEffect(() => {
    if (dateRange?.from) {
      loadReport();
    }
  }, [dateRange]);

  // Totales agregados
  const totals = useMemo(() => {
    return productSalesData.reduce(
      (acc, row) => {
        acc.soldQuantity += Number(row.soldQuantity || 0);
        acc.currentStock += Number(row.currentStock || 0);
        acc.totalRevenue += Number(row.totalRevenue || 0);
        return acc;
      },
      { soldQuantity: 0, currentStock: 0, totalRevenue: 0 }
    );
  }, [productSalesData]);

  // Exportar a PDF (Impresión nativa estilizada)
  const handlePrintReport = () => {
    if (productSalesData.length === 0) {
      toast.warning('No hay datos para imprimir');
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const startStr = dateRange?.from ? format(dateRange.from, 'dd/MM/yyyy') : '';
    const endStr = dateRange?.to ? format(dateRange.to, 'dd/MM/yyyy') : startStr;
    const periodStr = `${startStr} al ${endStr}`;
    const todayStr = new Date().toLocaleDateString(undefined, { timeZone: timezone });

    const rowsHtml = productSalesData.map((row) => `
      <tr style="border-top: 1px solid #e5e7eb;">
        <td style="font-family: monospace; font-weight: bold;">${row.sku}</td>
        <td style="text-transform: uppercase;">${row.name}</td>
        <td style="text-align: right; font-weight: bold;">${row.soldQuantity}</td>
        <td style="text-align: right;">${row.currentStock}</td>
        <td style="text-align: right;">$${Number(row.salePrice).toFixed(2)}</td>
        <td style="text-align: right; font-weight: bold;">$${Number(row.totalRevenue).toFixed(2)}</td>
      </tr>
    `).join('');

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Reporte de Ventas por Producto</title>
          <style>
            @page {
              margin: 10mm;
              size: portrait;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 10px;
              color: #111;
              margin: 0;
              padding: 0;
            }
            .header {
              margin-bottom: 15px;
            }
            .header-title {
              font-size: 13px;
              font-weight: bold;
              text-decoration: underline;
              margin-bottom: 2px;
            }
            .header-info {
              font-size: 10px;
              margin-bottom: 1px;
            }
            .print-date {
              float: right;
              font-size: 9px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 5px;
            }
            th {
              border-top: 1px solid #000;
              border-bottom: 1px solid #000;
              padding: 5px 4px;
              font-weight: bold;
              text-align: left;
              font-size: 10px;
            }
            td {
              padding: 4px;
              font-size: 9.5px;
            }
            .total-row td {
              border-top: 1px solid #000;
              border-bottom: 1.5px double #000;
              font-weight: bold;
            }
            .page-number {
              float: right;
              font-size: 8px;
            }
          </style>
        </head>
        <body>
          <div class="print-date">Impreso el: ${todayStr}</div>
          <div class="page-number">Página: 1</div>
          <div class="header">
            <div class="header-title" style="text-transform: uppercase;">${currentTenant?.name || 'NEGOCIO'}</div>
            <div class="header-info" style="font-weight: bold;">Reporte de Ventas por Producto</div>
            <div class="header-info" style="font-weight: bold;">Período: ${periodStr}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 15%;">SKU</th>
                <th style="width: 40%;">Nombre del Producto</th>
                <th style="width: 11%; text-align: right;">Vendidos</th>
                <th style="width: 11%; text-align: right;">Stock Actual</th>
                <th style="width: 11%; text-align: right;">Precio Vta.</th>
                <th style="width: 12%; text-align: right;">Total Venta</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <tr class="total-row">
                <td colspan="2" style="text-align: right; text-transform: uppercase;">Gran Total:</td>
                <td style="text-align: right;">${totals.soldQuantity}</td>
                <td style="text-align: right;">${totals.currentStock}</td>
                <td style="text-align: right;">-</td>
                <td style="text-align: right;">$${Number(totals.totalRevenue).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      document.body.removeChild(iframe);
    }, 500);
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

      const rows: any[][] = [
        [currentTenant?.name || 'NEGOCIO'],
        ['Reporte de Ventas de Productos'],
        [`Período: ${startStr} al ${endStr}`],
        [],
        ['SKU', 'Nombre del Producto', 'Stock Vendido', 'Stock Actual', 'Precio Venta', 'Total Recaudado']
      ];

      productSalesData.forEach((row) => {
        rows.push([
          row.sku,
          row.name,
          row.soldQuantity,
          row.currentStock,
          Number(row.salePrice),
          Number(row.totalRevenue)
        ]);
      });

      rows.push([]);
      rows.push([
        'TOTAL',
        '',
        totals.soldQuantity,
        totals.currentStock,
        '',
        Number(totals.totalRevenue)
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-bg-card border border-border-card shadow-sm">
        <div>
          <h2 className="text-base font-bold text-secondary flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Reporte de Ventas por Producto
          </h2>
          <p className="text-xs text-neutral mt-0.5">
            Analiza las unidades vendidas por producto, existencias actuales y total recaudado en el período.
          </p>
        </div>

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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-border-card bg-bg-card rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral uppercase tracking-widest font-semibold">Piezas Vendidas</span>
            <div className="p-2 bg-primary/10 rounded-lg"><ShoppingBag className="w-4 h-4 text-primary" /></div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-black text-secondary">{totals.soldQuantity}</h3>
            <p className="text-[10px] text-neutral mt-0.5">Total de unidades despachadas</p>
          </div>
        </Card>

        <Card className="border border-border-card bg-bg-card rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral uppercase tracking-widest font-semibold">Stock Actual Total</span>
            <div className="p-2 bg-blue-500/10 rounded-lg"><PackageCheck className="w-4 h-4 text-blue-500" /></div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-black text-secondary">{totals.currentStock}</h3>
            <p className="text-[10px] text-neutral mt-0.5">Inventario remanente en sucursales</p>
          </div>
        </Card>

        <Card className="border border-border-card bg-bg-card rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral uppercase tracking-widest font-semibold">Total Recaudado</span>
            <div className="p-2 bg-emerald-500/10 rounded-lg"><DollarSign className="w-4 h-4 text-emerald-500" /></div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-black text-emerald-500">${totals.totalRevenue.toFixed(2)}</h3>
            <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Ingresos por productos vendidos</p>
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
                  <TableHead className="text-[11px] font-bold text-neutral uppercase tracking-wider">SKU</TableHead>
                  <TableHead className="text-[11px] font-bold text-neutral uppercase tracking-wider">Nombre</TableHead>
                  <TableHead className="text-[11px] font-bold text-neutral uppercase tracking-wider text-right">Stock Vendido</TableHead>
                  <TableHead className="text-[11px] font-bold text-neutral uppercase tracking-wider text-right">Stock Actual</TableHead>
                  <TableHead className="text-[11px] font-bold text-neutral uppercase tracking-wider text-right">Precio Venta</TableHead>
                  <TableHead className="text-[11px] font-bold text-neutral uppercase tracking-wider text-right">Total Venta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productSalesData.map((row) => (
                  <TableRow key={row.variantId} className="border-border-card/50 hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold text-secondary">
                      {row.sku}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-secondary">
                      {row.name}
                    </TableCell>
                    <TableCell className="text-right text-xs font-bold text-secondary">
                      {row.soldQuantity}
                    </TableCell>
                    <TableCell className="text-right text-xs font-semibold text-neutral">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-mono ${
                        row.currentStock <= 5 
                          ? 'bg-rose-500/10 text-rose-500 font-bold' 
                          : 'bg-bg-dark text-secondary'
                      }`}>
                        {row.currentStock}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-semibold text-secondary">
                      ${row.salePrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold text-emerald-500">
                      ${row.totalRevenue.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter className="bg-bg-dark border-t border-border-card font-bold">
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={2} className="text-xs uppercase tracking-wider text-secondary">
                    Gran Total ({productSalesData.length} productos)
                  </TableCell>
                  <TableCell className="text-right text-xs font-bold text-secondary">
                    {totals.soldQuantity}
                  </TableCell>
                  <TableCell className="text-right text-xs font-bold text-secondary">
                    {totals.currentStock}
                  </TableCell>
                  <TableCell className="text-right text-xs text-neutral">
                    -
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold text-emerald-500">
                    ${totals.totalRevenue.toFixed(2)}
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
