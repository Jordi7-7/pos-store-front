/** Estados de una compra. El servidor los guarda como texto; aquí viven los que la web distingue. */
export enum PurchaseStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}
