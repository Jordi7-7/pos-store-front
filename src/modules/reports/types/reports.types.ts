export interface SalesCostItemDetail {
  id: string;
  variantId: string;
  productName: string;
  sku: string;
  quantity: number;
  refundedQuantity: number;
  netQuantity: number;
  unitCost: number;
  totalCost: number;
  unitPrice: number;
  discountAmount: number;
  totalPrice: number;
  profit: number;
}

export interface SalesCostReportRow {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  clientName: string;
  pieces: number;
  salePrice: number;
  costPrice: number;
  difference: number;
  status: string;
  items?: SalesCostItemDetail[];
}

export interface ValuedInventoryRow {
  sku: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  totalValue: number;
}

export interface ProductSaleRow {
  variantId: string;
  sku: string;
  name: string;
  soldQuantity: number;
  currentStock: number;
  salePrice: number;
  totalRevenue: number;
  createdAt: string;
  invoiceNumber?: string;
}


