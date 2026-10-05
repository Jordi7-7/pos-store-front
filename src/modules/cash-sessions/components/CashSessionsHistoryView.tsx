import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  ArrowRight, 
  Loader2,
  Lock,
  Unlock,
  RotateCcw,
  Printer,
} from 'lucide-react';
import { useCashSessionsList } from '../hooks/useCashSessions';
import type { CashSessionHeader } from '../types/cash-sessions.types';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { useBranches } from '../../branches/hooks/useBranches';
import { cashSessionsService } from '../services/cash-sessions.service';
import { ThermalClosingTicketModal } from '../../sales/components/pos/ThermalClosingTicketModal';
import { toast } from 'sonner';
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
import { CashSessionAuditModal } from './CashSessionAuditModal';

export const CashSessionsHistoryView: React.FC = () => {
  const timezone = useAuthStore((state) => state.timezone) || 'America/Guayaquil';
  const selectedBranchId = useAuthStore((state) => state.selectedBranchId);
  const publicTenant = useAuthStore((state) => state.publicTenant);
  const { branches } = useBranches();

  const { sessions, isLoading: listLoading, refetch } = useCashSessionsList(selectedBranchId || undefined);

  // Selected session for detail modal
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Direct print ticket state
  const [sessionClosingDataToPrint, setSessionClosingDataToPrint] = useState<any | null>(null);
  const [isClosingTicketModalOpen, setIsClosingTicketModalOpen] = useState(false);
  const [printingSessionId, setPrintingSessionId] = useState<string | null>(null);

  const handlePrintSessionById = async (sessionId: string) => {
    try {
      setPrintingSessionId(sessionId);
      const details = await cashSessionsService.getCashSessionDetails(sessionId);

      // Aggregate products sold
      const productMap = new Map<string, { sku: string; name: string; quantity: number; subtotal: number; discount: number; total: number }>();
      (details.sales || []).forEach((sale: any) => {
        (sale.items || []).forEach((item: any) => {
          const sku = item.variant?.sku || item.sku || 'N/A';
          const name = item.variant?.product?.name || item.productName || 'Producto';
          const qty = Number(item.quantity || 0);
          const lineGross = item.subtotal !== undefined && Number(item.subtotal) > 0
            ? Number(item.subtotal)
            : Number(item.price || 0) * qty;

          const totalLineDiscount = (item.discountAmount !== undefined && Number(item.discountAmount) > 0
            ? Number(item.discountAmount)
            : 0) + (item.globalDiscountAmount !== undefined && Number(item.globalDiscountAmount) > 0
            ? Number(item.globalDiscountAmount)
            : 0);

          const lineNet = item.total !== undefined && Number(item.total) > 0
            ? Number(item.total)
            : Math.max(0, lineGross - totalLineDiscount);

          const existing = productMap.get(sku);
          if (existing) {
            existing.quantity += qty;
            existing.subtotal += lineGross;
            existing.discount += totalLineDiscount;
            existing.total += lineNet;
          } else {
            productMap.set(sku, {
              sku,
              name,
              quantity: qty,
              subtotal: lineGross,
              discount: totalLineDiscount,
              total: lineNet,
            });
          }
        });
      });
      const productsList = Array.from(productMap.values());

      const paymentsBreakdown: { [method: string]: number } = {
        EFECTIVO: Number(details.kpis?.cashSales || 0),
        TARJETA: Number(details.kpis?.cardSales || 0),
      };

      const salesSubtotal = (details.sales || []).reduce((sum: number, s: any) => {
        const itemGross = (s.items || []).reduce((isum: number, it: any) => isum + Number(it.price || 0) * Number(it.quantity || 0), 0);
        return sum + (s.subtotal !== undefined && s.subtotal > 0 ? Number(s.subtotal) : itemGross);
      }, 0);

      const discountsTotal = (details.sales || []).reduce((sum: number, s: any) => {
        return sum + Number(s.discountAmount || 0);
      }, 0);

      const refundsTotal = Number(details.kpis?.totalRefunds || 0);

      const branchName =
        details.session?.branchName ||
        branches.find((b: any) => b.id === details.session?.branchId)?.name ||
        'Sucursal General';

      const branchAddress =
        branches.find((b: any) => b.id === details.session?.branchId)?.address || '';

      const sessionTicketData = {
        id: details.session.id,
        openedAt: details.session.openedAt,
        closedAt: details.session.closedAt || undefined,
        openingBalance: Number(details.session.openingBalance || 0),
        closingBalance: Number(details.session.closingBalance ?? details.session.expectedBalance ?? 0),
        expectedBalance: Number(details.session.expectedBalance || 0),
        salesTotal: Number(details.kpis?.netSales ?? details.session.totalSales ?? 0),
        salesSubtotal: salesSubtotal > 0 ? salesSubtotal : undefined,
        discountsTotal: discountsTotal > 0 ? discountsTotal : undefined,
        expensesTotal: Number(details.kpis?.totalExpenses || 0),
        refundsTotal: refundsTotal > 0 ? refundsTotal : undefined,
        expensesList: (details.expenses || []).map((e: any) => ({
          description: e.description,
          amount: Number(e.amount),
          createdAt: e.createdAt,
        })),
        productsList,
        paymentsBreakdown,
        refundsList: (details.refunds || []).map((r: any) => ({
          id: r.id,
          reason: r.reason,
          items: (r.items || []).map((it: any) => ({
            name: it.variant?.product?.name || 'Producto',
            sku: it.variant?.sku || 'N/A',
            quantity: Number(it.quantity || 0),
          })),
        })),
        salesList: (details.sales || []).map((s: any) => ({
          invoiceNumber: s.invoiceNumber,
          createdAt: s.createdAt,
          total: Number(s.total),
          paymentMethods: (s.payments || []).map((p: any) => p.paymentMethod || 'EFECTIVO'),
        })),
        userName: details.session.openedBy || 'Usuario',
        branchName,
        branchAddress,
        status: details.session.status as 'OPEN' | 'CLOSED',
      };

      setSessionClosingDataToPrint(sessionTicketData);
      setIsClosingTicketModalOpen(true);
    } catch (err: any) {
      toast.error(err.message || 'Error al obtener detalles para imprimir el ticket');
    } finally {
      setPrintingSessionId(null);
    }
  };

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

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
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handlePrintSessionById(s.id)}
                            disabled={printingSessionId === s.id}
                            className="p-1.5 rounded-xl border border-primary/20 bg-primary/10 hover:bg-primary/20 text-primary transition-all cursor-pointer shadow-xs disabled:opacity-50"
                            title="Imprimir ticket de sesión / arqueo"
                          >
                            {printingSessionId === s.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Printer className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedSessionId(s.id)}
                            className="flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary-hover bg-primary/5 hover:bg-primary/10 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs border border-primary/10"
                          >
                            Auditar Caja
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Details Dialog Reusable Component */}
      <CashSessionAuditModal
        sessionId={selectedSessionId}
        isOpen={!!selectedSessionId}
        onClose={() => setSelectedSessionId(null)}
      />

      {/* Modal de Impresión Directa de Ticket de Arqueo y Cierre */}
      {isClosingTicketModalOpen && (
        <ThermalClosingTicketModal
          isOpen={isClosingTicketModalOpen}
          onClose={() => {
            setIsClosingTicketModalOpen(false);
            setSessionClosingDataToPrint(null);
          }}
          sessionData={sessionClosingDataToPrint}
          tenantRuc={publicTenant?.ruc || ''}
          tenantName={publicTenant?.name || ''}
        />
      )}
    </div>
  );
};
export default CashSessionsHistoryView;
