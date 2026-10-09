export type ModalStep = 'search' | 'select-items' | 'choose-mode' | 'exchange' | 'confirm-refund';

export interface SaleItemRow {
  saleItemId: string;
  variantId: string;
  productName: string;
  sku: string;
  attributes: string;
  quantity: number;       // original quantity purchased
  refundedQty: number;    // already refunded in previous operations
  refundableQty: number;  // remaining available to refund
  price: number;          // unit price
  cost: number;
  discountAmount: number;
  lineTotal?: number;
}

export interface NewExchangeItem {
  variantId: string;
  productName: string;
  sku: string;
  attributes: string;
  quantity: number;
  price: number;  // salePrice from POS endpoint
  cost: number;
  discountType?: 'PERCENTAGE' | 'AMOUNT';
  discountRate?: number;
  discountAmount?: number; // unit discount amount
}

export const getNetUnitPrice = (item: SaleItemRow): number => {
  const qty = Number(item.quantity) || 1;
  const disc = Number(item.discountAmount) || 0;
  return Math.max(0, Number(item.price) - disc / qty);
};

export const formatMoney = (n: number) => {
  return `$${Number(n).toFixed(2)}`;
};
