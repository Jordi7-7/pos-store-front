import React, { useState } from 'react';
import {
  History,
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
  DollarSign,
  Printer,
} from 'lucide-react';
import { useCashSessionDetailsQuery } from '../hooks/useCashSessions';
import type { SessionSale } from '../types/cash-sessions.types';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { useBranches } from '../../branches/hooks/useBranches';
import { ThermalTicketModal } from '../../sales/components/pos/ThermalTicketModal';
import { ThermalClosingTicketModal } from '../../sales/components/pos/ThermalClosingTicketModal';
import { PaymentMethod } from '../../sales/services/sales.service';

interface CashSessionAuditModalProps {
  sessionId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CashSessionAuditModal: React.FC<CashSessionAuditModalProps> = ({
  sessionId,
  isOpen,
  onClose,
}) => {
  const timezone = useAuthStore((state) => state.timezone) || 'America/Guayaquil';
  const publicTenant = useAuthStore((state) => state.publicTenant);
  const { branches } = useBranches();

  const { details, isLoading } = useCashSessionDetailsQuery(sessionId);

  // Tab state: sales | expenses | refunds
  const [activeTab, setActiveTab] = useState<'sales' | 'expenses' | 'refunds'>('sales');

  // Ticket reprint state
  const [reprintSaleData, setReprintSaleData] = useState<any | null>(null);
  const [isReprintModalOpen, setIsReprintModalOpen] = useState(false);

  // Session Closing Ticket print state
  const [sessionClosingDataToPrint, setSessionClosingDataToPrint] = useState<any | null>(null);
  const [isClosingTicketModalOpen, setIsClosingTicketModalOpen] = useState(false);

  const handlePrintSessionTicket = () => {
    if (!details) return;

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

    // Aggregate payments breakdown
    const paymentsBreakdown: { [method: string]: number } = {
      EFECTIVO: Number(details.kpis?.cashSales || 0),
      TARJETA: Number(details.kpis?.cardSales || 0),
    };

    // Calculate subtotal and discounts
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
  };

  const handlePrintSale = (sale: SessionSale) => {
    const branchName =
      details?.session?.branchName ||
      branches.find((b: any) => b.id === details?.session?.branchId)?.name ||
      'Sucursal General';

    const branchAddress =
      branches.find((b: any) => b.id === details?.session?.branchId)?.address || '';

    const clientName = sale.customer?.name || (sale as any).customerName || 'Consumidor Final';
    const clientIdentity = sale.customer?.identityNumber || '9999999999';

    setReprintSaleData({
      invoiceNumber: sale.invoiceNumber,
      createdAt: sale.createdAt,
      branchName,
      branchAddress,
      clientName,
      clientIdentity,
      items: (sale.items || []).map((item: any) => ({
        variantId: item.variantId,
        variantSku: item.variant?.sku || item.sku || item.variantSku || '',
        productName: item.variant?.product?.name || item.productName || item.variantName || 'Producto',
        combinationText:
          item.variant?.attributeValues?.map((av: any) => av.value).join(' / ') ||
          item.attributes ||
          'Estándar',
        quantity: Number(item.quantity),
        price: Number(item.price),
        discountAmount: Number(item.discountAmount || 0),
      })),
      paymentMethod:
        (sale.payments?.[0]?.paymentMethod ||
          sale.paymentMethod ||
          PaymentMethod.EFECTIVO) as any,
      subtotal: Number(sale.subtotal || 0),
      itemsDiscountAmount: Number(sale.itemsDiscountAmount || 0),
      globalDiscountAmount: Number(sale.globalDiscountAmount || 0),
      discountAmount: Number(sale.discountAmount || 0),
      total: Number(sale.total || 0),
      userName: sale.userName || sale.user?.name || 'Vendedor',
    });
    setIsReprintModalOpen(true);
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-5xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl bg-card border border-border rounded-3xl shadow-2xl p-6 sm:p-8 text-foreground max-h-[92vh] overflow-y-auto">
          {isLoading || !details ? (
            <div className="flex flex-col items-center justify-center py-28 space-y-3">
              <Loader2 className="w-9 h-9 text-primary animate-spin" />
              <p className="text-xs text-neutral font-medium">
                Cargando desglose financiero de la sesión...
              </p>
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
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            details.session.status === 'CLOSED'
                              ? 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          }`}
                        >
                          {details.session.status === 'CLOSED' ? (
                            <Lock className="w-3 h-3" />
                          ) : (
                            <Unlock className="w-3 h-3 animate-pulse" />
                          )}
                          {details.session.status === 'CLOSED' ? 'Cerrada' : 'En Curso'}
                        </span>
                      </div>
                      <p className="text-xs text-neutral mt-0.5">
                        Supervisión integral de movimientos, arqueo en efectivo y balance de caja.
                      </p>
                    </div>
                  </div>

                  {/* Badges de Caja y Sucursal + Botón Imprimir Ticket de Sesión */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      type="button"
                      onClick={handlePrintSessionTicket}
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 rounded-xl border-primary/20 bg-primary/10 hover:bg-primary/20 text-xs font-bold text-primary shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
                      title="Imprimir ticket de arqueo y cierre de sesión"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Imprimir Ticket de Sesión</span>
                    </Button>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-xl bg-bg-dark border border-border-card text-secondary">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      {details.session.cashRegister?.name || 'Caja Registradora'} (#
                      {details.session.cashRegister?.code || '1'})
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
                      <span className="text-[10px] uppercase font-bold text-neutral block leading-none">
                        Abierta por
                      </span>
                      <span className="font-semibold text-secondary truncate block mt-0.5">
                        {details.session.openedBy || 'No registrado'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-neutral shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral block leading-none">
                        Tiempo Abierta
                      </span>
                      <span className="font-semibold text-primary font-mono block mt-0.5">
                        {details.session.durationFormatted || '0m'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-neutral shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral block leading-none">
                        Hora Apertura
                      </span>
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
                      <span className="text-[10px] uppercase font-bold text-neutral block leading-none">
                        Hora Cierre
                      </span>
                      <span className="font-semibold text-secondary font-mono block mt-0.5">
                        {details.session.closedAt ? (
                          new Date(details.session.closedAt).toLocaleTimeString('es-EC', {
                            timeZone: timezone,
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        ) : (
                          <span className="text-emerald-600 font-sans font-bold">
                            Sesión activa
                          </span>
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
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Ventas Netas
                    </span>
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
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Gastos / Retiros
                    </span>
                    <TrendingDown className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-base sm:text-lg font-black font-mono text-rose-500">
                      -${Number(details.kpis.totalExpenses || 0).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-rose-500/80 block mt-0.5">
                      {details.kpis.expensesCount}{' '}
                      {details.kpis.expensesCount === 1 ? 'salida' : 'salidas'}
                    </span>
                  </div>
                </div>

                {/* 4. Devoluciones */}
                <div className="p-3.5 bg-amber-500/5 border border-amber-500/15 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-amber-600 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Devoluciones
                    </span>
                    <RotateCcw className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-base sm:text-lg font-black font-mono text-amber-600">
                      -${Number(details.kpis.totalRefunds || 0).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-amber-600/80 block mt-0.5">
                      {details.kpis.refundsCount}{' '}
                      {details.kpis.refundsCount === 1 ? 'reembolso' : 'reembolsos'}
                    </span>
                  </div>
                </div>

                {/* 5. Esperado en Caja */}
                <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-primary mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Efectivo Esperado
                    </span>
                    <Receipt className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-base sm:text-lg font-black font-mono text-primary">
                      ${Number(details.session.expectedBalance || 0).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-primary/80 block mt-0.5">
                      Físico en gaveta
                    </span>
                  </div>
                </div>

                {/* 6. Arqueo y Diferencia */}
                <div className="p-3.5 bg-bg-dark border border-border-card rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-neutral mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Arqueo Cierre
                    </span>
                    <DollarSign className="w-3.5 h-3.5 text-neutral" />
                  </div>
                  <div>
                    {details.session.status === 'CLOSED' ? (
                      <>
                        <span className="text-base sm:text-lg font-black font-mono text-secondary">
                          ${Number(details.session.closingBalance || 0).toFixed(2)}
                        </span>
                        {(() => {
                          const diff =
                            details.session.difference !== null
                              ? Number(details.session.difference)
                              : 0;
                          const isExact = Math.abs(diff) < 0.05;
                          if (isExact) {
                            return (
                              <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">
                                Exacto (Sin diff)
                              </span>
                            );
                          }
                          if (diff > 0) {
                            return (
                              <span className="text-[10px] font-bold text-blue-500 block mt-0.5">
                                Sobran +${diff.toFixed(2)}
                              </span>
                            );
                          }
                          return (
                            <span className="text-[10px] font-bold text-rose-500 block mt-0.5">
                              Faltan -${Math.abs(diff).toFixed(2)}
                            </span>
                          );
                        })()}
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-bold text-neutral">Pendiente</span>
                        <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">
                          En progreso
                        </span>
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

                {/* Tablas de contenido */}
                <div className="mt-4 min-h-[220px] max-h-[38vh] overflow-y-auto rounded-xl border border-border/60">
                  {activeTab === 'sales' &&
                    (details.sales.length === 0 ? (
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
                            <TableHead className="py-3 px-4 text-center w-16">Acción</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {details.sales.map((sale: any) => (
                            <TableRow
                              key={sale.id}
                              className="text-xs hover:bg-muted/10 transition-colors"
                            >
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
                                <span
                                  className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    sale.status === 'COMPLETED'
                                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                      : sale.status === 'PARTIALLY_REFUNDED'
                                      ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                      : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                  }`}
                                >
                                  {sale.status === 'COMPLETED'
                                    ? 'Completada'
                                    : sale.status === 'PARTIALLY_REFUNDED'
                                    ? 'Dev. Parcial'
                                    : 'Reembolsada'}
                                </span>
                              </TableCell>
                              <TableCell className="py-3 px-4 text-right font-mono font-bold text-sm text-secondary">
                                ${Number(sale.total || 0).toFixed(2)}
                              </TableCell>
                              <TableCell className="py-3 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => handlePrintSale(sale)}
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
                          {details.expenses.map((exp: any) => (
                            <TableRow
                              key={exp.id}
                              className="text-xs hover:bg-muted/10 transition-colors"
                            >
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
                                  {exp.userName || 'Cajero'}
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
                          {details.refunds.map((ref: any) => (
                            <TableRow
                              key={ref.id}
                              className="text-xs hover:bg-muted/10 transition-colors"
                            >
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
                                  {ref.userName || 'Cajero'}
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
                    ))}
                </div>
              </div>

              {/* Botón de cierre */}
              <div className="flex justify-end pt-3">
                <Button
                  onClick={onClose}
                  className="text-xs font-semibold h-9 px-5 rounded-xl cursor-pointer shadow-xs"
                >
                  Cerrar Auditoría
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Reimpresión de Ticket Térmico */}
      {isReprintModalOpen && (
        <ThermalTicketModal
          isOpen={isReprintModalOpen}
          onClose={() => {
            setIsReprintModalOpen(false);
            setReprintSaleData(null);
          }}
          saleData={reprintSaleData}
          tenantRuc={publicTenant?.ruc || ''}
          tenantName={publicTenant?.name || ''}
          currencyCode={publicTenant?.currencyCode || 'USD'}
        />
      )}

      {/* Modal de Impresión de Ticket de Arqueo y Cierre de Sesión */}
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
    </>
  );
};
export default CashSessionAuditModal;
