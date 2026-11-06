import type { ProcessRefundInput, SalesRepository } from '../ports/sales.repository';

export class RefundSaleError extends Error {
  readonly code = 'NOTHING_TO_REFUND';
  constructor() {
    super('Selecciona al menos un producto con cantidad para devolver.');
    this.name = 'RefundSaleError';
  }
}

export interface RefundSaleCommand {
  branchId: string;
  saleId: string;
  cashSessionId: string;
  /** Motivo escrito por el cajero; si está vacío se usa `defaultReason`. */
  reason: string;
  defaultReason: string;
  items: Array<{ variantId: string; quantity: number }>;
}

/** Devolver productos de una venta. Ignora las líneas con cantidad 0 y exige al menos una. */
export class RefundSale {
  constructor(private readonly repository: Pick<SalesRepository, 'processRefund'>) {}

  async execute(command: RefundSaleCommand): Promise<void> {
    const items = command.items.filter((item) => item.quantity > 0);
    if (items.length === 0) throw new RefundSaleError();

    const request: ProcessRefundInput = {
      branchId: command.branchId,
      saleId: command.saleId,
      cashSessionId: command.cashSessionId,
      reason: command.reason.trim() || command.defaultReason,
      items,
    };
    await this.repository.processRefund(request);
  }
}
