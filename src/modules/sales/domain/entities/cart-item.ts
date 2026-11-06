import { DiscountType } from '@/modules/sales/domain/enums';
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
  discountType?: DiscountType;
  discountRate?: number;
  discountAmount?: number;
}
