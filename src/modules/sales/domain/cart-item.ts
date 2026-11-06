export interface CartItem {
  cartItemId: string;
  variantId: string;
  productId: string;
  productName: string;
  variantSku: string;
  combinationText: string;
  price: number;
  unitSalePrice: number;
  wholesalePrice?: number | null;
  isWholesale?: boolean;
  quantity: number;
  imageUrl?: string;
  maxStock: number;
  discountType?: 'PERCENTAGE' | 'AMOUNT';
  discountRate?: number;
  discountAmount?: number;
}
