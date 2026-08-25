import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from '@/lib/apiClient';
import { 
  Printer,
  Loader2,
  CalendarIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { type DateRange } from 'react-day-picker';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
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

export const CostSalesTab: React.FC = () => {
  const timezone = useAuthStore((state) => state.timezone) || 'America/Guayaquil';
  const [currentTenant, setCurrentTenant] = useState<any>(null);

  // Use modular hook
  const { loading: costLoading, data: salesCostData, fetchSalesCost } = useSalesCostReport();

  // Date Picker Range state (Defaults: start of month to today)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });

  // Fetch tenant info
  useEffect(() => {
    apiClient.request('/tenants/current')
      .then((t) => setCurrentTenant(t))
      .catch((e) => console.error('Error fetching tenant metadata:', e));
  }, []);

  const loadCostReport = () => {
    if (!dateRange?.from) {
      toast.warning('Por favor selecciona una fecha de inicio');
      return;
    }
    const startStr = format(dateRange.from, 'yyyy-MM-dd');
    const endStr = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : startStr;
    fetchSalesCost(startStr, endStr);
  };

  // Initial load when dateRange is set
  useEffect(() => {
    if (dateRange?.from) {
      loadCostReport();
    }
  }, [dateRange]);

  // Aggregate totals
  const totals = useMemo(() => {
    return salesCostData.reduce(
      (acc, row) => {
        acc.pieces += Number(row.pieces || 0);
        acc.sales += Number(row.salePrice || 0);
        acc.cost += Number(row.costPrice || 0);
        acc.difference += Number(row.difference || 0);
        return acc;
      },
      { pieces: 0, sales: 0, cost: 0, difference: 0 }
    );
  }, [salesCostData]);

  // Format date helper DD/MM in selected timezone
  const formatReportDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString('es-ES', {
        timeZone: timezone,
        day: '2-digit',
        month: '2-digit'
      });
    } catch (e) {
      return '';
    }
  };

  const handlePrintCostReport = () => {
    if (salesCostData.length === 0) {
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

    const rowsHtml = salesCostData.map((row) => `
      <tr>
        <td>${row.invoiceNumber}</td>
        <td>${formatReportDate(row.createdAt)}</td>
        <td style="text-transform: uppercase;">${row.clientName}</td>
        <td style="text-align: right;">${Math.floor(row.pieces)}</td>
        <td style="text-align: right;">$${Number(row.salePrice).toFixed(2)}</td>
        <td style="text-align: right;">$${Number(row.costPrice).toFixed(2)}</td>
        <td style="text-align: right;">$${Number(row.difference).toFixed(2)}</td>
      </tr>
    `).join('');

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Resumen de Costo de Ventas por Documentos</title>
          <style>
            @page {
              margin: 10mm;
              size: portrait;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 10px;
              color: #000;
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
              margin-top: 10px;
            }
            th {
              border-top: 1px solid #000;
              border-bottom: 1px solid #000;
              padding: 5px 2px;
              font-weight: bold;
              text-align: left;
              font-size: 10px;
            }
            td {
              padding: 4px 2px;
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
            <div class="header-info" style="font-weight: bold;">Resumen de costo de ventas por documentos</div>
            <div class="header-info">Documentos: Factura</div>
            <div class="header-info" style="font-weight: bold;">Período: ${periodStr}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 14%;">Factura</th>
                <th style="width: 10%;">Fecha</th>
                <th style="width: 32%;">Cliente</th>
                <th style="width: 10%; text-align: right;">Pzas</th>
                <th style="width: 11%; text-align: right;">Precio de venta</th>
                <th style="width: 11%; text-align: right;">Precio de costo</th>
                <th style="width: 12%; text-align: right;">Diferencia</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <tr class="total-row">
                <td colspan="3">Gran total...</td>
                <td style="text-align: right;">${Math.floor(totals.pieces)}</td>
                <td style="text-align: right;">$${Number(totals.sales).toFixed(2)}</td>
                <td style="text-align: right;">$${Number(totals.cost).toFixed(2)}</td>
                <td style="text-align: right;">$${Number(totals.difference).toFixed(2)}</td>
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
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 200);
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
              onClick={handlePrintCostReport}
              disabled={salesCostData.length === 0}
              className="flex items-center gap-1.5 bg-bg-dark border border-border-card hover:bg-muted text-secondary disabled:opacity-40 text-xs font-bold py-2 px-3 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4 text-primary" />
              <span>Imprimir</span>
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
                {salesCostData.map((row) => (
                  <TableRow key={row.id} className="text-secondary hover:bg-muted/10 transition-colors">
                    <TableCell className="py-3 pr-2 font-mono font-semibold text-primary">{row.invoiceNumber}</TableCell>
                    <TableCell className="py-3 px-2 text-neutral">{formatReportDate(row.createdAt)}</TableCell>
                    <TableCell className="py-3 px-2 uppercase font-medium max-w-[200px] truncate">{row.clientName}</TableCell>
                    <TableCell className="py-3 px-2 text-right font-mono font-semibold">{Math.floor(row.pieces)}</TableCell>
                    <TableCell className="py-3 px-2 text-right font-mono font-bold">${Number(row.salePrice).toFixed(2)}</TableCell>
                    <TableCell className="py-3 px-2 text-right font-mono font-bold text-rose-500/80">${Number(row.costPrice).toFixed(2)}</TableCell>
                    <TableCell className={`py-3 pl-2 text-right font-mono font-bold ${row.difference >= 0 ? 'text-emerald-500' : 'text-rose-600'}`}>
                      ${Number(row.difference).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter className="font-bold text-secondary bg-muted/20">
                <TableRow>
                  <TableCell className="py-3 pr-2 font-bold text-secondary" colSpan={3}>Gran total...</TableCell>
                  <TableCell className="py-3 px-2 text-right font-mono font-bold">{Math.floor(totals.pieces)}</TableCell>
                  <TableCell className="py-3 px-2 text-right font-mono font-bold text-primary">${Number(totals.sales).toFixed(2)}</TableCell>
                  <TableCell className="py-3 px-2 text-right font-mono font-bold text-rose-500">${Number(totals.cost).toFixed(2)}</TableCell>
                  <TableCell className={`py-3 pl-2 text-right font-mono font-extrabold ${totals.difference >= 0 ? 'text-emerald-500' : 'text-rose-600'}`}>
                    ${Number(totals.difference).toFixed(2)}
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
