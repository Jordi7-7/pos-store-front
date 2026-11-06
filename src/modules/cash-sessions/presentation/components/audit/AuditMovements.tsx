import React, { useState } from 'react';
import { ShoppingBag, TrendingDown, RotateCcw, User, Printer } from 'lucide-react';
import type { CashSessionDetailsVM, CashSessionExpenseVM, CashSessionRefundVM, CashSessionSaleVM } from '../../view-models/cash-session.vm';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SaleStatus } from '@/modules/sales/domain/enums';

/** Ventas, gastos y devoluciones del turno, por pestañas. */
interface AuditMovementsProps {
  details: CashSessionDetailsVM;
  onPrintSale: (sale: CashSessionSaleVM) => void;
}

export const AuditMovements: React.FC<AuditMovementsProps> = ({ details, onPrintSale }) => {
  const [activeTab, setActiveTab] = useState<'sales' | 'expenses' | 'refunds'>('sales');

  return (
    <div>
      <div className="flex gap-2 border-b border-border/80 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('sales')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
            activeTab === 'sales'
              ? 'bg-primary text-white shadow-xs'
              : 'text-neutral hover:text-secondary hover:bg-muted/10'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Ventas ({details.sales.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
            activeTab === 'expenses'
              ? 'bg-primary text-white shadow-xs'
              : 'text-neutral hover:text-secondary hover:bg-muted/10'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          Gastos / Retiros ({details.expenses.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('refunds')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
            activeTab === 'refunds'
              ? 'bg-primary text-white shadow-xs'
              : 'text-neutral hover:text-secondary hover:bg-muted/10'
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
                <TableRow className="uppercase text-[10px] font-bold bg-muted/20">
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
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-bg-dark border border-border-card text-[11px]">
                        <User className="w-3 h-3 text-neutral" />
                        {sale.userName}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4 font-semibold text-secondary uppercase">
                      {sale.customerName}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-center font-mono font-medium">
                      {sale.totalItems}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
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
                <TableRow className="uppercase text-[10px] font-bold bg-muted/20">
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
                    <TableCell className="py-3 px-4 font-semibold text-secondary uppercase">
                      {exp.description}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-neutral font-medium">
                      {exp.createdAtFormatted}
                    </TableCell>
                    <TableCell className="py-3 px-4 font-medium text-secondary">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-bg-dark border border-border-card text-[11px]">
                        <User className="w-3 h-3 text-neutral" />
                        {exp.userName}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral bg-bg-dark border border-border-card px-2.5 py-1 rounded-lg">
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
                <TableRow className="uppercase text-[10px] font-bold bg-muted/20">
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
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-bg-dark border border-border-card text-[11px]">
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
