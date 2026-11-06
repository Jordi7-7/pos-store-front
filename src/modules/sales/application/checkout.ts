import { DiscountType } from '@/modules/sales/domain/enums';
import { Money } from '@/shared/domain/money';
import { CheckoutAttempt, checkoutFingerprint } from '../domain/checkout-attempt';
import { allocatePayments, changeDue, paymentsCoverTotal, priceSale, remainingToPay } from '../domain/rules/sale-pricing';
import type { ProcessSaleInput, SaleReceipt, SalesRepository } from './ports/sales.repository';

export interface CheckoutLine {
  variantId: string;
  quantity: number;
  /** Precio unitario ya elegido (regular o mayoreo). */
  price: number;
  discountType?: DiscountType;
  discountRate?: number;
  /** Descuento por unidad. */
  discountAmount?: number;
}

export interface CheckoutCommand {
  branchId: string;
  cashSessionId: string;
  customerId?: string;
  lines: readonly CheckoutLine[];
  globalDiscount?: { type: DiscountType; rate: number; amount: number };
  payments: ProcessSaleInput['payments'];
}

export type CheckoutErrorCode = 'EMPTY_CART' | 'INSUFFICIENT_PAYMENT';

export class CheckoutError extends Error {
  constructor(
    readonly code: CheckoutErrorCode,
    message: string,
    /** Importe que falta por cubrir (solo con `INSUFFICIENT_PAYMENT`). */
    readonly missing = 0,
  ) {
    super(message);
    this.name = 'CheckoutError';
  }
}

export interface CheckoutResult {
  receipt: SaleReceipt;
  total: number;
  /** Cambio a entregar al cliente. */
  change: number;
}

/**
 * Cobrar una venta: calcula el total con las mismas reglas que el servidor, comprueba que los pagos
 * lo cubren, deja el exceso como cambio (no como ingreso) y envía la venta con su clave de
 * idempotencia. Un reintento de la misma venta no la duplica.
 */
export class Checkout {
  constructor(
    private readonly repository: Pick<SalesRepository, 'processSale'>,
    private readonly attempts: CheckoutAttempt,
  ) {}

  async execute(command: CheckoutCommand): Promise<CheckoutResult> {
    if (command.lines.length === 0) throw new CheckoutError('EMPTY_CART', 'El carrito de compras está vacío.');

    const items = command.lines.map((line) => {
      const hasDiscount = (line.discountAmount ?? 0) > 0;
      return {
        variantId: line.variantId,
        quantity: line.quantity,
        price: line.price,
        discountType: hasDiscount ? line.discountType : undefined,
        discountRate: hasDiscount ? line.discountRate : undefined,
        discountAmount: Money.ofLine(line.discountAmount ?? 0, line.quantity).toNumber(),
      };
    });
    const globalAmount = command.globalDiscount?.amount ?? 0;
    const pricing = priceSale(items, globalAmount);

    const paid = command.payments.map((payment) => payment.amount);
    if (!paymentsCoverTotal(pricing.total, paid)) {
      throw new CheckoutError('INSUFFICIENT_PAYMENT', 'Los pagos no cubren el total de la venta.', remainingToPay(pricing.total, paid));
    }

    const hasGlobalDiscount = globalAmount > 0;
    const sale: ProcessSaleInput = {
      branchId: command.branchId,
      cashSessionId: command.cashSessionId,
      customerId: command.customerId,
      discountType: hasGlobalDiscount ? command.globalDiscount?.type : undefined,
      discountRate: hasGlobalDiscount ? command.globalDiscount?.rate : undefined,
      discountAmount: pricing.globalDiscountAmount,
      items,
      payments: allocatePayments(pricing.total, command.payments),
    };

    const fingerprint = checkoutFingerprint(sale);
    const receipt = await this.repository.processSale({ ...sale, clientRequestId: this.attempts.idFor(fingerprint) });
    this.attempts.complete(fingerprint);

    return { receipt, total: pricing.total, change: changeDue(pricing.total, paid) };
  }
}
