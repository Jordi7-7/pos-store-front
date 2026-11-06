/**
 * Un "intento de cobro" = una misma venta que se manda al servidor. Su `clientRequestId` es la
 * clave de idempotencia del backend: si el cobro se reintenta (doble clic, corte de red tras
 * enviar) con la MISMA clave devuelve la venta ya creada en vez de duplicarla.
 *
 * Regla: la clave se conserva mientras el contenido de la venta no cambie y no haya terminado;
 * si el cajero cambia el carrito o los pagos es otra venta y recibe una clave nueva (el backend
 * rechaza reutilizar una clave con una venta distinta); al confirmarse la venta se descarta.
 */
export class CheckoutAttempt {
  private current: { id: string; fingerprint: string } | null = null;

  constructor(private readonly newId: () => string) {}

  /** Clave para esta venta: la misma si es el mismo contenido que el intento en curso. */
  idFor(fingerprint: string): string {
    if (!this.current || this.current.fingerprint !== fingerprint) {
      this.current = { id: this.newId(), fingerprint };
    }
    return this.current.id;
  }

  /** La venta se confirmó: el siguiente cobro es otra venta. */
  complete(): void {
    this.current = null;
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
