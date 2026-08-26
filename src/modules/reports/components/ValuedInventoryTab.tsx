import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from '@/lib/apiClient';
import { 
  FileSpreadsheet,
  FileText,
  Loader2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { useValuedInventoryReport } from '../hooks/useReports';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const ValuedInventoryTab: React.FC = () => {
  const timezone = useAuthStore((state) => state.timezone) || 'America/Guayaquil';
  const [currentTenant, setCurrentTenant] = useState<any>(null);

  const { loading: inventoryLoading, data: inventoryData, fetchValuedInventory } = useValuedInventoryReport();

  useEffect(() => {
    // Fetch initial report
    fetchValuedInventory();
    
    // Fetch tenant name
    apiClient.request('/tenants/current')
      .then((t) => setCurrentTenant(t))
      .catch((e) => console.error('Error fetching tenant metadata:', e));
  }, []);

  // Aggregate totals
  const totals = useMemo(() => {
    return inventoryData.reduce(
      (acc, row) => {
        acc.quantity += Number(row.quantity || 0);
        acc.totalValue += Number(row.totalValue || 0);
        return acc;
      },
      { quantity: 0, totalValue: 0 }
    );
  }, [inventoryData]);

  const handlePrintReport = () => {
    if (inventoryData.length === 0) {
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

    const todayStr = new Date().toLocaleDateString(undefined, { timeZone: timezone });

    const rowsHtml = inventoryData.map((row) => `
      <tr>
        <td>${row.sku}</td>
        <td style="text-transform: uppercase;">${row.name}</td>
        <td style="text-align: right;">${Math.floor(row.quantity)}</td>
        <td style="text-align: right;">$${Number(row.purchasePrice).toFixed(2)}</td>
        <td style="text-align: right;">$${Number(row.totalValue).toFixed(2)}</td>
      </tr>
    `).join('');

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Reporte de Existencias Valuadas</title>
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
            <div class="header-info" style="font-weight: bold;">Reporte de Existencias Valuadas</div>
            <div class="header-info">Valores consolidados de inventario actual</div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 20%;">SKU</th>
                <th style="width: 45%;">Nombre</th>
                <th style="width: 10%; text-align: right;">Cantidad</th>
                <th style="width: 12%; text-align: right;">Precio de compra</th>
                <th style="width: 13%; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <tr class="total-row">
                <td colspan="2">Gran total...</td>
                <td style="text-align: right;">${Math.floor(totals.quantity)}</td>
                <td style="text-align: right;">-</td>
                <td style="text-align: right;">$${Number(totals.totalValue).toFixed(2)}</td>
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

  const handleExportExcel = () => {
    if (inventoryData.length === 0) {
      toast.warning('No hay datos para exportar');
      return;
    }

    const headers = ['SKU', 'Nombre', 'Cantidad', 'Precio de compra', 'Total'];
    const rows = inventoryData.map((row) => [
      row.sku,
      row.name,
      Math.floor(row.quantity),
      Number(row.purchasePrice).toFixed(2),
      Number(row.totalValue).toFixed(2)
    ]);

    rows.push([
      'Gran total...',
      '',
      Math.floor(totals.quantity),
      '',
      Number(totals.totalValue).toFixed(2)
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(';'))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_existencias_valuadas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header Panel Bar */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/5 to-bg-card border border-primary/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-secondary mb-1">Existencias Valuadas</h2>
          <p className="text-xs text-neutral">Consulta el volumen consolidado y valor total actual de los productos variantes en almacén.</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => fetchValuedInventory()} 
            disabled={inventoryLoading}
            className="px-4 text-xs font-semibold h-9"
          >
            {inventoryLoading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
            Actualizar
          </Button>
          <button
            type="button"
            onClick={handlePrintReport}
            disabled={inventoryData.length === 0}
            title="Exportar a PDF / Imprimir"
            className="flex items-center justify-center bg-bg-dark border border-border-card hover:bg-muted text-secondary disabled:opacity-40 w-9 h-9 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <FileText className="w-4 h-4 text-rose-500" />
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={inventoryData.length === 0}
            title="Exportar a Excel"
            className="flex items-center justify-center bg-bg-dark border border-border-card hover:bg-muted text-secondary disabled:opacity-40 w-9 h-9 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
          </button>
        </div>
      </div>

      {/* Table Container Card */}
      <Card className="border border-border-card bg-bg-card rounded-2xl shadow-sm p-6 overflow-hidden">
        {inventoryLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-neutral">Cargando reporte de existencias valuadas...</p>
          </div>
        ) : inventoryData.length === 0 ? (
          <div className="text-center py-16 text-neutral text-xs italic">
            No hay productos registrados en inventario.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="uppercase tracking-wider text-[10px] font-bold">
                  <TableHead className="pr-2">SKU</TableHead>
                  <TableHead className="px-2">Nombre</TableHead>
                  <TableHead className="px-2 text-right">Cantidad</TableHead>
                  <TableHead className="px-2 text-right">Precio de compra</TableHead>
                  <TableHead className="pl-2 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryData.map((row) => (
                  <TableRow key={row.sku} className="text-secondary hover:bg-muted/10 transition-colors">
                    <TableCell className="py-3 pr-2 font-mono font-semibold text-primary">{row.sku}</TableCell>
                    <TableCell className="py-3 px-2 uppercase font-medium max-w-[300px] truncate">{row.name}</TableCell>
                    <TableCell className="py-3 px-2 text-right font-mono font-semibold">{Math.floor(row.quantity)}</TableCell>
                    <TableCell className="py-3 px-2 text-right font-mono font-bold">${Number(row.purchasePrice).toFixed(2)}</TableCell>
                    <TableCell className="py-3 pl-2 text-right font-mono font-bold text-emerald-600">${Number(row.totalValue).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter className="font-bold text-secondary bg-muted/20">
                <TableRow>
                  <TableCell className="py-3 pr-2 font-bold text-secondary" colSpan={2}>Gran total...</TableCell>
                  <TableCell className="py-3 px-2 text-right font-mono font-bold">{Math.floor(totals.quantity)}</TableCell>
                  <TableCell className="py-3 px-2 text-right font-mono font-bold text-neutral">-</TableCell>
                  <TableCell className="py-3 pl-2 text-right font-mono font-extrabold text-emerald-600">${Number(totals.totalValue).toFixed(2)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
};
