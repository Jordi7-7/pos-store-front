/** Historial de una variante: en qué ventas y compras ha participado. */

interface HistoryVariant {
  id: string;
  sku: string;
  attributeValues?: { id?: string; value: string }[];
  product?: { name: string };
}

export interface ProductHistorySaleItem {
  id: string;
  quantity: number;
  price: number;
  subtotal?: number;
  total?: number;
  variant?: HistoryVariant;
}

export interface ProductHistorySale {
  id: string;
  invoiceNumber?: string | null;
  createdAt: string;
  total: number;
  customer?: { name?: string } | null;
  payments?: { paymentMethod?: string; amount?: number }[];
  items?: ProductHistorySaleItem[];
}

export interface ProductHistoryPurchaseItem {
  id: string;
  quantity: number;
  unitPrice: number;
  total?: number;
  variant?: HistoryVariant;
}

export interface ProductHistoryPurchase {
  id: string;
  invoiceNumber?: string | null;
  createdAt: string;
  totalAmount: number;
  supplier?: { name?: string } | null;
  branch?: { name?: string } | null;
  items?: ProductHistoryPurchaseItem[];
}
