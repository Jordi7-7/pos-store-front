import React, { useRef, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useLayoutContext } from '@/providers/LayoutContext';
import { useTenant, useTimezone } from '@/modules/auth/hooks/useSession';
import { CashSessionAuditModal } from '@/modules/cash-sessions/presentation/components/CashSessionAuditModal';
import type { ActiveCashSession } from '@/modules/cash-sessions/domain/session-types';
import { toast } from 'sonner';

import { usePOSCart } from '../hooks/usePOSCart';
import { usePOSHotkeys } from '../hooks/usePOSHotkeys';
import { usePOSClock } from '../hooks/pos/usePOSClock';
import { usePOSCustomer } from '../hooks/pos/usePOSCustomer';
import { usePOSPayments } from '../hooks/pos/usePOSPayments';
import { usePOSSale } from '../hooks/pos/usePOSSale';
import { usePOSShift } from '../hooks/pos/usePOSShift';

import { POSHeader } from './pos/POSHeader';
import { POSProductSearch } from './pos/POSProductSearch';
import { POSCartList } from './pos/POSCartList';
import { POSPaymentPanel } from './pos/POSPaymentPanel';
import { NoBranchSelected } from './pos/NoBranchSelected';
import { ThermalTicketModal } from './pos/ThermalTicketModal';
import { ThermalClosingTicketModal } from './pos/ThermalClosingTicketModal';
import { PrinterConfigModal } from './pos/PrinterConfigModal';
import { AperturaModal } from './pos/AperturaModal';
import { EgresoModal } from './pos/EgresoModal';
import { CierreModal } from './pos/CierreModal';
import { ExchangeReturnModal } from './pos/ExchangeReturnModal';

interface POSViewProps {
  activeSession?: ActiveCashSession | null;
  setActiveSession?: (session: ActiveCashSession | null) => void;
}

