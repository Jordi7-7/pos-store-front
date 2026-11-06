import { PaymentMethod } from '../domain/enums';
import { newItemsTotal } from '../domain/rules/exchange-rules';
import type { Checkout, CheckoutLine } from './checkout';
import type { RefundSale } from './refund-sale';

export class ExchangeError extends Error {
  constructor(
    readonly code: 'EMPTY_EXCHANGE' | 'REFUND_DONE_SALE_FAILED',
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'ExchangeError';
  }
}

export interface ExchangeCommand {
  branchId: string;
  cashSessionId: string;
  saleId: string;
  customerId?: string;
  returned: Array<{ variantId: string; quantity: number }>;
  reason: string;
  newLines: readonly CheckoutLine[];
}

/**
 * Cambio de producto: devuelve lo que trae el cliente y cobra lo nuevo. Son dos operaciones del
 * servidor; si falla la segunda la devolución ya está registrada, y se avisa con un error propio
 * para que el cajero no repita la devolución y cobre lo nuevo como una venta normal.
 */
export class ExchangeProducts {
  constructor(
    private readonly refund: Pick<RefundSale, 'execute'>,
    private readonly checkout: Pick<Checkout, 'execute'>,
  ) {}

  async execute(command: ExchangeCommand): Promise<{ newItemsTotal: number }> {
    if (command.newLines.length === 0) throw new ExchangeError('EMPTY_EXCHANGE', 'Agrega al menos un producto nuevo para el cambio.');

    await this.refund.execute({
      branchId: command.branchId,
      saleId: command.saleId,
      cashSessionId: command.cashSessionId,
      reason: command.reason,
      defaultReason: 'Cambio de prenda',
      items: command.returned,
    });

    const total = newItemsTotal(command.newLines);
    try {
      await this.checkout.execute({
        branchId: command.branchId,
        cashSessionId: command.cashSessionId,
        customerId: command.customerId,
        lines: command.newLines,
        payments: [{ paymentMethod: PaymentMethod.EFECTIVO, amount: total }],
      });
    } catch (error) {
      throw new ExchangeError(
        'REFUND_DONE_SALE_FAILED',
        'La devolución ya quedó registrada, pero no se pudo cobrar el producto nuevo. No repitas la devolución: cobra el producto nuevo como una venta normal.',
        { cause: error },
      );
    }
    return { newItemsTotal: total };
  }
}
