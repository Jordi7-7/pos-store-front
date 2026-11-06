import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { roundMoney } from '@/shared/domain/value-objects/money';
import { PaymentMethod } from '../../../domain/enums';
import { remainingToPay } from '../../../domain/rules/sale-pricing';

export interface AddedPayment {
  paymentMethod: PaymentMethod;
  amount: number;
}

/** Pagos que el cajero va añadiendo a la venta y lo que falta por cubrir. */
export function usePOSPayments(cartTotal: number) {
  const [addedPayments, setAddedPayments] = useState<AddedPayment[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.EFECTIVO);
  const [customAmountText, setCustomAmountText] = useState('');

  const paymentAmounts = useMemo(() => addedPayments.map((p) => p.amount), [addedPayments]);
  const amountPaid = useMemo(() => roundMoney(paymentAmounts.reduce((sum, amount) => sum + amount, 0)), [paymentAmounts]);
  const remaining = useMemo(() => remainingToPay(cartTotal, paymentAmounts), [cartTotal, paymentAmounts]);

  const handleAddPayment = () => {
    const amount = parseFloat(customAmountText);
    if (isNaN(amount) || amount <= 0) {
      toast.warning('Ingresa un monto de pago válido.');
      return;
    }
    if (remaining <= 0) {
      toast.warning('La venta ya está totalmente pagada.');
      return;
    }
    setAddedPayments([...addedPayments, { paymentMethod: selectedMethod, amount: roundMoney(amount) }]);
    setCustomAmountText('');
  };

  /** Cobra de una vez lo que falta con el método elegido (el caso más común: el cliente paga justo). */
  const handleAddExactPayment = () => {
    if (remaining <= 0) {
      toast.warning('La venta ya está totalmente pagada.');
      return;
    }
    setAddedPayments([...addedPayments, { paymentMethod: selectedMethod, amount: roundMoney(remaining) }]);
    setCustomAmountText('');
  };

  const handleRemovePayment = (index: number) => setAddedPayments(addedPayments.filter((_, idx) => idx !== index));
  const resetPayments = () => setAddedPayments([]);

  return {
    addedPayments,
    selectedMethod,
    setSelectedMethod,
    customAmountText,
    setCustomAmountText,
    amountPaid,
    remaining,
    handleAddPayment,
    handleAddExactPayment,
    handleRemovePayment,
    resetPayments,
  };
}
