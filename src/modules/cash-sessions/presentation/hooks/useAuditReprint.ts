import { useState } from 'react';
import type { CashSessionDetails } from '../../domain/session-types';
import type { CashSessionDetailsEntity, CashSessionSaleEntity } from '../../domain/entities';
import { buildClosingTicketData, type ClosingTicketData } from '../../domain/closing-ticket';
import type { TicketSaleData } from '@/modules/sales/domain/ticket';

/** Reimpresión desde la auditoría: ticket de una venta o corte Z del turno consultado. */
export function useAuditReprint(details: CashSessionDetailsEntity | null, rawDetails: CashSessionDetails | null) {
  const [saleTicket, setSaleTicket] = useState<TicketSaleData | null>(null);
  const [closingTicket, setClosingTicket] = useState<ClosingTicketData | null>(null);

  const printSale = (sale: CashSessionSaleEntity) => {
    if (!details) return;
    setSaleTicket({
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
  };

  const printSession = () => {
    if (rawDetails) setClosingTicket(buildClosingTicketData(rawDetails));
  };

  return {
    saleTicket,
    closingTicket,
    printSale,
    printSession,
    closeSaleTicket: () => setSaleTicket(null),
    closeClosingTicket: () => setClosingTicket(null),
  };
}