/** Contenedor del POS: junta turno, carrito, pagos y cobro (cada uno en su hook) y dibuja las piezas. */
export const POSView: React.FC<POSViewProps> = ({ activeSession: externalActiveSession, setActiveSession: setExternalActiveSession }) => {
  const { selectedBranchId, selectedBranch, selectedBranchName, setSelectedBranchId, branches } = useLayoutContext();
  const tenant = useTenant();
  const timezone = useTimezone();

  const shift = usePOSShift({ externalActiveSession, setExternalActiveSession });
  const { currentTime, shiftDuration } = usePOSClock(shift.activeSession?.openedAt, timezone);
  const cart = usePOSCart();
  const { customers, selectedCustomerId, setSelectedCustomerId } = usePOSCustomer();
  const payments = usePOSPayments(cart.cartTotal);

  const sale = usePOSSale({
    branchId: selectedBranchId,
    branchName: selectedBranch?.name || selectedBranchName,
    branchAddress: selectedBranch?.address || '',
    activeSession: shift.activeSession,
    customers,
    selectedCustomerId,
    cart: cart.cart,
    totals: cart,
    globalDiscount: { type: cart.globalDiscountType, rate: cart.globalDiscountRate },
    payments: payments.addedPayments,
    onSaleCompleted: () => {
      cart.clearCart();
      payments.resetPayments();
      setSelectedCustomerId('');
    },
    onNeedOpenSession: () => shift.setIsAperturaModalOpen(true),
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const paymentAmountInputRef = useRef<HTMLInputElement>(null);
  const [selectedImageForZoom, setSelectedImageForZoom] = useState<string | null>(null);

  usePOSHotkeys({
    onSearchFocus: () => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    },
    onPaymentFocus: () => {
      paymentAmountInputRef.current?.focus();
      paymentAmountInputRef.current?.select();
    },
    onCompletePayment: () => {
      void sale.handleCompletePayment();
    },
  });

  if (!selectedBranchId) return <NoBranchSelected branches={branches} onSelectBranch={setSelectedBranchId} />;

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 lg:h-[calc(100vh-7rem)] lg:overflow-hidden">
      <POSHeader
        currentTime={currentTime}
        shiftDuration={shiftDuration}
        activeSession={shift.activeSession}
        availableRegistersForUser={shift.availableRegistersForUser}
        onOpenApertura={() => shift.setIsAperturaModalOpen(true)}
        onOpenEgreso={() => shift.setIsEgresoModalOpen(true)}
        onOpenHistorial={() => shift.setIsHistorialModalOpen(true)}
        onOpenCambios={() => shift.setIsExchangeReturnModalOpen(true)}
        onOpenCierre={() => shift.setIsCierreModalOpen(true)}
        onOpenPrinterConfig={() => shift.setIsPrinterConfigOpen(true)}
      />

      <div className="grid min-h-0 grid-cols-1 lg:flex-1 lg:grid-cols-5 gap-6 relative items-stretch">
        <div className="lg:col-span-3 min-h-0 space-y-4 bg-bg-card border border-border-card rounded-2xl p-5 shadow-sm flex flex-col">
          <POSProductSearch
            branchId={selectedBranchId}
            searchInputRef={searchInputRef}
            onAddVariantToCart={cart.addVariantToCart}
            onOpenImageZoom={setSelectedImageForZoom}
          />
          <POSCartList
            cart={cart.cart}
            isGlobalWholesale={cart.isGlobalWholesale}
            onToggleGlobalWholesale={cart.toggleGlobalWholesale}
            onToggleItemWholesale={cart.toggleItemWholesale}
            onUpdateCartQty={cart.updateCartQty}
            onUpdateItemDiscount={cart.updateItemDiscount}
            onRemoveFromCart={cart.removeFromCart}
            onClearCart={() => {
              cart.clearCart();
              payments.resetPayments();
              toast.info('Carrito vaciado.');
            }}
            onOpenImageZoom={setSelectedImageForZoom}
          />
        </div>

        <POSPaymentPanel
          customers={customers}
          selectedCustomerId={selectedCustomerId}
          onSelectCustomer={setSelectedCustomerId}
          cart={cart.cart}
          grossSubtotal={cart.grossSubtotal}
          totalItemDiscounts={cart.totalItemDiscounts}
          netSubtotal={cart.netSubtotal}
          globalDiscountRate={cart.globalDiscountRate}
          onSetGlobalDiscountRate={cart.setGlobalDiscountRate}
          globalDiscountAmount={cart.globalDiscountAmount}
          cartTotal={cart.cartTotal}
          addedPayments={payments.addedPayments}
          amountPaid={payments.amountPaid}
          remaining={payments.remaining}
          selectedMethod={payments.selectedMethod}
          onSelectMethod={payments.setSelectedMethod}
          customAmountText={payments.customAmountText}
          onChangeCustomAmountText={payments.setCustomAmountText}
          onAddPayment={payments.handleAddPayment}
          onRemovePayment={payments.handleRemovePayment}
          onCompletePayment={sale.handleCompletePayment}
          isProcessing={sale.isProcessing}
          activeSession={shift.activeSession}
          paymentAmountInputRef={paymentAmountInputRef}
        />
      </div>

      <ThermalTicketModal
        isOpen={sale.isTicketModalOpen}
        onClose={sale.closeTicketModal}
        saleData={sale.lastCompletedSale}
        tenantRuc={tenant?.ruc || ''}
        currencyCode={tenant?.currencyCode || ''}
      />

      {shift.isAperturaModalOpen && (
        <AperturaModal
          isOpen
          onClose={() => shift.setIsAperturaModalOpen(false)}
          openingBalance={shift.openingBalance}
          setOpeningBalance={shift.setOpeningBalance}
          availableRegisters={shift.availableRegistersForUser}
          selectedRegisterId={shift.selectedRegisterId}
          setSelectedRegisterId={shift.setSelectedRegisterId}
          isSingleAssigned={shift.availableRegistersForUser.length === 1}
          onOpenSession={shift.handleOpenSession}
          isOpening={shift.isOpening}
        />
      )}

      {shift.isEgresoModalOpen && (
        <EgresoModal
          isOpen
          onClose={() => shift.setIsEgresoModalOpen(false)}
          expenseDesc={shift.expenseDesc}
          setExpenseDesc={shift.setExpenseDesc}
          expenseAmount={shift.expenseAmount}
          setExpenseAmount={shift.setExpenseAmount}
          onAddExpense={shift.handleAddExpense}
          isRegistering={shift.isRegistering}
        />
      )}

      {shift.isCierreModalOpen && (
        <CierreModal
          isOpen
          onClose={() => shift.setIsCierreModalOpen(false)}
          closingBalance={shift.closingBalance}
          setClosingBalance={shift.setClosingBalance}
          onCloseSession={shift.handleCloseSession}
          isClosing={shift.isClosing}
          activeSession={shift.activeSession}
          sessionDetails={shift.sessionDetails}
          detailsStatus={shift.detailsStatus}
        />
      )}

      {shift.isHistorialModalOpen && (
        <CashSessionAuditModal sessionId={shift.activeSession?.id || null} isOpen onClose={() => shift.setIsHistorialModalOpen(false)} />
      )}

      {shift.isClosingTicketOpen && (
        <ThermalClosingTicketModal
          isOpen
          onClose={shift.closeClosingTicket}
          sessionData={shift.closingSessionToPrint}
          tenantRuc={tenant?.ruc || ''}
          tenantName={tenant?.name || ''}
        />
      )}

      {shift.isExchangeReturnModalOpen && (
        <ExchangeReturnModal
          isOpen
          onClose={() => shift.setIsExchangeReturnModalOpen(false)}
          activeSession={shift.activeSession}
          branchId={selectedBranchId}
          cashSessionId={shift.activeSession?.id || ''}
        />
      )}

      {selectedImageForZoom && (
        <Dialog open onOpenChange={() => setSelectedImageForZoom(null)}>
          <DialogContent className="max-w-5xl w-full bg-bg-card border border-border-card p-6 pt-12 rounded-2xl flex flex-col items-center overflow-hidden shadow-2xl z-[60]">
            <div className="relative w-full max-h-[75vh] rounded-xl overflow-hidden bg-bg-dark flex items-center justify-center">
              <img src={selectedImageForZoom} className="max-w-full max-h-[75vh] object-contain" alt="Producto ampliado" />
            </div>
          </DialogContent>
        </Dialog>
      )}

      <PrinterConfigModal isOpen={shift.isPrinterConfigOpen} onClose={() => shift.setIsPrinterConfigOpen(false)} />
    </div>
  );
};
export default POSView;
