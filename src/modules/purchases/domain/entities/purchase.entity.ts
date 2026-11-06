export interface PurchaseItemEntity {
  id: string;
  variantId: string;
  sku: string;
  productName: string;
  quantity: number;
  purchasePrice: number;
  unitCost: number;
  subtotal: number;
}

export interface PurchaseEntity {
  id: string;
  invoiceNumber: string;
  /** Fecha ISO tal como la envía el servidor; se formatea en el view-model. */
  createdAt: string;
  status: string;
  totalAmount: number;
  /** Solo si está completada y no se ha vendido ninguna unidad. */
  isCancellable: boolean;
  supplierName: string;
  supplierIdentity: string;
  branchName: string;
  branchId: string;
  items: PurchaseItemEntity[];
  totalUnits: number;
}
