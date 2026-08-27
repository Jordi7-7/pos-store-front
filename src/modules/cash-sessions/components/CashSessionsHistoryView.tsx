import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  ArrowRight, 
  ShoppingBag, 
  TrendingDown, 
  RotateCcw, 
  Loader2,
  Lock,
  Unlock
} from 'lucide-react';
import { useCashSessionsList, useCashSessionDetailsQuery } from '../hooks/useCashSessions';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export const CashSessionsHistoryView: React.FC = () => {
  const timezone = useAuthStore((state) => state.timezone) || 'America/Guayaquil';
  const selectedBranchId = useAuthStore((state) => state.selectedBranchId);

  const { sessions, isLoading: listLoading, refetch } = useCashSessionsList(selectedBranchId || undefined);

  // Selected session for detail modal
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const { details, isLoading: detailLoading } = useCashSessionDetailsQuery(selectedSessionId);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // active tab inside detail modal
  const [detailTab, setDetailTab] = useState<'sales' | 'expenses' | 'refunds'>('sales');

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchCashier = s.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchBranch = s.branch?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCashier || matchBranch;
    });
  }, [sessions, searchTerm]);

  // Formatter helpers
  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-EC', {
      timeZone: timezone,
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  // Calculations for modal summary KPIs
  const financialSummary = useMemo(() => {
    if (!details) return { totalSales: 0, totalExpenses: 0, totalRefunds: 0, expected: 0 };
    const salesSum = details.sales.reduce((sum: number, sale: any) => {
      if (sale.status === 'REFUNDED') return sum;
      return sum + Number(sale.total || 0);
    }, 0);
    const expensesSum = details.expenses.reduce((sum: number, exp: any) => sum + Number(exp.amount || 0), 0);
    const refundsSum = details.refunds.reduce((sum: number, ref: any) => sum + Number(ref.totalRefunded || 0), 0);
    const expected = Number(details.session.openingBalance || 0) + salesSum - expensesSum - refundsSum;

    return {
      totalSales: salesSum,
      totalExpenses: expensesSum,
      totalRefunds: refundsSum,
      expected
    };
  }, [details]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-primary/5 to-bg-card p-6 rounded-2xl border border-primary/10 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-secondary flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Historial de Sesiones de Caja
          </h2>
          <p className="text-xs text-neutral">Consulta los cierres históricos de caja chica, arqueos de valores, y auditoría detallada de transacciones.</p>
        </div>
        <Button 
          onClick={() => refetch()} 
          className="text-xs font-semibold h-9 rounded-xl shadow-md shadow-primary/5 cursor-pointer"
        >
          Sincronizar
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-bg-card border border-border-card rounded-2xl px-3 py-1.5 shadow-sm max-w-md">
        <Search className="w-4 h-4 text-neutral" />
        <input 
          type="text" 
          placeholder="Buscar por cajero o sucursal..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent text-xs text-secondary focus:outline-none w-full placeholder-neutral font-medium"
        />
      </div>

      {/* Main Sessions Table */}
      <Card className="border border-border-card bg-bg-card rounded-2xl shadow-sm p-6 overflow-hidden">
        {listLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-neutral">Cargando historial de cajas...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-16 text-neutral text-xs italic">
            No se encontraron sesiones de caja en el historial.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="uppercase tracking-wider text-[10px] font-bold">
                  <TableHead className="pr-2">Caja Abierta</TableHead>
                  <TableHead className="px-2">Caja Cerrada</TableHead>
                  <TableHead className="px-2">Sucursal</TableHead>
                  <TableHead className="px-2">Cajero</TableHead>
                  <TableHead className="px-2 text-right">Apertura</TableHead>
                  <TableHead className="px-2 text-right">Cierre Real</TableHead>
                  <TableHead className="px-2 text-center">Estado</TableHead>
                  <TableHead className="pl-2 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((s) => (
                  <TableRow key={s.id} className="text-secondary hover:bg-muted/10 transition-colors">
                    <TableCell className="py-3 pr-2 font-medium whitespace-nowrap">{formatDateTime(s.openedAt)}</TableCell>
                    <TableCell className="py-3 px-2 font-medium whitespace-nowrap">
                      {s.closedAt ? formatDateTime(s.closedAt) : <span className="text-neutral italic">Abierta aún</span>}
                    </TableCell>
                    <TableCell className="py-3 px-2 font-semibold text-primary">{s.branch?.name}</TableCell>
                    <TableCell className="py-3 px-2 font-medium">{s.user?.name}</TableCell>
                    <TableCell className="py-3 px-2 text-right font-mono font-bold">${Number(s.openingBalance).toFixed(2)}</TableCell>
                    <TableCell className="py-3 px-2 text-right font-mono font-bold">
                      {s.closingBalance !== null ? (
                        `$${Number(s.closingBalance).toFixed(2)}`
                      ) : (
                        <span className="text-neutral italic">-</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-2 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        s.status === 'CLOSED' 
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                          : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      }`}>
                        {s.status === 'CLOSED' ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5 animate-pulse" />}
                        {s.status === 'CLOSED' ? 'Cerrada' : 'Abierta'}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 pl-2 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedSessionId(s.id)}
                        className="flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary-hover bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm ml-auto border border-primary/10"
                      >
                        Auditar Caja
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedSessionId} onOpenChange={(open) => { if (!open) setSelectedSessionId(null); }}>
        <DialogContent className="max-w-4xl bg-card border border-border rounded-2xl shadow-xl p-6 text-foreground max-h-[85vh] overflow-y-auto">
          {detailLoading || !details ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-xs text-neutral">Cargando desglose financiero de la caja...</p>
            </div>
          ) : (
            <>
              <DialogHeader className="border-b border-border pb-4">
                <DialogTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  Arqueo de Caja Chica
                </DialogTitle>
                <DialogDescription className="text-xs text-neutral mt-1">
                  ID: <span className="font-mono">{details.session.id}</span> | Abierta por {details.session.user?.name} en sucursal {details.session.branch?.name}.
                </DialogDescription>
              </DialogHeader>

              {/* KPI cards in drawer */}
              <div className="flex flex-wrap gap-3 mt-4">
                <div className="flex-1 min-w-[140px] p-3 bg-bg-dark border border-border-card rounded-xl flex flex-col justify-between min-h-[64px]">
                  <span className="text-[10px] text-neutral font-bold uppercase tracking-wider block">Apertura (+)</span>
                  <span className="text-sm font-bold text-secondary font-mono whitespace-nowrap mt-1">${Number(details.session.openingBalance).toFixed(2)}</span>
                </div>
                <div className="flex-1 min-w-[140px] p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex flex-col justify-between min-h-[64px]">
                  <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Ventas (+)</span>
                  <span className="text-sm font-bold text-emerald-600 font-mono whitespace-nowrap mt-1">${financialSummary.totalSales.toFixed(2)}</span>
                </div>
                <div className="flex-1 min-w-[140px] p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl flex flex-col justify-between min-h-[64px]">
                  <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider block">Gastos (-)</span>
                  <span className="text-sm font-bold text-rose-500 font-mono whitespace-nowrap mt-1">${financialSummary.totalExpenses.toFixed(2)}</span>
                </div>
                <div className="flex-1 min-w-[140px] p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex flex-col justify-between min-h-[64px]">
                  <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider block">Devoluciones (-)</span>
                  <span className="text-sm font-bold text-amber-500 font-mono whitespace-nowrap mt-1">${financialSummary.totalRefunds.toFixed(2)}</span>
                </div>
                <div className="flex-grow flex-shrink basis-[200px] min-w-[160px] p-3 bg-primary/5 border border-primary/10 rounded-xl flex flex-col justify-between min-h-[64px]">
                  <span className="text-[10px] text-primary font-bold uppercase tracking-wider block">Esperado en Caja</span>
                  <span className="text-sm font-bold text-primary font-mono whitespace-nowrap mt-1">${financialSummary.expected.toFixed(2)}</span>
                </div>
              </div>

              {/* Box close balance information if closed */}
              {details.session.status === 'CLOSED' && (
                <div className={`mt-3 p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                  Math.abs(Number(details.session.closingBalance || 0) - financialSummary.expected) < 0.05
                    ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-600'
                    : 'bg-rose-500/5 border-rose-500/10 text-rose-500'
                }`}>
                  <span>Cierre Registrado: ${Number(details.session.closingBalance).toFixed(2)}</span>
                  <span>
                    Diferencia / Arqueo: {
                      (Number(details.session.closingBalance || 0) - financialSummary.expected) >= 0 
                        ? `Sobran $${(Number(details.session.closingBalance || 0) - financialSummary.expected).toFixed(2)}`
                        : `Faltan $${Math.abs(Number(details.session.closingBalance || 0) - financialSummary.expected).toFixed(2)}`
                    }
                  </span>
                </div>
              )}

              {/* Internal Tab Links */}
              <div className="flex gap-2 border-b border-border mt-6 pb-2">
                <button
                  onClick={() => setDetailTab('sales')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    detailTab === 'sales'
                      ? 'bg-primary text-white'
                      : 'text-neutral hover:text-secondary hover:bg-muted/10'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Ventas ({details.sales.length})
                </button>
                <button
                  onClick={() => setDetailTab('expenses')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    detailTab === 'expenses'
                      ? 'bg-primary text-white'
                      : 'text-neutral hover:text-secondary hover:bg-muted/10'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  Gastos / Retiros ({details.expenses.length})
                </button>
                <button
                  onClick={() => setDetailTab('refunds')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    detailTab === 'refunds'
                      ? 'bg-primary text-white'
                      : 'text-neutral hover:text-secondary hover:bg-muted/10'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Devoluciones ({details.refunds.length})
                </button>
              </div>

              {/* Tab Contents */}
              <div className="mt-4 max-h-[30vh] overflow-y-auto">
                {detailTab === 'sales' && (
                  details.sales.length === 0 ? (
                    <div className="text-center py-10 text-neutral text-xs italic">No se registraron ventas en esta sesión.</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="uppercase text-[9px] font-bold">
                          <TableHead className="pr-2">Folio</TableHead>
                          <TableHead className="px-2">Hora</TableHead>
                          <TableHead className="px-2">Cliente</TableHead>
                          <TableHead className="px-2 text-right">Pzas</TableHead>
                          <TableHead className="pl-2 text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {details.sales.map((sale: any) => {
                          const pieces = (sale.items || []).reduce((sum: number, it: any) => sum + Number(it.quantity || 0), 0);
                          return (
                            <TableRow key={sale.id} className="text-xs hover:bg-muted/5">
                              <TableCell className="py-2.5 pr-2 font-mono font-bold text-primary">
                                {sale.invoiceNumber || 'Sin Folio'}
                              </TableCell>
                              <TableCell className="py-2.5 px-2 text-neutral">
                                {new Date(sale.createdAt).toLocaleTimeString('es-EC', { timeZone: timezone, hour: '2-digit', minute: '2-digit' })}
                              </TableCell>
                              <TableCell className="py-2.5 px-2 uppercase font-medium">
                                {sale.customer?.name || 'PUBLICO GENERAL'}
                              </TableCell>
                              <TableCell className="py-2.5 px-2 text-right font-mono">{Math.floor(pieces)}</TableCell>
                              <TableCell className="py-2.5 pl-2 text-right font-mono font-bold text-secondary">
                                ${Number(sale.total || 0).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )
                )}

                {detailTab === 'expenses' && (
                  details.expenses.length === 0 ? (
                    <div className="text-center py-10 text-neutral text-xs italic">No se registraron gastos en esta sesión.</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="uppercase text-[9px] font-bold">
                          <TableHead className="pr-2">Descripción</TableHead>
                          <TableHead className="px-2">Hora</TableHead>
                          <TableHead className="px-2">Categoría</TableHead>
                          <TableHead className="pl-2 text-right">Monto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {details.expenses.map((exp: any) => (
                          <TableRow key={exp.id} className="text-xs hover:bg-muted/5">
                            <TableCell className="py-2.5 pr-2 font-medium uppercase">{exp.description}</TableCell>
                            <TableCell className="py-2.5 px-2 text-neutral">
                              {new Date(exp.createdAt).toLocaleTimeString('es-EC', { timeZone: timezone, hour: '2-digit', minute: '2-digit' })}
                            </TableCell>
                            <TableCell className="py-2.5 px-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral bg-bg-dark border border-border-card px-2 py-0.5 rounded-full">
                                {exp.category}
                              </span>
                            </TableCell>
                            <TableCell className="py-2.5 pl-2 text-right font-mono font-bold text-rose-500">
                              -${Number(exp.amount || 0).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )
                )}

                {detailTab === 'refunds' && (
                  details.refunds.length === 0 ? (
                    <div className="text-center py-10 text-neutral text-xs italic">No se registraron devoluciones en esta sesión.</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="uppercase text-[9px] font-bold">
                          <TableHead className="pr-2">Motivo</TableHead>
                          <TableHead className="px-2">Hora</TableHead>
                          <TableHead className="px-2">Folio Venta</TableHead>
                          <TableHead className="pl-2 text-right">Reembolsado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {details.refunds.map((ref: any) => (
                          <TableRow key={ref.id} className="text-xs hover:bg-muted/5">
                            <TableCell className="py-2.5 pr-2 font-medium text-neutral">{ref.reason}</TableCell>
                            <TableCell className="py-2.5 px-2 text-neutral">
                              {new Date(ref.createdAt).toLocaleTimeString('es-EC', { timeZone: timezone, hour: '2-digit', minute: '2-digit' })}
                            </TableCell>
                            <TableCell className="py-2.5 px-2 font-mono font-bold text-primary">
                              {ref.sale?.invoiceNumber || 'Sin Folio'}
                            </TableCell>
                            <TableCell className="py-2.5 pl-2 text-right font-mono font-bold text-amber-500">
                              -${Number(ref.totalRefunded || 0).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )
                )}
              </div>

              <div className="flex justify-end border-t border-border pt-4 mt-6">
                <Button 
                  onClick={() => setSelectedSessionId(null)}
                  className="text-xs font-semibold h-9 rounded-xl"
                >
                  Cerrar Auditoría
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default CashSessionsHistoryView;
