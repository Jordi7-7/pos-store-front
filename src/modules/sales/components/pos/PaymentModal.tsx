import React, { useState, useEffect } from 'react';
import { X, Check, CreditCard, Banknote, ArrowRightLeft, Smartphone, Trash2 } from 'lucide-react';
import { PaymentMethod } from '../../services/sales.service';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onCompletePayment: (payments: { paymentMethod: PaymentMethod; amount: number }[]) => Promise<void>;
  isProcessing: boolean;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  onCompletePayment,
  isProcessing
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.EFECTIVO);
  const [addedPayments, setAddedPayments] = useState<{ method: PaymentMethod; amount: number }[]>([]);
  const [customAmountText, setCustomAmountText] = useState<string>('');

  const amountPaid = addedPayments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, totalAmount - amountPaid);

  useEffect(() => {
    if (isOpen) {
      setSelectedMethod(PaymentMethod.EFECTIVO);
      setAddedPayments([]);
      setCustomAmountText(totalAmount.toFixed(2));
    }
  }, [isOpen, totalAmount]);

  useEffect(() => {
    // Pre-populate custom input with remaining value when method changes or payments update
    setCustomAmountText(remaining > 0 ? remaining.toFixed(2) : '');
  }, [selectedMethod, addedPayments, remaining]);

  if (!isOpen) return null;

  // Generate quick cash suggestions based on totalAmount
  const exactAmount = remaining;
  const nextTen = Math.ceil(remaining / 10) * 10;
  const nextFifty = Math.ceil(remaining / 50) * 50;
  const quickAmounts = Array.from(new Set([exactAmount, nextTen, nextFifty]))
    .filter(amt => amt > 0 && amt <= remaining + 500)
    .sort((a, b) => a - b);

  const handleAddPayment = (amountToAdd?: number) => {
    const val = amountToAdd !== undefined ? amountToAdd : parseFloat(customAmountText);
    if (!isNaN(val) && val > 0) {
      // Check if this method was already added, merge them or add separate row
      const existingIdx = addedPayments.findIndex(p => p.method === selectedMethod);
      if (existingIdx > -1) {
        const updated = [...addedPayments];
        updated[existingIdx].amount += val;
        setAddedPayments(updated);
      } else {
        setAddedPayments([...addedPayments, { method: selectedMethod, amount: val }]);
      }
    }
  };

  const handleRemovePayment = (index: number) => {
    setAddedPayments(addedPayments.filter((_, idx) => idx !== index));
  };

  const handleComplete = async () => {
    // If no payments were added but click Complete Payment, default to paying total with selected method
    let finalPayments = [...addedPayments];
    if (finalPayments.length === 0) {
      finalPayments = [{ method: selectedMethod, amount: totalAmount }];
    }
    await onCompletePayment(finalPayments.map(p => ({ paymentMethod: p.method, amount: p.amount })));
  };

  const getMethodDetails = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.EFECTIVO:
        return { label: 'Efectivo', sub: 'Cash', icon: Banknote, colorClass: 'text-emerald-500 bg-emerald-500/10' };
      case PaymentMethod.TARJETA:
        return { label: 'Tarjeta', sub: 'Bank', icon: CreditCard, colorClass: 'text-blue-500 bg-blue-500/10' };
      case PaymentMethod.TRANSFERENCIA:
        return { label: 'Transferencia', sub: 'Wire Transfer', icon: ArrowRightLeft, colorClass: 'text-purple-500 bg-purple-500/10' };
      case PaymentMethod.BILLETERA_DIGITAL:
        return { label: 'Billetera Digital', sub: 'Yape / Plin / Wallet', icon: Smartphone, colorClass: 'text-amber-500 bg-amber-500/10' };
      default:
        return { label: method, sub: 'Payment', icon: Banknote, colorClass: 'text-neutral bg-neutral/10' };
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-bg-card border border-border-card rounded-2xl w-full max-w-xl shadow-2xl relative overflow-hidden flex flex-col justify-between max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-border-card flex items-center justify-between shrink-0">
          <h3 className="text-sm font-bold text-secondary uppercase tracking-wider">Complete Payment</h3>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-bg-dark rounded-lg text-neutral hover:text-secondary transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-5 overflow-y-auto">
          
          {/* Summary Box */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] text-neutral uppercase font-bold block">Total Amount</span>
                <span className="text-xl font-extrabold text-secondary font-mono">${totalAmount.toFixed(2)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-amber-500 uppercase font-bold block">Remaining</span>
                <span className="text-xl font-extrabold text-amber-500 font-mono">${remaining.toFixed(2)}</span>
              </div>
            </div>
            <div className="border-t border-border-card/40 pt-2 text-[10px] text-neutral">
              <span className="font-semibold text-secondary">${amountPaid.toFixed(2)}</span> paid of <span className="font-semibold">${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Real-time Cash Change Helper */}
          {amountPaid > totalAmount && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-2xl flex justify-between items-center animate-fade-in shadow-sm">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider block opacity-90">Vuelto / Cambio a entregar</span>
                <span className="text-[10px] opacity-75">Return this change to the client</span>
              </div>
              <span className="text-2xl font-mono font-extrabold">${(amountPaid - totalAmount).toFixed(2)}</span>
            </div>
          )}

          {/* Added Payments List */}
          {addedPayments.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-neutral uppercase tracking-wider block">Added Payments</span>
              <div className="space-y-2">
                {addedPayments.map((p, idx) => {
                  const details = getMethodDetails(p.method);
                  const Icon = details.icon;
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 bg-bg-dark/40 border border-border-card/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${details.colorClass}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-secondary block">{details.label}</span>
                          <span className="text-[9px] text-neutral">{details.sub}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-secondary font-mono">${p.amount.toFixed(2)}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePayment(idx)}
                          className="p-1 text-neutral hover:text-rose-500 hover:bg-rose-500/10 rounded transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment Methods Selector Grid */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-neutral uppercase tracking-wider block">Payment Methods</span>
            <span className="text-[10px] text-neutral block -mt-1">Select method to add payments</span>
            
            <div className="grid grid-cols-2 gap-3 pt-1">
              {Object.values(PaymentMethod).map((method) => {
                const details = getMethodDetails(method);
                const Icon = details.icon;
                const isSelected = selectedMethod === method;
                return (
                  <div 
                    key={method}
                    onClick={() => setSelectedMethod(method)}
                    className={`p-3 border rounded-xl cursor-pointer flex items-center gap-3 transition-all ${
                      isSelected
                        ? 'bg-primary/5 border-primary text-secondary'
                        : 'bg-bg-dark border-border-card text-neutral hover:text-secondary hover:border-neutral/30'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isSelected ? details.colorClass : 'bg-bg-card text-neutral'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block leading-tight">{details.label}</span>
                      <span className="text-[9px] text-neutral">{details.sub}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Amount Builder Box */}
          <div className="bg-bg-dark/30 border border-border-card/50 rounded-2xl p-4 space-y-3.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-neutral uppercase tracking-wider block">Add Amount for {getMethodDetails(selectedMethod).label}</span>
            </div>

            {/* Quick cash suggestions only active for Cash, or as general amount pre-populators */}
            {quickAmounts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      handleAddPayment(amt);
                    }}
                    className="px-3 py-1.5 bg-bg-card border border-border-card hover:border-primary/40 hover:text-primary rounded-xl text-xs font-bold font-mono text-secondary transition-all"
                  >
                    ${amt.toFixed(2)}
                  </button>
                ))}
              </div>
            )}

            {/* Input custom amount */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-neutral uppercase">Amount</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="0.00"
                  value={customAmountText}
                  onChange={(e) => setCustomAmountText(e.target.value)}
                  className="flex-1 bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary font-mono focus:outline-none focus:border-primary placeholder-neutral"
                />
                <button
                  type="button"
                  onClick={() => handleAddPayment()}
                  className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold shadow-md transition-all"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border-card bg-bg-dark/40 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-bg-card border border-border-card hover:border-neutral/30 text-neutral hover:text-secondary rounded-xl text-xs font-bold transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleComplete}
            disabled={isProcessing || (addedPayments.length > 0 && amountPaid < totalAmount)}
            className="px-4 py-2.5 bg-primary hover:bg-primary-hover disabled:bg-neutral/20 disabled:text-neutral/60 text-white rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-1.5"
          >
            {isProcessing ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>Complete Payment</span>
          </button>
        </div>

      </div>
    </div>
  );
};
