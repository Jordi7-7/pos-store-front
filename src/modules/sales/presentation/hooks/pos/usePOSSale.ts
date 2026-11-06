import { useState } from 'react';
import { toast } from 'sonner';
import { roundMoney } from '@/shared/domain/money';
import { formatMoney, useTenant } from '@/modules/auth/hooks/useSession';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';
import { getErrorMessage } from '@/shared/presentation/error-messages';
import type { ActiveCashSession } from '@/modules/cash-sessions/domain/session-types';
import { CheckoutError } from '../../../application/checkout';
import type { CartItem } from '../../../domain/cart-item';
import { PaymentMethod } from '../../../domain/enums';
import type { DiscountType } from '../../../domain/rules/cart-rules';
import type { TicketSaleData } from '../../../domain/ticket';
import { formatSaleDateTime } from '../../../infrastructure/mappers/sale.mapper';
import { thermalPrinterService } from '../../../infrastructure/printing/thermal-printer.service';
import { useProcessSale } from '../useSalesMutations';
import type { AddedPayment } from './usePOSPayments';

interface Customer {
  id: string;
  name: string;
  identityNumber?: string | null;
}

interface Options {
  branchId: string | null;
  branchName: string;
  branchAddress: string;
  activeSession: ActiveCashSession | null;
  customers: Customer[];
  selectedCustomerId: string;
  cart: CartItem[];
  totals: { grossSubtotal: number; totalItemDiscounts: number; globalDiscountAmount: number; cartTotal: number };
  globalDiscount: { type: DiscountType; rate: number };
  payments: AddedPayment[];
  /** Se llama tras cobrar: vaciar carrito, pagos y cliente. */
  onSaleCompleted: () => void;
  onNeedOpenSession: () => void;
}

/**
 * Cobro en el POS: llama al caso de uso `Checkout`, avisa del cambio y del error por su código,
 * y prepara/imprime el ticket. El cálculo del total y de los pagos NO está aquí.
 */
export function usePOSSale(options: Options) {
  const { processSale, isProcessing } = useProcessSale();
  const currentUser = useAuthStore((state) => state.user);
  const tenant = useTenant();

  const [lastCompletedSale, setLastCompletedSale] = useState<TicketSaleData | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  const handleCompletePayment = async () => {
    if (isProcessing) return; // doble clic: ya hay un cobro en curso
    const { branchId, activeSession, cart, totals, payments, globalDiscount, customers, selectedCustomerId } = options;

    if (!branchId) {
      toast.warning('Por favor selecciona una sucursal.');
      return;
    }
    if (!activeSession || !activeSession.id) {
      toast.error('No hay una sesión de caja abierta. Abre tu caja antes de registrar ventas.');
      options.onNeedOpenSession();
      return;
    }
    if (cart.length === 0) {
      toast.warning('El carrito de compras está vacío.');
      return;
    }

    try {
      const { receipt, change } = await processSale({
        branchId,
        cashSessionId: activeSession.id,
        customerId: selectedCustomerId || undefined,
        lines: cart,
        globalDiscount: { type: globalDiscount.type, rate: globalDiscount.rate, amount: totals.globalDiscountAmount || 0 },
        payments,
      });

      if (change > 0) toast.info(`Cambio a entregar al cliente: ${formatMoney(change)}`, { duration: 8000 });

      const customer = customers.find((c) => c.id === selectedCustomerId);
      const ticket: TicketSaleData = {
        invoiceNumber: receipt.invoiceNumber,
        createdAt: formatSaleDateTime(receipt.createdAt || new Date()),
        branchName: options.branchName,
        branchAddress: options.branchAddress,
        clientName: customer?.name || 'Consumidor Final',
        clientIdentity: customer?.identityNumber || '9999999999',
        items: cart.map((item) => ({
          variantId: item.variantId,
          variantSku: item.variantSku || '',
          productName: item.productName,
          combinationText: item.combinationText,
          quantity: item.quantity,
          price: item.price,
          discountAmount: item.discountAmount || 0,
        })),
        paymentMethod: payments[0]?.paymentMethod || PaymentMethod.EFECTIVO,
        subtotal: totals.grossSubtotal,
        itemsDiscountAmount: totals.totalItemDiscounts,
        globalDiscountAmount: totals.globalDiscountAmount,
        discountAmount: roundMoney(totals.totalItemDiscounts + totals.globalDiscountAmount),
        total: totals.cartTotal,
        userName: currentUser?.name || 'Vendedor',
      };

      setLastCompletedSale(ticket);
      options.onSaleCompleted();

      // Ticket: directo por USB si hay impresora configurada; si no, vista previa
      if (await thermalPrinterService.isConfigured()) {
        try {
          await thermalPrinterService.printSaleTicket(ticket, { tenantRuc: tenant?.ruc, currencyCode: tenant?.currencyCode });
          toast.success('¡Venta procesada y ticket impreso con éxito!');
        } catch (printErr) {
          console.error('Error al imprimir directamente:', printErr);
          toast.error('Error al imprimir por USB. Abriendo vista previa.');
          setIsTicketModalOpen(true);
        }
      } else {
        setIsTicketModalOpen(true);
      }
    } catch (err) {
      if (err instanceof CheckoutError && err.code === 'INSUFFICIENT_PAYMENT') {
        toast.warning(`Falta cubrir ${formatMoney(err.missing)} del total para poder procesar la venta.`);
      } else {
        toast.error(getErrorMessage(err, 'Error al procesar la venta.'));
      }
    }
  };

  return {
    handleCompletePayment,
    isProcessing,
    lastCompletedSale,
    isTicketModalOpen,
    closeTicketModal: () => {
      setIsTicketModalOpen(false);
      setLastCompletedSale(null);
    },
  };
}
