/**
 * Un "intento de cobro" = una misma venta que se manda al servidor. Su `clientRequestId` es la
 * clave de idempotencia del backend: si el cobro se reintenta (doble clic, corte de red tras
 * enviar) con la MISMA clave devuelve la venta ya creada en vez de duplicarla.
 *
 * Regla: la clave se conserva mientras el contenido de la venta no cambie y no haya terminado;
 * si el cajero cambia el carrito o los pagos es otra venta y recibe una clave nueva (el backend
 * rechaza reutilizar una clave con una venta distinta); al confirmarse la venta se descarta.
 * Varios intentos pueden estar pendientes a la vez (p. ej. un cobro fallido y un cambio de producto).
 */
export class CheckoutAttempt {
  /** Intentos pendientes por huella; se acota para que los abandonados no se acumulen. */
  private readonly pending = new Map<string, string>();

  constructor(
    private readonly newId: () => string,
    private readonly maxPending = 20,
  ) {}

  /** Clave para esta venta: la misma si es el mismo contenido que un intento pendiente. */
  idFor(fingerprint: string): string {
    const existing = this.pending.get(fingerprint);
    if (existing) return existing;
    const id = this.newId();
    this.pending.set(fingerprint, id);
    if (this.pending.size > this.maxPending) {
      const oldest = this.pending.keys().next().value;
      if (oldest !== undefined) this.pending.delete(oldest);
    }
    return id;
  }

  /** La venta se confirmó: el siguiente cobro (aunque sea idéntico) es otra venta. */
  complete(fingerprint: string): void {
    this.pending.delete(fingerprint);
  }
}

/** Huella del contenido de la venta (todo menos la propia clave). */
export function checkoutFingerprint(sale: {
  branchId: string;
  cashSessionId: string;
  customerId?: string;
  discountAmount?: number;
  items: ReadonlyArray<{ variantId: string; quantity: number; price: number; discountAmount?: number }>;
  payments: ReadonlyArray<{ paymentMethod: string; amount: number; referenceNumber?: string }>;
}): string {
  return JSON.stringify([
    sale.branchId,
    sale.cashSessionId,
    sale.customerId ?? null,
    sale.discountAmount ?? 0,
    sale.items.map((i) => [i.variantId, i.quantity, i.price, i.discountAmount ?? 0]),
    sale.payments.map((p) => [p.paymentMethod, p.amount, p.referenceNumber ?? null]),
  ]);
}
