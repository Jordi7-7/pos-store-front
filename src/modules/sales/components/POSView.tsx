import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useBranches } from '../../branches/hooks/useBranches';
import { useMyCashRegisters } from '@/modules/cash-registers/hooks/useCashRegisters';
import {
  useOpenCashSession,
  useCloseCashSession,
  useRegisterExpense,
  useProcessSale,
  useActiveCashSession,
} from '../hooks/useSales';
import { useCustomers } from '../hooks/useCustomers';
import { useCashSessionDetailsQuery } from '../../cash-sessions/hooks/useCashSessions';
import { PaymentMethod } from '../services/sales.service';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { toast } from 'sonner';
import { DateTime } from 'luxon';
import { Dialog, DialogContent } from '@/components/ui/dialog';

// Modularized POS Components and Hooks
import { usePOSCart } from '../hooks/usePOSCart';
import { POSHeader } from './pos/POSHeader';
import { POSProductSearch } from './pos/POSProductSearch';
import { POSCartList } from './pos/POSCartList';
import { POSPaymentPanel } from './pos/POSPaymentPanel';

// Modals
import { ThermalTicketModal } from './pos/ThermalTicketModal';
import { ThermalClosingTicketModal } from './pos/ThermalClosingTicketModal';
import { AperturaModal } from './pos/AperturaModal';
import { EgresoModal } from './pos/EgresoModal';
import { CierreModal } from './pos/CierreModal';
import { CashSessionAuditModal } from '../../cash-sessions/components/CashSessionAuditModal';
import { cashSessionsService } from '../../cash-sessions/services/cash-sessions.service';
import { buildClosingTicketData } from '../../cash-sessions/utils/buildClosingTicketData';
import { ExchangeReturnModal } from './pos/ExchangeReturnModal';
import { usePOSHotkeys } from '../hooks/usePOSHotkeys';

interface POSViewProps {
  selectedBranchId: string;
  activeSession?: any;
  setActiveSession?: (session: any) => void;
}

