import React, { useState } from 'react';
import { ShoppingBag, TrendingDown, RotateCcw, User, Printer } from 'lucide-react';
import type { CashSessionDetailsVM, CashSessionExpenseVM, CashSessionRefundVM, CashSessionSaleVM } from '../../view-models/cash-session.vm';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SaleStatus } from '@/shared/domain/enums/payments';

/** Ventas, gastos y devoluciones del turno, por pestañas. */
interface AuditMovementsProps {
  details: CashSessionDetailsVM;
  onPrintSale: (sale: CashSessionSaleVM) => void;
}

export const AuditMovements: React.FC<AuditMovementsProps> = ({ details, onPrintSale }) => {
  const [activeTab, setActiveTab] = useState<'sales' | 'expenses' | 'refunds'>('sales');

  return (
    <div className="min-w-0">
      <div className="flex gap-1 overflow-x-auto border-b border-border-card" role="tablist">
        <button
          type="button"
          role="tab"
          onClick={() => setActiveTab('sales')}
 className={`-mb-px flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap border-b-2 px-3 pb-2.5 pt-1 text-sm font-medium transition-colors ${
            activeTab === 'sales'
              ? 'border-primary text-secondary'
              : 'border-transparent text-muted-foreground hover:text-secondary'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Ventas ({details.sales.length})
        </button>
        <button
          type="button"
          role="tab"
          onClick={() => setActiveTab('expenses')}
 className={`-mb-px flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap border-b-2 px-3 pb-2.5 pt-1 text-sm font-medium transition-colors ${
            activeTab === 'expenses'
              ? 'border-primary text-secondary'
              : 'border-transparent text-muted-foreground hover:text-secondary'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          Gastos / Retiros ({details.expenses.length})
        </button>
        <button
          type="button"
          role="tab"
          onClick={() => setActiveTab('refunds')}
 className={`-mb-px flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap border-b-2 px-3 pb-2.5 pt-1 text-sm font-medium transition-colors ${
            activeTab === 'refunds'
              ? 'border-primary text-secondary'
              : 'border-transparent text-muted-foreground hover:text-secondary'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          Devoluciones ({details.refunds.length})
        </button>
      </div>

      {/* Contenido de las pestañas */}
      <div className="mt-4">
        {activeTab === 'sales' &&
          (details.sales.length === 0 ? (
            <div className="text-center py-16 text-neutral text-xs italic">
              No se registraron ventas en esta sesión.
            </div>
          ) : (
            <Table>
              <TableHeader>
 <TableRow className=" text-xs font-bold bg-muted/20">
                  <TableHead className="py-3 px-4">Folio / Ticket</TableHead>
                  <TableHead className="py-3 px-4">Hora</TableHead>
                  <TableHead className="py-3 px-4">Cajero</TableHead>
                  <TableHead className="py-3 px-4">Cliente</TableHead>
                  <TableHead className="py-3 px-4 text-center">Items</TableHead>
                  <TableHead className="py-3 px-4 text-center">Estado</TableHead>
                  <TableHead className="py-3 px-4 text-right">Total Cobrado</TableHead>
                  <TableHead className="py-3 px-4 text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {details.sales.map((sale: CashSessionSaleVM) => (
                  <TableRow
                    key={sale.id}
                    className="text-xs hover:bg-muted/10 transition-colors"
                  >
                    <TableCell className="py-3 px-4 font-mono font-bold text-primary">
                      {sale.invoiceNumber}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-neutral font-medium">
                      {sale.createdAtFormatted}
                    </TableCell>
                    <TableCell className="py-3 px-4 font-medium text-secondary">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-bg-dark border border-border-card text-xs">
                        <User className="w-3 h-3 text-neutral" />
                        {sale.userName}
                      </span>
                    </TableCell>
 <TableCell className="py-3 px-4 font-semibold text-secondary ">
                      {sale.customerName}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-center font-mono font-medium">
                      {sale.totalItems}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
                          sale.status === SaleStatus.COMPLETED
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : sale.status === SaleStatus.PARTIALLY_REFUNDED
                            ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        }`}
                      >
                        {sale.statusLabel}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right font-mono font-bold text-sm text-secondary">
                      {sale.totalFormatted}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onPrintSale(sale)}
                        title="Reimprimir ticket térmico"
                        className="inline-flex items-center justify-center p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ))}

        {activeTab === 'expenses' &&
          (details.expenses.length === 0 ? (
            <div className="text-center py-16 text-neutral text-xs italic">
              No se registraron gastos o retiros de dinero en esta sesión.
            </div>
          ) : (
            <Table>
              <TableHeader>
 <TableRow className=" text-xs font-bold bg-muted/20">
                  <TableHead className="py-3 px-4">Descripción del Gasto</TableHead>
                  <TableHead className="py-3 px-4">Hora</TableHead>
                  <TableHead className="py-3 px-4">Registrado por</TableHead>
                  <TableHead className="py-3 px-4">Categoría</TableHead>
                  <TableHead className="py-3 px-4 text-right">Monto Retirado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {details.expenses.map((exp: CashSessionExpenseVM) => (
                  <TableRow
                    key={exp.id}
                    className="text-xs hover:bg-muted/10 transition-colors"
                  >
 <TableCell className="py-3 px-4 font-semibold text-secondary ">
                      {exp.description}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-neutral font-medium">
                      {exp.createdAtFormatted}
                    </TableCell>
                    <TableCell className="py-3 px-4 font-medium text-secondary">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-bg-dark border border-border-card text-xs">
                        <User className="w-3 h-3 text-neutral" />
                        {exp.userName}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4">
 <span className="text-xs font-bold text-neutral bg-bg-dark border border-border-card px-2.5 py-1 rounded-lg">
                        {exp.category}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right font-mono font-bold text-sm text-rose-500">
                      {exp.amountFormatted}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ))}

        {activeTab === 'refunds' &&
          (details.refunds.length === 0 ? (
            <div className="text-center py-16 text-neutral text-xs italic">
              No se registraron devoluciones de ventas en esta sesión.
            </div>
          ) : (
            <Table>
              <TableHeader>
 <TableRow className=" text-xs font-bold bg-muted/20">
                  <TableHead className="py-3 px-4">Motivo de Devolución</TableHead>
                  <TableHead className="py-3 px-4">Hora</TableHead>
                  <TableHead className="py-3 px-4">Procesado por</TableHead>
                  <TableHead className="py-3 px-4">Folio de Venta Afectada</TableHead>
                  <TableHead className="py-3 px-4 text-right">
                    Monto Reembolsado
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {details.refunds.map((ref: CashSessionRefundVM) => (
                  <TableRow
                    key={ref.id}
                    className="text-xs hover:bg-muted/10 transition-colors"
                  >
                    <TableCell className="py-3 px-4 font-medium text-secondary">
                      {ref.reason}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-neutral font-medium">
                      {ref.createdAtFormatted}
                    </TableCell>
                    <TableCell className="py-3 px-4 font-medium text-secondary">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-bg-dark border border-border-card text-xs">
                        <User className="w-3 h-3 text-neutral" />
                        {ref.userName}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4 font-mono font-bold text-primary">
                      {ref.invoiceNumber}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right font-mono font-bold text-sm text-amber-600">
                      {ref.totalRefundedFormatted}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ))}
      </div>
    </div>
  );
};
