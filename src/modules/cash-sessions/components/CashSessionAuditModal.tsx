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
  Info,
  HelpCircle,
} from 'lucide-react';
import { useCashSessionDetailsQuery } from '../hooks/useCashSessions';
import type {
  CashSessionSaleEntity,
  CashSessionExpenseEntity,
  CashSessionRefundEntity,
} from '../entities';
import { SaleStatus } from '@/modules/sales/enums';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
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
import { ThermalTicketModal } from '../../sales/components/pos/ThermalTicketModal';
import { ThermalClosingTicketModal } from '../../sales/components/pos/ThermalClosingTicketModal';
import { buildClosingTicketData } from '../utils/buildClosingTicketData';

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
  const publicTenant = useAuthStore((state) => state.publicTenant);

  const { details, rawDetails, isLoading } = useCashSessionDetailsQuery(sessionId);

  // Tab state: sales | expenses | refunds
  const [activeTab, setActiveTab] = useState<'sales' | 'expenses' | 'refunds'>('sales');

  // Ticket reprint state
  const [reprintSaleData, setReprintSaleData] = useState<any | null>(null);
  const [isReprintModalOpen, setIsReprintModalOpen] = useState(false);

  // Session Closing Ticket print state
  const [sessionClosingDataToPrint, setSessionClosingDataToPrint] = useState<any | null>(null);
  const [isClosingTicketModalOpen, setIsClosingTicketModalOpen] = useState(false);

  // Guide state: show/hide calculations breakdown
  const [showFormulasGuide, setShowFormulasGuide] = useState(false);

  const handlePrintSessionTicket = () => {
    if (!rawDetails) return;

    const sessionTicketData = buildClosingTicketData(rawDetails);

    setSessionClosingDataToPrint(sessionTicketData);
    setIsClosingTicketModalOpen(true);
  };

  const handlePrintSale = (sale: CashSessionSaleEntity) => {
    if (!details) return;

    setReprintSaleData({
      invoiceNumber: sale.invoiceNumber,
      createdAt: sale.createdAtFormatted,
      branchName: details.session.branchName,
      branchAddress: details.session.branchAddress,
      clientName: sale.customerName,
      clientIdentity: sale.customerIdentity,
      items: sale.items.map((item) => ({
        variantId: item.variantId,
        variantSku: item.sku,
        productName: item.productName,
        combinationText: item.combinationText,
        quantity: item.quantity,
        price: item.price,
        discountAmount: item.discountAmount,
      })),
      paymentMethod: sale.paymentMethod,
      subtotal: sale.subtotal,
      itemsDiscountAmount: sale.itemsDiscountAmount,
      globalDiscountAmount: sale.globalDiscountAmount,
      discountAmount: sale.discountAmount,
      total: sale.total,
      userName: sale.userName,
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
                            details.session.isClosed
                              ? 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          }`}
                        >
                          {details.session.isClosed ? (
                            <Lock className="w-3 h-3" />
                          ) : (
                            <Unlock className="w-3 h-3 animate-pulse" />
                          )}
                          {details.session.isClosed ? 'Cerrada' : 'En Curso'}
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
                      onClick={() => setShowFormulasGuide((prev) => !prev)}
                      variant="outline"
                      size="sm"
                      className={`h-8 px-3 rounded-xl border text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition-all ${
                        showFormulasGuide
                          ? 'border-primary/40 bg-primary/20 text-primary'
                          : 'border-border-card bg-bg-dark text-secondary hover:border-primary/40'
                      }`}
                      title="Explicación detallada de cómo se calcula cada valor de esta sesión"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-primary" />
                      <span>{showFormulasGuide ? 'Ocultar Fórmulas' : '¿Cómo se calculan?'}</span>
                    </Button>

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
                      {details.session.cashRegisterName} (#{details.session.cashRegisterCode})
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
                        {details.session.openedByName}
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
                        {details.session.durationFormatted}
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
                        {details.session.openedAtFormatted}
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
                        {details.session.isClosed ? (
                          details.session.closedAtFormatted
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

              {/* Guía interactiva desplegable de fórmulas y cuadre */}
              {showFormulasGuide && (
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-xs space-y-3 animate-in fade-in-50 duration-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-primary">
                      <Info className="w-4 h-4 shrink-0" />
                      <span>Guía Contable: ¿Cómo se calculan los valores en esta sesión?</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowFormulasGuide(false)}
                      className="text-[11px] text-neutral hover:text-primary cursor-pointer font-semibold"
                    >
                      Cerrar guía
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {/* Fórmula 1: Efectivo Físico en Gaveta */}
                    <div className="p-3.5 rounded-xl bg-card border border-border-card space-y-2">
                      <div className="flex items-center justify-between font-bold text-secondary text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <Coins className="w-3.5 h-3.5 text-primary" />
                          1. Arqueo de Efectivo en Gaveta (Físico)
                        </span>
                        <span className="font-mono text-primary font-black">
                          {details.session.expectedBalanceFormatted}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono bg-bg-dark/70 p-2.5 rounded-lg border border-border-card text-neutral leading-relaxed">
                        <div className="text-secondary font-bold mb-1">Cálculo matemático:</div>
                        <div>(+) Fondo Inicial: <span className="text-secondary font-bold">{details.session.openingBalanceFormatted}</span></div>
                        <div>(+) Cobros Efectivo: <span className="text-emerald-600 font-bold">{details.kpis.cashSalesFormatted}</span></div>
                        <div>(-) Gastos en Caja: <span className="text-rose-500 font-bold">{details.kpis.totalExpensesFormatted}</span></div>
                        <div>(-) Devoluciones Efec: <span className="text-amber-600 font-bold">{details.kpis.totalRefundsFormatted}</span></div>
                        <div className="border-t border-border-card/60 pt-1 mt-1 font-bold text-primary flex justify-between">
                          <span>(=) Efectivo Esperado:</span>
                          <span>{details.session.expectedBalanceFormatted}</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-neutral leading-tight">
                        * Solo cuenta el flujo que entra y sale de la gaveta física. Las ventas con tarjeta no se suman al cajón porque se depositan directamente en la cuenta bancaria.
                      </p>
                    </div>

                    {/* Fórmula 2: Ventas Netas Comerciales */}
                    <div className="p-3.5 rounded-xl bg-card border border-border-card space-y-2">
                      <div className="flex items-center justify-between font-bold text-secondary text-[11px]">
                        <span className="flex items-center gap-1.5">
                          <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                          2. Ventas Netas del Negocio (Comercial)
                        </span>
                        <span className="font-mono text-emerald-600 font-black">
                          {details.kpis.netSalesFormatted}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono bg-bg-dark/70 p-2.5 rounded-lg border border-border-card text-neutral leading-relaxed">
                        <div className="text-secondary font-bold mb-1">Cálculo comercial:</div>
                        <div>(+) Ventas Efectivo: <span className="text-emerald-600 font-bold">{details.kpis.cashSalesFormatted}</span></div>
                        <div>(+) Ventas Tarjeta: <span className="text-secondary font-bold">{details.kpis.cardSalesFormatted}</span></div>
                        <div>(-) Devoluciones Totales: <span className="text-amber-600 font-bold">{details.kpis.totalRefundsFormatted}</span></div>
                        <div className="border-t border-border-card/60 pt-1 mt-1 font-bold text-emerald-600 flex justify-between">
                          <span>(=) Total Ventas Netas:</span>
                          <span>{details.kpis.netSalesFormatted}</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-neutral leading-tight">
                        * Facturación neta comercial que generó la tienda en este turno sumando todos los métodos de pago (Efectivo + Tarjeta) menos devoluciones.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Grid principal de KPIs de sesión */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* 1. Fondo de Apertura */}
                <div className="p-3.5 bg-bg-dark border border-border-card rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-neutral mb-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Apertura</span>
                      <Tooltip>
                        <TooltipTrigger className="text-neutral/60 hover:text-primary transition-colors cursor-help inline-flex items-center">
                          <Info className="w-3 h-3" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[220px] p-2.5 text-xs bg-popover text-popover-foreground border border-border shadow-lg">
                          <p className="font-bold text-foreground mb-0.5">Fondo Inicial de Caja</p>
                          <p className="text-muted-foreground text-[11px] leading-tight">
                            Efectivo base asignado al cajón al abrir el turno para poder dar cambio a los clientes.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Coins className="w-3.5 h-3.5 text-neutral" />
                  </div>
                  <div>
                    <span className="text-base sm:text-lg font-black font-mono text-secondary">
                      {details.session.openingBalanceFormatted}
                    </span>
                    <span className="text-[10px] text-neutral block mt-0.5">Base en caja</span>
                  </div>
                </div>

                {/* 2. Ventas Netas */}
                <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-emerald-600 mb-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Ventas Netas
                      </span>
                      <Tooltip>
                        <TooltipTrigger className="text-emerald-600/60 hover:text-emerald-600 transition-colors cursor-help inline-flex items-center">
                          <Info className="w-3 h-3" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[230px] p-2.5 text-xs bg-popover text-popover-foreground border border-border shadow-lg">
                          <p className="font-bold text-foreground mb-0.5">Ventas Netas del Turno</p>
                          <p className="text-muted-foreground text-[11px] leading-tight mb-1">
                            Facturación comercial neta total en todos los medios de pago:
                          </p>
                          <p className="font-mono text-[10px] bg-muted/60 p-1 rounded font-bold text-emerald-600">
                            (Efectivo + Tarjeta) - Devoluciones
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-base sm:text-lg font-black font-mono text-emerald-600">
                      {details.kpis.netSalesFormatted}
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono font-medium text-emerald-700/80 mt-0.5">
                      <span>Ef: {details.kpis.cashSalesFormatted}</span>
                      <span>•</span>
                      <span>Tarj: {details.kpis.cardSalesFormatted}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Gastos / Salidas */}
                <div className="p-3.5 bg-rose-500/5 border border-rose-500/15 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-rose-500 mb-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Gastos / Retiros
                      </span>
                      <Tooltip>
                        <TooltipTrigger className="text-rose-500/60 hover:text-rose-500 transition-colors cursor-help inline-flex items-center">
                          <Info className="w-3 h-3" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[220px] p-2.5 text-xs bg-popover text-popover-foreground border border-border shadow-lg">
                          <p className="font-bold text-foreground mb-0.5">Salidas de Efectivo</p>
                          <p className="text-muted-foreground text-[11px] leading-tight">
                            Total de dinero físico retirado del cajón durante el turno para compras menores, pagos o retiros autorizados.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <TrendingDown className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-base sm:text-lg font-black font-mono text-rose-500">
                      {details.kpis.totalExpensesFormatted}
                    </span>
                    <span className="text-[10px] text-rose-500/80 block mt-0.5">
                      {details.kpis.expensesLabel}
                    </span>
                  </div>
                </div>

                {/* 4. Devoluciones */}
                <div className="p-3.5 bg-amber-500/5 border border-amber-500/15 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-amber-600 mb-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Devoluciones
                      </span>
                      <Tooltip>
                        <TooltipTrigger className="text-amber-600/60 hover:text-amber-600 transition-colors cursor-help inline-flex items-center">
                          <Info className="w-3 h-3" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[230px] p-2.5 text-xs bg-popover text-popover-foreground border border-border shadow-lg">
                          <p className="font-bold text-foreground mb-0.5">Reembolsos de Efectivo</p>
                          <p className="text-muted-foreground text-[11px] leading-tight">
                            Efectivo devuelto a clientes en este turno por cancelaciones o prendas retornadas. Se resta del cajón.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <RotateCcw className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-base sm:text-lg font-black font-mono text-amber-600">
                      {details.kpis.totalRefundsFormatted}
                    </span>
                    <span className="text-[10px] text-amber-600/80 block mt-0.5">
                      {details.kpis.refundsLabel}
                    </span>
                  </div>
                </div>

                {/* 5. Esperado en Caja */}
                <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-primary mb-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Efectivo Esperado
                      </span>
                      <Tooltip>
                        <TooltipTrigger className="text-primary/60 hover:text-primary transition-colors cursor-help inline-flex items-center">
                          <Info className="w-3 h-3" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[250px] p-2.5 text-xs bg-popover text-popover-foreground border border-border shadow-lg">
                          <p className="font-bold text-foreground mb-0.5">Fórmula de Efectivo en Gaveta</p>
                          <p className="font-mono text-[10px] bg-muted/60 p-1 rounded font-bold text-primary mb-1">
                            Apertura + Cobros Efec - Gastos - Devoluciones
                          </p>
                          <p className="text-muted-foreground text-[11px] leading-tight">
                            Cantidad física exacta en billetes y monedas que debe haber en la gaveta al momento del cierre.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Receipt className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-base sm:text-lg font-black font-mono text-primary">
                      {details.session.expectedBalanceFormatted}
                    </span>
                    <span className="text-[10px] text-primary/80 block mt-0.5">
                      Físico en gaveta
                    </span>
                  </div>
                </div>

                {/* 6. Arqueo y Diferencia */}
                <div className="p-3.5 bg-bg-dark border border-border-card rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-neutral mb-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Arqueo Cierre
                      </span>
                      <Tooltip>
                        <TooltipTrigger className="text-neutral/60 hover:text-primary transition-colors cursor-help inline-flex items-center">
                          <Info className="w-3 h-3" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[240px] p-2.5 text-xs bg-popover text-popover-foreground border border-border shadow-lg">
                          <p className="font-bold text-foreground mb-0.5">Efectivo Contado y Cuadre</p>
                          <p className="text-muted-foreground text-[11px] leading-tight mb-1">
                            Dinero real contado físicamente por el cajero al momento del cierre.
                          </p>
                          <p className="font-mono text-[10px] bg-muted/60 p-1 rounded font-bold text-secondary">
                            Diferencia = Contado - Esperado
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <DollarSign className="w-3.5 h-3.5 text-neutral" />
                  </div>
                  <div>
                    {details.session.isClosed ? (
                      <>
                        <span className="text-base sm:text-lg font-black font-mono text-secondary">
                          {details.session.closingBalanceFormatted}
                        </span>
                        <span
                          className={`text-[10px] font-bold block mt-0.5 ${
                            details.session.differenceStatus === 'EXACT'
                              ? 'text-emerald-600'
                              : details.session.differenceStatus === 'SURPLUS'
                              ? 'text-blue-500'
                              : 'text-rose-500'
                          }`}
                        >
                          {details.session.differenceStatusText}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-bold text-neutral">Pendiente</span>
                        <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">
                          {details.session.differenceStatusText}
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
                          {details.sales.map((sale: CashSessionSaleEntity) => (
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
                          {details.expenses.map((exp: CashSessionExpenseEntity) => (
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
                          {details.refunds.map((ref: CashSessionRefundEntity) => (
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
