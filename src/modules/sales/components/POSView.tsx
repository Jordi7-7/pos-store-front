import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useMyCashRegisters } from '@/modules/cash-registers/hooks/useCashRegisters';
import {
  useOpenCashSession,
  useCloseCashSession,
  useActiveCashSession,
} from '../hooks/useCashSession';
import {
  useRegisterExpense,
  useProcessSale,
} from '../hooks/useSalesMutations';
import { useCustomerList } from '@/modules/customers';
import { useCashSessionDetailsQuery } from '../../cash-sessions/hooks/useCashSessions';
import { PaymentMethod } from '../enums';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { useWorkspaceStore } from '@/shared/presentation/stores/workspace.store';
import { useTenant, useTimezone } from '../../auth/hooks/useSession';
import { toast } from 'sonner';
import { DateTime } from 'luxon';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useLayoutContext } from '@/providers/LayoutContext';
import { Building, Store, ArrowRight } from 'lucide-react';

// Modularized POS Components and Hooks
import { usePOSCart } from '../hooks/usePOSCart';
import { POSHeader } from './pos/POSHeader';
import { POSProductSearch } from './pos/POSProductSearch';
import { POSCartList } from './pos/POSCartList';
import { POSPaymentPanel } from './pos/POSPaymentPanel';

// Modals
import { ThermalTicketModal } from './pos/ThermalTicketModal';
import { ThermalClosingTicketModal } from './pos/ThermalClosingTicketModal';
import { PrinterConfigModal } from './pos/PrinterConfigModal';
import { thermalPrinterService } from '../services/thermal-printer.service';
import { AperturaModal } from './pos/AperturaModal';
import { EgresoModal } from './pos/EgresoModal';
import { CierreModal } from './pos/CierreModal';
import { CashSessionAuditModal } from '../../cash-sessions/components/CashSessionAuditModal';
import { CloseCashSessionError } from '@/modules/cash-sessions/application/close-cash-session';
import { getErrorMessage } from '@/shared/presentation/error-messages';
import { buildClosingTicketData } from '../../cash-sessions/utils/buildClosingTicketData';
import { ExchangeReturnModal } from './pos/ExchangeReturnModal';
import { remainingToPay } from '../domain/rules/sale-pricing';
import { CheckoutError } from '../application/checkout';
import { usePOSHotkeys } from '../hooks/usePOSHotkeys';
import { formatSaleDateTime } from '../mappers/sale.mapper';
import { formatMoney } from '@/modules/auth/hooks/useSession';
import { roundMoney } from '@/shared/domain/money';

interface POSViewProps {
  activeSession?: any;
  setActiveSession?: (session: any) => void;
}

