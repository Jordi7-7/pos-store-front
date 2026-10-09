import React from 'react';
import {
  ArrowLeftRight,
  RotateCcw,
  ArrowLeft,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useExchangeReturn } from '../../hooks/useExchangeReturn';
import { ExchangeSearchStep } from './exchange-return/ExchangeSearchStep';
import { ExchangeSelectItemsStep } from './exchange-return/ExchangeSelectItemsStep';
import { ExchangeModeStep } from './exchange-return/ExchangeModeStep';
import { ExchangeConfirmRefundStep } from './exchange-return/ExchangeConfirmRefundStep';
import { ExchangeItemsStep } from './exchange-return/ExchangeItemsStep';

interface ExchangeReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSession: any | null;
  branchId: string;
  cashSessionId: string;
}

function StepIndicator({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="flex items-center gap-1 mb-4">
      {steps.map((label, i) => (
        <React.Fragment key={i}>
          <div className={`flex items-center gap-1.5 ${i === current ? 'opacity-100' : i < current ? 'opacity-60' : 'opacity-30'}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
              ${i < current ? 'bg-emerald-500 text-white' : i === current ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className="text-[10px] font-medium text-muted-foreground hidden sm:inline">{label}</span>
          </div>
          {i < steps.length - 1 && <div className="flex-1 h-px bg-border mx-1" />}
        </React.Fragment>
      ))}
    </div>
  );
}

export function ExchangeReturnModal({
  isOpen,
  onClose,
  branchId,
  cashSessionId,
}: ExchangeReturnModalProps) {
  const {
    step,
    setStep,
    invoiceInput,
    setInvoiceInput,
    isSearching,
    foundSale,
    setFoundSale,
    returnQtyMap,
    adjustReturnQty,
    selectedReturnItems,
    allItemsFullyRefunded,
    totalToReturn,
    reason,
    setReason,
    newItems,
    scanInput,
    setScanInput,
    isScanLoading,
    scanRef,
    handleScanKeyPress,
    adjustNewItemQty,
    removeNewItem,
    handleUpdateNewItemDiscount,
    totalNewItems,
    exchangeDiff,
    handleSearch,
    handleConfirmRefund,
    handleConfirmExchange,
    handleClose,
    isProcessing,
  } = useExchangeReturn({
    branchId,
    cashSessionId,
    onClose,
  });

  const REFUND_STEPS = ['Buscar Folio', 'Seleccionar', 'Confirmar'];
  const EXCHANGE_STEPS = ['Buscar Folio', 'Seleccionar', 'Modo', 'Artículos Nuevos'];

  const currentStepIndex =
    step === 'search' ? 0
    : step === 'select-items' ? 1
    : step === 'choose-mode' ? 2
    : step === 'confirm-refund' ? 2
    : 3; // exchange

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-3xl max-w-3xl w-[92vw] max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-0 shrink-0">
          <DialogTitle className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2 mb-1">
            {step === 'search' || step === 'select-items' || step === 'choose-mode' ? (
              <ArrowLeftRight className="w-4 h-4 text-primary" />
            ) : step === 'confirm-refund' ? (
              <RotateCcw className="w-4 h-4 text-rose-500" />
            ) : (
              <ArrowLeftRight className="w-4 h-4 text-indigo-400" />
            )}
            {step === 'confirm-refund' ? 'Devolución' : 'Cambios y Devoluciones'}
          </DialogTitle>

          {/* Back button */}
          {step !== 'search' && (
            <button
              type="button"
              onClick={() => {
                if (step === 'select-items') { setStep('search'); setFoundSale(null); }
                else if (step === 'choose-mode') setStep('select-items');
                else if (step === 'confirm-refund') setStep('choose-mode');
                else if (step === 'exchange') setStep('choose-mode');
              }}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors mt-1 cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" /> Volver
            </button>
          )}

          <div className="mt-3">
            <StepIndicator
              current={currentStepIndex}
              steps={step === 'exchange' || step === 'choose-mode' ? EXCHANGE_STEPS : REFUND_STEPS}
            />
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-3">
          {step === 'search' && (
            <ExchangeSearchStep
              invoiceInput={invoiceInput}
              onChangeInvoiceInput={setInvoiceInput}
              onSearch={handleSearch}
              isSearching={isSearching}
            />
          )}

          {step === 'select-items' && foundSale && (
            <ExchangeSelectItemsStep
              foundSale={foundSale}
              returnQtyMap={returnQtyMap}
              onAdjustReturnQty={adjustReturnQty}
              selectedReturnItems={selectedReturnItems}
              totalToReturn={totalToReturn}
              allItemsFullyRefunded={allItemsFullyRefunded}
              onContinue={() => setStep('choose-mode')}
            />
          )}

          {step === 'choose-mode' && (
            <ExchangeModeStep
              selectedReturnItems={selectedReturnItems}
              totalToReturn={totalToReturn}
              onSelectRefund={() => setStep('confirm-refund')}
              onSelectExchange={() => setStep('exchange')}
            />
          )}

          {step === 'confirm-refund' && (
            <ExchangeConfirmRefundStep
              foundSale={foundSale}
              selectedReturnItems={selectedReturnItems}
              returnQtyMap={returnQtyMap}
              totalToReturn={totalToReturn}
              reason={reason}
              onChangeReason={setReason}
              onConfirmRefund={handleConfirmRefund}
              isProcessing={isProcessing}
            />
          )}

          {step === 'exchange' && (
            <ExchangeItemsStep
              selectedReturnItems={selectedReturnItems}
              returnQtyMap={returnQtyMap}
              totalToReturn={totalToReturn}
              newItems={newItems}
              scanInput={scanInput}
              onChangeScanInput={setScanInput}
              onScanKeyDown={handleScanKeyPress}
              isScanLoading={isScanLoading}
              scanRef={scanRef}
              onAdjustNewItemQty={adjustNewItemQty}
              onRemoveNewItem={removeNewItem}
              onUpdateNewItemDiscount={handleUpdateNewItemDiscount}
              totalNewItems={totalNewItems}
              exchangeDiff={exchangeDiff}
              reason={reason}
              onChangeReason={setReason}
              onConfirmExchange={handleConfirmExchange}
              isProcessing={isProcessing}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
