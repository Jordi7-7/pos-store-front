import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet,
  FileText,
  Loader2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useValuedInventoryReport } from '../hooks/useReports';
import { PaginationControls } from '@/shared/presentation/components/PaginationControls';
import { reportsRepository } from '../../infrastructure/dependencies';
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
import { useFormatters } from '@/modules/auth/presentation/hooks/useFormatters';
import { printHtml } from '@/shared/presentation/export/print-html';
import { downloadCsv } from '@/shared/presentation/export/download-csv';
import { inventoryTotals } from '../../domain/rules/report-totals';
import { valuedInventoryCsv, valuedInventoryPrintHtml } from '../view-models/valued-inventory.export';

interface ValuedInventoryTabProps {
  selectedBranchId?: string;
}

export const ValuedInventoryTab: React.FC<ValuedInventoryTabProps> = ({ selectedBranchId }) => {
  const fmt = useFormatters();
  const currentTenant = useTenant(); // el nombre del negocio ya está en la sesión: no hace falta pedirlo

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { loading: inventoryLoading, data: inventoryData, meta, fetchValuedInventory } = useValuedInventoryReport();

  useEffect(() => {
    // Reset to page 1 if branch changes
    setPage(1);
  }, [selectedBranchId]);

  useEffect(() => {
    // Fetch paginated report
    fetchValuedInventory({ page, limit, branchId: selectedBranchId });
  }, [page, limit, selectedBranchId]);


  // Aggregate totals (uses global totals from meta returned by backend)
  const totals = useMemo(() => {
    return {
      quantity: meta?.totalQuantity ?? 0,
      totalValue: meta?.totalValue ?? 0,
    };
  }, [meta]);

  /** El informe completo (no solo la página que se ve) para imprimir o exportar; si falla, se usa lo que hay en pantalla. */
  const loadFullInventory = async () => {
    try {
      const full = await reportsRepository.valuedInventory({ branchId: selectedBranchId });
      return { rows: full.data, totals: inventoryTotals(full.data) };
    } catch (e) {
      console.error('Error al pedir el inventario valuado completo:', e);
      return { rows: inventoryData, totals };
    }
  };

  const handlePrintReport = async () => {
    if (inventoryData.length === 0) {
      toast.warning('No hay datos para imprimir');
      return;
    }
    const full = await loadFullInventory();
    printHtml(valuedInventoryPrintHtml(full.rows, full.totals, fmt, { tenantName: currentTenant?.name || '', printedOn: fmt.shortDate(new Date()) }));
  };

  const handleExportExcel = async () => {
    if (inventoryData.length === 0) {
      toast.warning('No hay datos para exportar');
      return;
    }
    const full = await loadFullInventory();
    downloadCsv(`reporte_existencias_valuadas_${new Date().toISOString().split('T')[0]}.csv`, valuedInventoryCsv(full.rows, full.totals));
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
          <>
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
                      <TableCell className="py-3 px-2 text-right font-mono font-bold">{formatMoney(Number(row.purchasePrice))}</TableCell>
                      <TableCell className="py-3 pl-2 text-right font-mono font-bold text-emerald-600">{formatMoney(Number(row.totalValue))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter className="font-bold text-secondary bg-muted/20">
                  <TableRow>
                    <TableCell className="py-3 pr-2 font-bold text-secondary" colSpan={2}>Gran total...</TableCell>
                    <TableCell className="py-3 px-2 text-right font-mono font-bold">{Math.floor(totals.quantity)}</TableCell>
                    <TableCell className="py-3 px-2 text-right font-mono font-bold text-neutral">-</TableCell>
                    <TableCell className="py-3 pl-2 text-right font-mono font-extrabold text-emerald-600">{formatMoney(Number(totals.totalValue))}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
            <PaginationControls 
              meta={meta} 
              onPageChange={setPage} 
              onLimitChange={(newLimit) => {
                setLimit(newLimit);
                setPage(1);
              }} 
            />
          </>
        )}
      </Card>
    </div>
  );
};