export const POSView: React.FC<POSViewProps> = ({
  selectedBranchId,
  activeSession: externalActiveSession,
  setActiveSession: externalSetActiveSession,
}) => {
  const { branches } = useBranches();
  const { customers } = useCustomers();
  const { role, selectedCashRegisterId, setSelectedCashRegisterId } = useAuthStore();
  const effectiveBranchId = selectedBranchId || (branches[0] && branches[0].id) || '';
  const { myCashRegisters: availableRegistersForUser } = useMyCashRegisters(effectiveBranchId || undefined);

  const [selectedRegisterId, setSelectedRegisterId] = useState<string>(selectedCashRegisterId || '');

  // Query active cash session for the branch directly in POS
  const { activeSession: queryActiveSession } = useActiveCashSession(
    effectiveBranchId || undefined
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
  const { details: sessionDetails } = useCashSessionDetailsQuery(activeSession?.id || null, {
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

  const currentUser = useAuthStore((state) => state.user);
  const publicTenant = useAuthStore((state) => state.publicTenant);
  const timezone = useAuthStore((state) => state.timezone) || 'America/Guayaquil';

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
    const branch = selectedBranchId || (branches[0] && branches[0].id);
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

    const parsedClosing = parseFloat(closingBalance);
    if (
      closingBalance === '' ||
      closingBalance === null ||
      closingBalance === undefined ||
      isNaN(parsedClosing) ||
      parsedClosing < 0
    ) {
      toast.error('Debes ingresar el monto de efectivo físico para cerrar la caja.');
      return;
    }
    try {
      const closingSessionId = activeSession.id;
      const branch = branches.find((b: any) => b.id === selectedBranchId);

      await closeSession({
        id: closingSessionId,
        closingBalance: parsedClosing,
      });

      try {
        const closedDetails = await cashSessionsService.getCashSessionDetails(closingSessionId);
        const dataToPrint = buildClosingTicketData(closedDetails, {
          name: branch?.name,
          address: branch?.address,
        });
        setClosingSessionToPrint(dataToPrint);
      } catch (detailsErr) {
        console.error('Error fetching closing session details for ticket:', detailsErr);
        setClosingSessionToPrint({
          id: closingSessionId,
          openedAt: activeSession.openedAt,
          closedAt: new Date().toISOString(),
          openingBalance: Number(activeSession.openingBalance || 0),
          closingBalance: parsedClosing,
          expectedBalance: parsedClosing,
          salesTotal: 0,
          expensesTotal: 0,
          expensesList: [],
          productsList: [],
          paymentsBreakdown: {},
          refundsList: [],
          salesList: [],
          userName: currentUser?.name || 'Vendedor',
          branchName: branch?.name || 'Principal',
          branchAddress: branch?.address || '',
          status: 'CLOSED' as const,
        });
      }

      setActiveSession(null);
      setIsCierreModalOpen(false);
      setIsClosingTicketOpen(true);

      toast.success('¡Sesión de caja cerrada con éxito!');
    } catch (err: any) {
      toast.error(err.message || 'Error al cerrar la caja.');
    }
  };

  const handleAddExpense = async () => {
    const branch = selectedBranchId || (branches[0] && branches[0].id);
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

  const amountPaid = useMemo(() => {
    return Number(addedPayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2));
  }, [addedPayments]);

  const remaining = useMemo(() => {
    return Math.max(0, Number((cartTotal - amountPaid).toFixed(2)));
  }, [cartTotal, amountPaid]);

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

    setAddedPayments([...addedPayments, { paymentMethod: selectedMethod, amount: Number(targetAmt.toFixed(2)) }]);
    setCustomAmountText('');
  };

  const handleRemovePayment = (index: number) => {
    setAddedPayments(addedPayments.filter((_, idx) => idx !== index));
  };

  const handleCompletePayment = async () => {
    const branch = selectedBranchId || (branches[0] && branches[0].id);
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

    if (amountPaid < cartTotal) {
      toast.warning(`Falta cubrir $${remaining.toFixed(2)} del total para poder procesar la venta.`);
      return;
    }

    const branchName = branches.find((b: any) => b.id === branch)?.name || 'Sucursal General';

    let remainingBudget = cartTotal;
    const normalizedPayments: { paymentMethod: PaymentMethod; amount: number; referenceNumber?: string }[] = [];

    for (const p of addedPayments) {
      if (p.paymentMethod !== PaymentMethod.EFECTIVO && remainingBudget > 0) {
        const allowed = Math.min(p.amount, remainingBudget);
        if (allowed > 0) {
          normalizedPayments.push({ ...p, amount: Number(allowed.toFixed(2)) });
          remainingBudget = Number((remainingBudget - allowed).toFixed(2));
        }
      }
    }

    for (const p of addedPayments) {
      if (p.paymentMethod === PaymentMethod.EFECTIVO && remainingBudget > 0) {
        const allowed = Math.min(p.amount, remainingBudget);
        if (allowed > 0) {
          normalizedPayments.push({ ...p, amount: Number(allowed.toFixed(2)) });
          remainingBudget = Number((remainingBudget - allowed).toFixed(2));
        }
      }
    }

    try {
      const hasGlobalDiscount = (globalDiscountAmount || 0) > 0;

      const res = await processSale({
        branchId: branch,
        cashSessionId: activeSession.id,
        customerId: selectedCustomerId || undefined,
        discountType: hasGlobalDiscount ? globalDiscountType : undefined,
        discountRate: hasGlobalDiscount ? globalDiscountRate : undefined,
        discountAmount: globalDiscountAmount || 0,
        items: cart.map(i => {
          const hasItemDisc = (i.discountAmount || 0) > 0;
          const totalLineDiscount = Number(((i.discountAmount || 0) * i.quantity).toFixed(2));
          return {
            variantId: i.variantId,
            quantity: i.quantity,
            price: i.price,
            discountType: hasItemDisc ? i.discountType : undefined,
            discountRate: hasItemDisc ? i.discountRate : undefined,
            discountAmount: totalLineDiscount,
          };
        }),
        payments: normalizedPayments,
      });

      const change = amountPaid - cartTotal;
      if (change > 0) {
        toast.info(`Cambio a entregar al cliente: $${change.toFixed(2)}`, { duration: 8000 });
      }

      const clientName = customers.find((c: any) => c.id === selectedCustomerId)?.name || 'Consumidor Final';
      const clientIdentity = customers.find((c: any) => c.id === selectedCustomerId)?.identityNumber || '9999999999';

      const saleDataForTicket = {
        invoiceNumber: res.invoiceNumber,
        createdAt: res.createdAt || new Date().toISOString(),
        branchName,
        branchAddress: branches.find((b: any) => b.id === branch)?.address || '',
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
        discountAmount: Number((totalItemDiscounts + globalDiscountAmount).toFixed(2)),
        total: cartTotal,
        userName: currentUser?.name || 'Vendedor',
      };

      setLastCompletedSale(saleDataForTicket);
      clearCart();
      setAddedPayments([]);
      setSelectedCustomerId('');

      setIsTicketModalOpen(true);
      toast.success('¡Venta procesada con éxito y cargada en Kardex!');
    } catch (err: any) {
      toast.error(err.message || 'Error al procesar la venta.');
      throw err;
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 lg:h-[calc(100vh-7rem)] lg:overflow-hidden">
      {/* Header Bar */}
      <POSHeader
        currentTime={currentTime}
        shiftDuration={shiftDuration}
        activeSession={activeSession}
        currentUser={currentUser}
        availableRegistersForUser={availableRegistersForUser}
        userRole={role || undefined}
        onOpenApertura={() => setIsAperturaModalOpen(true)}
        onOpenEgreso={() => setIsEgresoModalOpen(true)}
        onOpenHistorial={() => setIsHistorialModalOpen(true)}
        onOpenCambios={() => setIsExchangeReturnModalOpen(true)}
        onOpenCierre={() => setIsCierreModalOpen(true)}
      />

      <div className="grid min-h-0 grid-cols-1 lg:flex-1 lg:grid-cols-5 gap-6 relative items-stretch">
        {/* LEFT COLUMN: Barcode scan input & cart products list (3/5 width) */}
        <div className="lg:col-span-3 min-h-0 space-y-4 bg-bg-card border border-border-card rounded-2xl p-5 shadow-sm flex flex-col">
          <POSProductSearch
            branchId={effectiveBranchId}
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
        tenantName={publicTenant?.name || ''}
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
          activeSessionSales={sessionDetails?.sales || []}
          activeSessionExpenses={sessionDetails?.expenses || []}
          activeSessionRefunds={sessionDetails?.refunds || []}
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
          branchId={selectedBranchId}
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
    </div>
  );
};
export default POSView;
