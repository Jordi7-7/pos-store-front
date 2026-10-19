export interface PurchaseItemEntity {
  id: string;
  variantId: string;
  sku: string;
  productName: string;
  quantity: number;
  purchasePrice: number;
  formattedPurchasePrice: string;
  unitCost: number;
  formattedUnitCost: string;
  subtotal: number;
  formattedSubtotal: string;
}

export interface PurchaseEntity {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  formattedDate: string;
  status: string;
  statusLabel: string;
  statusBadgeVariant: 'success' | 'destructive' | 'secondary' | 'outline';
  totalAmount: number;
  formattedTotalAmount: string;
  isCancellable: boolean;
  supplierName: string;
  supplierIdentity: string;
  branchName: string;
  branchId: string;
  items: PurchaseItemEntity[];
  totalUnits: number;
}
