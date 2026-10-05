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
  Unlock,
  User,
  Clock,
  Calendar,
  Coins,
  Receipt,
  DollarSign
} from 'lucide-react';
import { useCashSessionsList, useCashSessionDetailsQuery } from '../hooks/useCashSessions';
import type { CashSessionHeader } from '../types/cash-sessions.types';
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
  const filteredSessions = useMemo<CashSessionHeader[]>(() => {
    return sessions.filter((s: CashSessionHeader) => {
      const regName = s.cashRegister?.name || '';
      const regCode = String(s.cashRegister?.code || '');
      return (
        regName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        regCode.includes(searchTerm)
      );
    });
  }, [sessions, searchTerm]);

  // Formatter helpers
  const formatSessionTime = (openedStr: string, closedStr: string | null) => {
    const opened = new Date(openedStr);
    const dateFormatted = opened.toLocaleDateString('es-EC', {
      timeZone: timezone,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const openTime = opened.toLocaleTimeString('es-EC', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
    });

    if (!closedStr) {
      return (
        <div>
          <span className="font-semibold text-secondary block">{dateFormatted}</span>
          <span className="text-[11px] text-emerald-600 font-medium">Desde {openTime} (En curso)</span>
        </div>
      );
    }

    const closed = new Date(closedStr);
    const closeTime = closed.toLocaleTimeString('es-EC', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <div>
        <span className="font-semibold text-secondary block">{dateFormatted}</span>
        <span className="text-[11px] text-neutral font-medium">{openTime} — {closeTime}</span>
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Compact Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-bg-card border border-border-card p-4 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-base font-bold text-secondary flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            Historial de Sesiones de Caja
          </h2>
          <p className="text-[11px] text-neutral">Auditoría de aperturas, ventas facturadas y arqueos de cierre por caja.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Compact Search */}
          <div className="flex items-center gap-2 bg-bg-dark border border-border-card rounded-xl px-2.5 py-1.5 shadow-xs w-48 sm:w-60">
            <Search className="w-3.5 h-3.5 text-neutral shrink-0" />
            <input 
              type="text" 
              placeholder="Buscar por caja..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-xs text-secondary focus:outline-none w-full placeholder-neutral font-medium"
            />
          </div>

          {/* Compact Refresh Button */}
          <Button 
            onClick={() => refetch()} 
            variant="outline"
            size="sm"
            className="h-8 px-2.5 rounded-xl border-border-card bg-bg-card hover:bg-bg-dark text-xs font-medium text-secondary shadow-xs cursor-pointer flex items-center gap-1.5"
            title="Sincronizar sesiones"
          >
            <RotateCcw className="w-3.5 h-3.5 text-neutral" />
            <span className="hidden sm:inline">Sincronizar</span>
          </Button>
        </div>
      </div>

      {/* Main Sessions Table */}
      <Card className="border border-border-card bg-bg-card rounded-2xl shadow-sm p-4 overflow-hidden">
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
                <TableRow className="uppercase tracking-wider text-[10px] font-bold border-b border-border-card/60">
                  <TableHead className="pr-3">Caja Registradora</TableHead>
                  <TableHead className="px-3">Horario de Sesión</TableHead>
                  <TableHead className="px-3 text-right">Ventas Totales</TableHead>
                  <TableHead className="px-3 text-right">Diferencia / Arqueo</TableHead>
                  <TableHead className="px-3 text-center">Estado</TableHead>
                  <TableHead className="pl-3 text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((s: CashSessionHeader) => {
                  const hasDiff = s.difference !== null && s.difference !== undefined;
                  const diffVal = hasDiff ? Number(s.difference) : 0;
                  const isExact = hasDiff && Math.abs(diffVal) < 0.05;

                  return (
                    <TableRow key={s.id} className="text-secondary hover:bg-muted/10 transition-colors">
                      {/* Caja Registradora */}
                      <TableCell className="py-3 pr-3 font-semibold text-secondary">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-black shrink-0">
                            #{s.cashRegister?.code || '1'}
                          </div>
                          <div>
                            <p className="text-xs font-bold leading-tight text-secondary">
                              {s.cashRegister?.name || 'Caja Registradora'}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Horario de Sesión */}
                      <TableCell className="py-3 px-3 text-xs whitespace-nowrap">
                        {formatSessionTime(s.openedAt, s.closedAt)}
                      </TableCell>

                      {/* Ventas Totales */}
                      <TableCell className="py-3 px-3 text-right font-mono font-black text-sm text-secondary">
                        ${Number(s.totalSales || 0).toFixed(2)}
                      </TableCell>

                      {/* Diferencia / Arqueo */}
                      <TableCell className="py-3 px-3 text-right font-mono">
                        {s.status === 'OPEN' ? (
                          <span className="text-neutral text-xs italic">En turno</span>
                        ) : isExact ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            Exacto ($0.00)
                          </span>
                        ) : diffVal > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                            +${diffVal.toFixed(2)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                            -${Math.abs(diffVal).toFixed(2)}
                          </span>
                        )}
                      </TableCell>

                      {/* Estado */}
                      <TableCell className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          s.status === 'CLOSED' 
                            ? 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20' 
                            : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        }`}>
                          {s.status === 'CLOSED' ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5 animate-pulse" />}
                          {s.status === 'CLOSED' ? 'Cerrada' : 'Abierta'}
                        </span>
                      </TableCell>

                      {/* Acción */}
                      <TableCell className="py-3 pl-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedSessionId(s.id)}
                          className="flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary-hover bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs ml-auto border border-primary/10"
                        >
                          Auditar Caja
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedSessionId} onOpenChange={(open) => { if (!open) setSelectedSessionId(null); }}>
        <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-5xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl bg-card border border-border rounded-3xl shadow-2xl p-6 sm:p-8 text-foreground max-h-[92vh] overflow-y-auto">
          {detailLoading || !details ? (
            <div className="flex flex-col items-center justify-center py-28 space-y-3">
              <Loader2 className="w-9 h-9 text-primary animate-spin" />
              <p className="text-xs text-neutral font-medium">Cargando desglose financiero de la sesión...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header con información completa de la sesión */}
              <div className="border-b border-border/80 pb-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-xs">
                      <History className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg sm:text-xl font-black text-secondary tracking-tight">
                          Arqueo y Auditoría de Caja
                        </h2>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          details.session.status === 'CLOSED'
                            ? 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        }`}>
                          {details.session.status === 'CLOSED' ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3 animate-pulse" />}
                          {details.session.status === 'CLOSED' ? 'Cerrada' : 'En Curso'}
                        </span>
                      </div>
                      <p className="text-xs text-neutral mt-0.5">
                        Supervisión integral de movimientos, arqueo en efectivo y balance de caja.
                      </p>
                    </div>
                  </div>

                  {/* Badges de Caja y Sucursal */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-xl bg-bg-dark border border-border-card text-secondary">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      {details.session.cashRegister?.name || 'Caja Registradora'} (#{details.session.cashRegister?.code || '1'})
                    </span>
                    {details.session.branchName && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-xl bg-bg-dark border border-border-card text-neutral">
                        {details.session.branchName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Meta details bar: Cajero, Duración, Apertura y Cierre */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border/50 text-xs">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-neutral shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] uppercase font-bold text-neutral block leading-none">Abierta por</span>
                      <span className="font-semibold text-secondary truncate block mt-0.5">
                        {details.session.openedBy || 'No registrado'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-neutral shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral block leading-none">Tiempo Abierta</span>
                      <span className="font-semibold text-primary font-mono block mt-0.5">
                        {details.session.durationFormatted || '0m'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-neutral shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral block leading-none">Hora Apertura</span>
                      <span className="font-semibold text-secondary font-mono block mt-0.5">
                        {new Date(details.session.openedAt).toLocaleTimeString('es-EC', {
                          timeZone: timezone,
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-neutral shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral block leading-none">Hora Cierre</span>
                      <span className="font-semibold text-secondary font-mono block mt-0.5">
                        {details.session.closedAt ? (
                          new Date(details.session.closedAt).toLocaleTimeString('es-EC', {
                            timeZone: timezone,
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        ) : (
                          <span className="text-emerald-600 font-sans font-bold">Sesión activa</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid principal de KPIs de sesión */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* 1. Fondo de Apertura */}
                <div className="p-3.5 bg-bg-dark border border-border-card rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-neutral mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Apertura</span>
                    <Coins className="w-3.5 h-3.5 text-neutral" />
                  </div>
                  <div>
                    <span className="text-base sm:text-lg font-black font-mono text-secondary">
                      ${Number(details.session.openingBalance || 0).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-neutral block mt-0.5">Base en caja</span>
                  </div>
                </div>

                {/* 2. Ventas Netas */}
                <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-emerald-600 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Ventas Netas</span>
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-base sm:text-lg font-black font-mono text-emerald-600">
                      ${Number(details.kpis.netSales || 0).toFixed(2)}
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono font-medium text-emerald-700/80 mt-0.5">
                      <span>Ef: ${Number(details.kpis.cashSales || 0).toFixed(2)}</span>
                      <span>•</span>
                      <span>Tarj: ${Number(details.kpis.cardSales || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Gastos / Salidas */}
                <div className="p-3.5 bg-rose-500/5 border border-rose-500/15 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-rose-500 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Gastos / Retiros</span>
                    <TrendingDown className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-base sm:text-lg font-black font-mono text-rose-500">
                      -${Number(details.kpis.totalExpenses || 0).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-rose-500/80 block mt-0.5">
                      {details.kpis.expensesCount} {details.kpis.expensesCount === 1 ? 'salida' : 'salidas'}
                    </span>
                  </div>
                </div>

                {/* 4. Devoluciones */}
                <div className="p-3.5 bg-amber-500/5 border border-amber-500/15 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-amber-600 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Devoluciones</span>
                    <RotateCcw className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-base sm:text-lg font-black font-mono text-amber-600">
                      -${Number(details.kpis.totalRefunds || 0).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-amber-600/80 block mt-0.5">
                      {details.kpis.refundsCount} {details.kpis.refundsCount === 1 ? 'reembolso' : 'reembolsos'}
                    </span>
                  </div>
                </div>

                {/* 5. Esperado en Caja */}
                <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-primary mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Efectivo Esperado</span>
                    <Receipt className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-base sm:text-lg font-black font-mono text-primary">
                      ${Number(details.session.expectedBalance || 0).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-primary/80 block mt-0.5">Físico en gaveta</span>
                  </div>
                </div>

                {/* 6. Arqueo y Diferencia */}
                <div className="p-3.5 bg-bg-dark border border-border-card rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-neutral mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Arqueo Cierre</span>
                    <DollarSign className="w-3.5 h-3.5 text-neutral" />
                  </div>
                  <div>
                    {details.session.status === 'CLOSED' ? (
                      <>
                        <span className="text-base sm:text-lg font-black font-mono text-secondary">
                          ${Number(details.session.closingBalance || 0).toFixed(2)}
                        </span>
                        {(() => {
                          const diff = details.session.difference !== null ? Number(details.session.difference) : 0;
                          const isExact = Math.abs(diff) < 0.05;
                          if (isExact) {
                            return <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">Exacto (Sin diff)</span>;
                          }
                          if (diff > 0) {
                            return <span className="text-[10px] font-bold text-blue-500 block mt-0.5">Sobran +${diff.toFixed(2)}</span>;
                          }
                          return <span className="text-[10px] font-bold text-rose-500 block mt-0.5">Faltan -${Math.abs(diff).toFixed(2)}</span>;
                        })()}
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-bold text-neutral">Pendiente</span>
                        <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">En progreso</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Barra de pestañas de detalles */}
              <div>
                <div className="flex gap-2 border-b border-border/80 pb-2">
                  <button
                    type="button"
                    onClick={() => setDetailTab('sales')}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                      detailTab === 'sales'
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-neutral hover:text-secondary hover:bg-muted/10'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Ventas ({details.sales.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab('expenses')}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                      detailTab === 'expenses'
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-neutral hover:text-secondary hover:bg-muted/10'
                    }`}
                  >
                    <TrendingDown className="w-4 h-4" />
                    Gastos / Retiros ({details.expenses.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab('refunds')}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                      detailTab === 'refunds'
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-neutral hover:text-secondary hover:bg-muted/10'
                    }`}
                  >
                    <RotateCcw className="w-4 h-4" />
                    Devoluciones ({details.refunds.length})
                  </button>
                </div>

                {/* Tablas de contenido */}
                <div className="mt-4 min-h-[220px] max-h-[38vh] overflow-y-auto rounded-xl border border-border/60">
                  {detailTab === 'sales' && (
                    details.sales.length === 0 ? (
                      <div className="text-center py-16 text-neutral text-xs italic">
                        No se registraron ventas en esta sesión de caja.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow className="uppercase text-[10px] font-bold bg-muted/20">
                            <TableHead className="py-3 px-4">Folio Venta</TableHead>
                            <TableHead className="py-3 px-4">Hora</TableHead>
                            <TableHead className="py-3 px-4">Atendido por</TableHead>
                            <TableHead className="py-3 px-4">Cliente</TableHead>
                            <TableHead className="py-3 px-4 text-center">Piezas</TableHead>
                            <TableHead className="py-3 px-4 text-center">Estado</TableHead>
                            <TableHead className="py-3 px-4 text-right">Total Facturado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {details.sales.map((sale: any) => (
                            <TableRow key={sale.id} className="text-xs hover:bg-muted/10 transition-colors">
                              <TableCell className="py-3 px-4 font-mono font-bold text-primary">
                                {sale.invoiceNumber || 'Sin Folio'}
                              </TableCell>
                              <TableCell className="py-3 px-4 text-neutral font-medium">
                                {new Date(sale.createdAt).toLocaleTimeString('es-EC', {
                                  timeZone: timezone,
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </TableCell>
                              <TableCell className="py-3 px-4 font-medium text-secondary">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-bg-dark border border-border-card text-[11px]">
                                  <User className="w-3 h-3 text-neutral" />
                                  {sale.userName || sale.user?.name || 'Cajero'}
                                </span>
                              </TableCell>
                              <TableCell className="py-3 px-4 font-semibold text-secondary uppercase">
                                {sale.customerName || sale.customer?.name || 'CONSUMIDOR FINAL'}
                              </TableCell>
                              <TableCell className="py-3 px-4 text-center font-mono font-medium">
                                {sale.totalItems || 1}
                              </TableCell>
                              <TableCell className="py-3 px-4 text-center">
                                <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  sale.status === 'COMPLETED'
                                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                    : sale.status === 'PARTIALLY_REFUNDED'
                                    ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                    : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                }`}>
                                  {sale.status === 'COMPLETED' ? 'Completada' : sale.status === 'PARTIALLY_REFUNDED' ? 'Dev. Parcial' : 'Reembolsada'}
                                </span>
                              </TableCell>
                              <TableCell className="py-3 px-4 text-right font-mono font-bold text-sm text-secondary">
                                ${Number(sale.total || 0).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )
                  )}

                  {detailTab === 'expenses' && (
                    details.expenses.length === 0 ? (
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
                          {details.expenses.map((exp: any) => (
                            <TableRow key={exp.id} className="text-xs hover:bg-muted/10 transition-colors">
                              <TableCell className="py-3 px-4 font-semibold text-secondary uppercase">
                                {exp.description}
                              </TableCell>
                              <TableCell className="py-3 px-4 text-neutral font-medium">
                                {new Date(exp.createdAt).toLocaleTimeString('es-EC', {
                                  timeZone: timezone,
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </TableCell>
                              <TableCell className="py-3 px-4 font-medium text-secondary">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-bg-dark border border-border-card text-[11px]">
                                  <User className="w-3 h-3 text-neutral" />
                                  {exp.userName || details.session.openedBy || 'Cajero'}
                                </span>
                              </TableCell>
                              <TableCell className="py-3 px-4">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral bg-bg-dark border border-border-card px-2.5 py-1 rounded-lg">
                                  {exp.category || 'General'}
                                </span>
                              </TableCell>
                              <TableCell className="py-3 px-4 text-right font-mono font-bold text-sm text-rose-500">
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
                            <TableHead className="py-3 px-4 text-right">Monto Reembolsado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {details.refunds.map((ref: any) => (
                            <TableRow key={ref.id} className="text-xs hover:bg-muted/10 transition-colors">
                              <TableCell className="py-3 px-4 font-medium text-secondary">
                                {ref.reason || 'Sin motivo especificado'}
                              </TableCell>
                              <TableCell className="py-3 px-4 text-neutral font-medium">
                                {new Date(ref.createdAt).toLocaleTimeString('es-EC', {
                                  timeZone: timezone,
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </TableCell>
                              <TableCell className="py-3 px-4 font-medium text-secondary">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-bg-dark border border-border-card text-[11px]">
                                  <User className="w-3 h-3 text-neutral" />
                                  {ref.userName || ref.user?.name || details.session.openedBy || 'Cajero'}
                                </span>
                              </TableCell>
                              <TableCell className="py-3 px-4 font-mono font-bold text-primary">
                                {ref.sale?.invoiceNumber || 'Sin Folio'}
                              </TableCell>
                              <TableCell className="py-3 px-4 text-right font-mono font-bold text-sm text-amber-600">
                                -${Number(ref.totalRefunded || 0).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )
                  )}
                </div>
              </div>

              {/* Botón de cierre */}
              <div className="flex justify-end pt-3">
                <Button 
                  onClick={() => setSelectedSessionId(null)}
                  className="text-xs font-semibold h-9 px-5 rounded-xl cursor-pointer shadow-xs"
                >
                  Cerrar Auditoría
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default CashSessionsHistoryView;