export const POSView: React.FC<POSViewProps> = ({
  activeSession: externalActiveSession,
  setActiveSession: externalSetActiveSession,
}) => {
  const {
    selectedBranchId,
    selectedBranch,
    selectedBranchName,
    setSelectedBranchId,
    branches,
  } = useLayoutContext();
  const { customers } = useCustomerList();
  const { selectedCashRegisterId, setSelectedCashRegisterId } = useWorkspaceStore();
  const { myCashRegisters: availableRegistersForUser } = useMyCashRegisters(selectedBranchId || undefined);

  const [selectedRegisterId, setSelectedRegisterId] = useState<string>(selectedCashRegisterId || '');

  // Query active cash session for the branch directly in POS
  const { activeSession: queryActiveSession } = useActiveCashSession(
    selectedBranchId || undefined
  );

  const [internalSession, setInternalSession] = useState<any>(null);

  useEffect(() => {
    if (queryActiveSession !== undefined) {
      setInternalSession(queryActiveSession && queryActiveSession.id ? queryActiveSession : null);
    }
  }, [queryActiveSession]);

  const rawSession = externalActiveSession !== undefined ? externalActiveSession : internalSession;
  const activeSession = rawSession && rawSession.id ? rawSession : null;
  const setActiveSession = (session: any) => {
    const validSession = session && session.id ? session : null;
    setInternalSession(validSession);
    if (externalSetActiveSession) {
      externalSetActiveSession(validSession);
    }
  };

  // Modal Visibility states
  const [isAperturaModalOpen, setIsAperturaModalOpen] = useState(false);
  const [isEgresoModalOpen, setIsEgresoModalOpen] = useState(false);
  const [isCierreModalOpen, setIsCierreModalOpen] = useState(false);
  const [isHistorialModalOpen, setIsHistorialModalOpen] = useState(false);
  const [isExchangeReturnModalOpen, setIsExchangeReturnModalOpen] = useState(false);

  // Lazy-fetch session details only when Cierre or Historial modal is open
  const isSessionDetailsNeeded = isCierreModalOpen || isHistorialModalOpen;
  const { rawDetails: rawSessionDetails, isError: isSessionDetailsError } = useCashSessionDetailsQuery(activeSession?.id || null, {
    enabled: isSessionDetailsNeeded,
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const paymentAmountInputRef = useRef<HTMLInputElement>(null);

  const { openSession, isOpening } = useOpenCashSession();
  const { closeSession, isClosing } = useCloseCashSession();
  const { registerExpense: apiRegisterExpense, isRegistering } = useRegisterExpense();
  const { processSale, isProcessing } = useProcessSale();

  // Session Balance & Expense Form fields
  const [openingBalance, setOpeningBalance] = useState('1000.00');
  const [closingBalance, setClosingBalance] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const expenseCategory = 'Servicios';

  // Keep local selectedRegisterId in sync with active session or store
  useEffect(() => {
    if (activeSession?.cashRegisterId) {
      setSelectedRegisterId(activeSession.cashRegisterId);
      setSelectedCashRegisterId(activeSession.cashRegisterId);
    } else if (selectedCashRegisterId) {
      setSelectedRegisterId(selectedCashRegisterId);
    }
  }, [activeSession?.cashRegisterId, selectedCashRegisterId, setSelectedCashRegisterId]);

  // Cart Custom Hook
  const {
    cart,
    isGlobalWholesale,
    globalDiscountType,
    globalDiscountRate,
    setGlobalDiscountRate,
    globalDiscountAmount,
    grossSubtotal,
    totalItemDiscounts,
    netSubtotal,
    cartTotal,
    addVariantToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    updateItemDiscount,
    toggleGlobalWholesale,
    toggleItemWholesale,
  } = usePOSCart();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  // Payment states
  const [addedPayments, setAddedPayments] = useState<{ paymentMethod: PaymentMethod; amount: number }[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.EFECTIVO);
  const [customAmountText, setCustomAmountText] = useState('');

  // Ticket Printing State
  const [lastCompletedSale, setLastCompletedSale] = useState<any | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [closingSessionToPrint, setClosingSessionToPrint] = useState<any | null>(null);
  const [isClosingTicketOpen, setIsClosingTicketOpen] = useState(false);
  const [selectedImageForZoom, setSelectedImageForZoom] = useState<string | null>(null);

  // USB Thermal Printer States
  const [isPrinterConfigOpen, setIsPrinterConfigOpen] = useState(false);

  const currentUser = useAuthStore((state) => state.user);
  const publicTenant = useTenant();
  const timezone = useTimezone();

  // Clock & shift timer
  const [currentTime, setCurrentTime] = useState(() => DateTime.now().setZone(timezone).toFormat('HH:mm:ss'));
  const [shiftDuration, setShiftDuration] = useState('00h 00m 00s');

  useEffect(() => {
    const updateTimer = () => {
      const now = DateTime.now().setZone(timezone);
      setCurrentTime(now.toFormat('HH:mm:ss'));

      const sessionStartTime = activeSession?.openedAt;
      if (activeSession && sessionStartTime) {
        const openedAt = typeof sessionStartTime === 'string'
          ? DateTime.fromISO(sessionStartTime).setZone(timezone)
          : DateTime.fromJSDate(new Date(sessionStartTime)).setZone(timezone);

        if (openedAt.isValid) {
          const diff = now.diff(openedAt, ['hours', 'minutes', 'seconds']);
          const diffHrs = Math.max(0, Math.floor(diff.hours)).toString().padStart(2, '0');
          const diffMins = Math.max(0, Math.floor(diff.minutes)).toString().padStart(2, '0');
          const diffSecs = Math.max(0, Math.floor(diff.seconds)).toString().padStart(2, '0');
          setShiftDuration(`${diffHrs}h ${diffMins}m ${diffSecs}s`);
        } else {
          setShiftDuration('00h 00m 00s');
        }
      } else {
        setShiftDuration('00h 00m 00s');
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [activeSession, timezone]);

  // Pre-select CONSUMIDOR FINAL by default
  useEffect(() => {
    if (customers && customers.length > 0 && !selectedCustomerId) {
      const defaultCust = customers.find(
        (c: any) =>
          c.name.toUpperCase() === 'CONSUMIDOR FINAL' ||
          c.identityNumber === '9999999999999' ||
          c.identityNumber === '9999999999'
      );
      if (defaultCust) {
        setSelectedCustomerId(defaultCust.id);
      }
    }
  }, [customers, selectedCustomerId]);

  // Global hotkeys hook integration
  usePOSHotkeys({
    onSearchFocus: () => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        searchInputRef.current.select();
      }
    },
    onPaymentFocus: () => {
      if (paymentAmountInputRef.current) {
        paymentAmountInputRef.current.focus();
        paymentAmountInputRef.current.select();
      }
    },
    onCompletePayment: () => {
      handleCompletePayment();
    },
  });

  const handleOpenSession = async () => {
    const branch = selectedBranchId;
    if (!branch) {
      toast.warning('Por favor selecciona una sucursal activa.');
      return;
    }
    if (!selectedRegisterId) {
      toast.warning('Por favor selecciona una caja registradora.');
      return;
    }
    try {
      const res = await openSession({
        branchId: branch,
        cashRegisterId: selectedRegisterId,
        openingBalance: parseFloat(openingBalance || '0'),
      });
      setActiveSession(res);
      setIsAperturaModalOpen(false);
      toast.success('¡Caja registradora abierta con éxito!');
    } catch (err: any) {
      toast.error(err.message || 'Error al abrir la caja.');
    }
  };

  const handleCloseSession = async () => {
    if (!activeSession) return;

    try {
      // El corte Z solo se imprime con datos reales del servidor: si no se pudieron leer, no se inventan.
      const { details } = await closeSession({ id: activeSession.id, countedCash: closingBalance });
      const closingDataToUse = details ? buildClosingTicketData(details) : null;

      setActiveSession(null);
      setIsCierreModalOpen(false);

      if (!closingDataToUse) {
        toast.warning('Caja cerrada. No se pudo cargar el resumen para imprimir el corte; un administrador puede reimprimirlo desde el historial de cajas.');
        return;
      }
      setClosingSessionToPrint(closingDataToUse);

      const isPrinterConfigured = await thermalPrinterService.isConfigured();
      if (isPrinterConfigured) {
        try {
          await thermalPrinterService.printClosingTicket(closingDataToUse);
          toast.success('¡Sesión de caja cerrada y corte impreso en ticket!');
        } catch (printErr: any) {
          console.error('Error al imprimir corte directo:', printErr);
          setIsClosingTicketOpen(true);
        }
      } else {
        setIsClosingTicketOpen(true);
      }
    } catch (err: any) {
      toast.error(err instanceof CloseCashSessionError ? err.message : getErrorMessage(err, 'Error al cerrar la caja.'));
    }
  };

  const handleAddExpense = async () => {
    const branch = selectedBranchId;
    if (!branch) return;
    if (!expenseDesc.trim()) {
      toast.warning('Por favor ingresa una descripción para el gasto.');
      return;
    }
    if (!expenseAmount || parseFloat(expenseAmount) <= 0) {
      toast.warning('Por favor ingresa un monto válido.');
      return;
    }
    try {
      await apiRegisterExpense({
        branchId: branch,
        cashSessionId: activeSession?.id,
        description: expenseDesc.trim(),
        amount: parseFloat(expenseAmount),
        category: expenseCategory,
      });
      setExpenseDesc('');
      setExpenseAmount('');
      setIsEgresoModalOpen(false);
      toast.success('¡Gasto registrado con éxito!');
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar el gasto.');
    }
  };

  const paymentAmounts = useMemo(() => addedPayments.map((p) => p.amount), [addedPayments]);
  const amountPaid = useMemo(() => roundMoney(paymentAmounts.reduce((sum, amount) => sum + amount, 0)), [paymentAmounts]);
  const remaining = useMemo(() => remainingToPay(cartTotal, paymentAmounts), [cartTotal, paymentAmounts]);

  const handleAddPayment = () => {
    const targetAmt = parseFloat(customAmountText);
    if (isNaN(targetAmt) || targetAmt <= 0) {
      toast.warning('Ingresa un monto de pago válido.');
      return;
    }

    if (remaining <= 0) {
      toast.warning('La venta ya está totalmente pagada.');
      return;
    }

    setAddedPayments([...addedPayments, { paymentMethod: selectedMethod, amount: roundMoney(targetAmt) }]);
    setCustomAmountText('');
  };

  const handleRemovePayment = (index: number) => {
    setAddedPayments(addedPayments.filter((_, idx) => idx !== index));
  };

  const handleCompletePayment = async () => {
    if (isProcessing) return; // doble clic: ya hay un cobro en curso
    const branch = selectedBranchId;
    if (!branch) {
      toast.warning('Por favor selecciona una sucursal.');
      return;
    }
    if (!activeSession || !activeSession.id) {
      toast.error('No hay una sesión de caja abierta. Abre tu caja antes de registrar ventas.');
      setIsAperturaModalOpen(true);
      return;
    }
    if (cart.length === 0) {
      toast.warning('El carrito de compras está vacío.');
      return;
    }

    try {
      const { receipt: res, change } = await processSale({
        branchId: branch,
        cashSessionId: activeSession.id,
        customerId: selectedCustomerId || undefined,
        lines: cart,
        globalDiscount: { type: globalDiscountType, rate: globalDiscountRate, amount: globalDiscountAmount || 0 },
        payments: addedPayments,
      });

      if (change > 0) {
        toast.info(`Cambio a entregar al cliente: ${formatMoney(change)}`, { duration: 8000 });
      }

      const clientName = customers.find((c: any) => c.id === selectedCustomerId)?.name || 'Consumidor Final';
      const clientIdentity = customers.find((c: any) => c.id === selectedCustomerId)?.identityNumber || '9999999999';

      const saleDataForTicket = {
        invoiceNumber: res.invoiceNumber,
        createdAt: formatSaleDateTime(res.createdAt || new Date()),
        branchName: selectedBranch?.name || selectedBranchName,
        branchAddress: selectedBranch?.address || '',
        clientName,
        clientIdentity,
        items: cart.map(i => ({
          variantId: i.variantId,
          variantSku: i.variantSku || '',
          productName: i.productName,
          combinationText: i.combinationText,
          quantity: i.quantity,
          price: i.price,
          discountAmount: i.discountAmount || 0,
        })),
        paymentMethod: addedPayments[0]?.paymentMethod || PaymentMethod.EFECTIVO,
        subtotal: grossSubtotal,
        itemsDiscountAmount: totalItemDiscounts,
        globalDiscountAmount: globalDiscountAmount,
        discountAmount: roundMoney(totalItemDiscounts + globalDiscountAmount),
        total: cartTotal,
        userName: currentUser?.name || 'Vendedor',
      };

      setLastCompletedSale(saleDataForTicket);
      clearCart();
      setAddedPayments([]);
      setSelectedCustomerId('');

      // Impresión de ticket: directo por USB si está configurada, o vista previa directa
      const isPrinterConfigured = await thermalPrinterService.isConfigured();
      if (isPrinterConfigured) {
        try {
          await thermalPrinterService.printSaleTicket(saleDataForTicket, {
            tenantRuc: publicTenant?.ruc,
            currencyCode: publicTenant?.currencyCode,
          });
          toast.success('¡Venta procesada y ticket impreso con éxito!');
        } catch (printErr: any) {
          console.error('Error al imprimir directamente:', printErr);
          toast.error('Error al imprimir por USB. Abriendo vista previa.');
          setIsTicketModalOpen(true);
        }
      } else {
        setIsTicketModalOpen(true);
      }
    } catch (err: any) {
      if (err instanceof CheckoutError && err.code === 'INSUFFICIENT_PAYMENT') {
        toast.warning(`Falta cubrir ${formatMoney(err.missing)} del total para poder procesar la venta.`);
      } else {
        toast.error(getErrorMessage(err, 'Error al procesar la venta.'));
      }
      throw err;
    }
  };

  if (!selectedBranchId) {
    return (
      <div className="flex h-full min-h-[500px] flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-bg-card border border-border-card rounded-2xl p-8 shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-5">
            <Store className="w-8 h-8" />
          </div>

          <h2 className="text-lg font-bold text-secondary mb-2">
            Selecciona una sucursal para vender
          </h2>
          <p className="text-xs text-neutral leading-relaxed mb-6">
            El Punto de Venta requiere estar vinculado a una sucursal física para gestionar la caja registradora, turnos y movimientos de inventario.
          </p>

          <div className="w-full space-y-2">
            <span className="text-[11px] font-semibold text-neutral uppercase tracking-wider block text-left mb-1">
              Sucursales disponibles:
            </span>
            {branches && branches.length > 0 ? (
              branches.map((b: any) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBranchId(b.id)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-bg-dark hover:bg-primary/5 border border-border-card hover:border-primary/40 transition-all group text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Building className="w-4 h-4 text-neutral group-hover:text-primary transition-colors" />
                    <div>
                      <div className="text-xs font-bold text-secondary group-hover:text-primary transition-colors">
                        {b.name}
                      </div>
                      {b.address && (
                        <div className="text-[10px] text-neutral line-clamp-1">{b.address}</div>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </button>
              ))
            ) : (
              <div className="p-3 text-xs text-neutral bg-bg-dark rounded-xl border border-border-card">
                No tienes sucursales asignadas. Contacta al administrador.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 lg:h-[calc(100vh-7rem)] lg:overflow-hidden">
      {/* Header Bar */}
      <POSHeader
        currentTime={currentTime}
        shiftDuration={shiftDuration}
        activeSession={activeSession}
        availableRegistersForUser={availableRegistersForUser}
        onOpenApertura={() => setIsAperturaModalOpen(true)}
        onOpenEgreso={() => setIsEgresoModalOpen(true)}
        onOpenHistorial={() => setIsHistorialModalOpen(true)}
        onOpenCambios={() => setIsExchangeReturnModalOpen(true)}
        onOpenCierre={() => setIsCierreModalOpen(true)}
        onOpenPrinterConfig={() => setIsPrinterConfigOpen(true)}
      />

      <div className="grid min-h-0 grid-cols-1 lg:flex-1 lg:grid-cols-5 gap-6 relative items-stretch">
        {/* LEFT COLUMN: Barcode scan input & cart products list (3/5 width) */}
        <div className="lg:col-span-3 min-h-0 space-y-4 bg-bg-card border border-border-card rounded-2xl p-5 shadow-sm flex flex-col">
          <POSProductSearch
            branchId={selectedBranchId!}
            searchInputRef={searchInputRef}
            onAddVariantToCart={addVariantToCart}
            onOpenImageZoom={(url) => setSelectedImageForZoom(url)}
          />

          <POSCartList
            cart={cart}
            isGlobalWholesale={isGlobalWholesale}
            onToggleGlobalWholesale={toggleGlobalWholesale}
            onToggleItemWholesale={toggleItemWholesale}
            onUpdateCartQty={updateCartQty}
            onUpdateItemDiscount={updateItemDiscount}
            onRemoveFromCart={removeFromCart}
            onClearCart={() => {
              clearCart();
              setAddedPayments([]);
              toast.info('Carrito vaciado.');
            }}
            onOpenImageZoom={(url) => setSelectedImageForZoom(url)}
          />
        </div>

        {/* RIGHT COLUMN: Payments details, client selector, total breakdown (2/5 width) */}
        <POSPaymentPanel
          customers={customers}
          selectedCustomerId={selectedCustomerId}
          onSelectCustomer={setSelectedCustomerId}
          cart={cart}
          grossSubtotal={grossSubtotal}
          totalItemDiscounts={totalItemDiscounts}
          netSubtotal={netSubtotal}
          globalDiscountRate={globalDiscountRate}
          onSetGlobalDiscountRate={setGlobalDiscountRate}
          globalDiscountAmount={globalDiscountAmount}
          cartTotal={cartTotal}
          addedPayments={addedPayments}
          amountPaid={amountPaid}
          remaining={remaining}
          selectedMethod={selectedMethod}
          onSelectMethod={setSelectedMethod}
          customAmountText={customAmountText}
          onChangeCustomAmountText={setCustomAmountText}
          onAddPayment={handleAddPayment}
          onRemovePayment={handleRemovePayment}
          onCompletePayment={handleCompletePayment}
          isProcessing={isProcessing}
          activeSession={activeSession}
          paymentAmountInputRef={paymentAmountInputRef}
        />
      </div>

      {/* Modals */}
      <ThermalTicketModal
        isOpen={isTicketModalOpen}
        onClose={() => {
          setIsTicketModalOpen(false);
          setLastCompletedSale(null);
        }}
        saleData={lastCompletedSale}
        tenantRuc={publicTenant?.ruc || ''}
        currencyCode={publicTenant?.currencyCode || ''}
      />

      {isAperturaModalOpen && (
        <AperturaModal
          isOpen={isAperturaModalOpen}
          onClose={() => setIsAperturaModalOpen(false)}
          openingBalance={openingBalance}
          setOpeningBalance={setOpeningBalance}
          availableRegisters={availableRegistersForUser}
          selectedRegisterId={selectedRegisterId}
          setSelectedRegisterId={setSelectedRegisterId}
          isSingleAssigned={availableRegistersForUser.length === 1}
          onOpenSession={handleOpenSession}
          isOpening={isOpening}
        />
      )}

      {isEgresoModalOpen && (
        <EgresoModal
          isOpen={isEgresoModalOpen}
          onClose={() => setIsEgresoModalOpen(false)}
          expenseDesc={expenseDesc}
          setExpenseDesc={setExpenseDesc}
          expenseAmount={expenseAmount}
          setExpenseAmount={setExpenseAmount}
          onAddExpense={handleAddExpense}
          isRegistering={isRegistering}
        />
      )}

      {isCierreModalOpen && (
        <CierreModal
          isOpen={isCierreModalOpen}
          onClose={() => setIsCierreModalOpen(false)}
          closingBalance={closingBalance}
          setClosingBalance={setClosingBalance}
          onCloseSession={handleCloseSession}
          isClosing={isClosing}
          activeSession={activeSession}
          sessionDetails={rawSessionDetails}
          detailsStatus={rawSessionDetails ? 'ready' : isSessionDetailsError ? 'unavailable' : 'loading'}
          activeSessionSales={rawSessionDetails?.sales || []}
          activeSessionExpenses={rawSessionDetails?.expenses || []}
          activeSessionRefunds={rawSessionDetails?.refunds || []}
        />
      )}

      {isHistorialModalOpen && (
        <CashSessionAuditModal
          sessionId={activeSession?.id || null}
          isOpen={isHistorialModalOpen}
          onClose={() => setIsHistorialModalOpen(false)}
        />
      )}

      {isClosingTicketOpen && (
        <ThermalClosingTicketModal
          isOpen={isClosingTicketOpen}
          onClose={() => {
            setIsClosingTicketOpen(false);
            setClosingSessionToPrint(null);
          }}
          sessionData={closingSessionToPrint}
          tenantRuc={publicTenant?.ruc || ''}
          tenantName={publicTenant?.name || ''}
        />
      )}

      {isExchangeReturnModalOpen && (
        <ExchangeReturnModal
          isOpen={isExchangeReturnModalOpen}
          onClose={() => setIsExchangeReturnModalOpen(false)}
          activeSession={activeSession}
          branchId={selectedBranchId!}
          cashSessionId={activeSession?.id || ''}
        />
      )}

      {selectedImageForZoom && (
        <Dialog open={!!selectedImageForZoom} onOpenChange={() => setSelectedImageForZoom(null)}>
          <DialogContent className="max-w-5xl w-full bg-bg-card border border-border-card p-6 pt-12 rounded-2xl flex flex-col items-center overflow-hidden shadow-2xl z-[60]">
            <div className="relative w-full max-h-[75vh] rounded-xl overflow-hidden bg-bg-dark flex items-center justify-center">
              <img src={selectedImageForZoom} className="max-w-full max-h-[75vh] object-contain" alt="Producto ampliado" />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Printer Configuration Modal */}
      <PrinterConfigModal
        isOpen={isPrinterConfigOpen}
        onClose={() => setIsPrinterConfigOpen(false)}
      />
    </div>
  );
};
export default POSView;
