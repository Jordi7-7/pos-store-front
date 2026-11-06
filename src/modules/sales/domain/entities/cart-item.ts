import { DiscountType } from '@/modules/sales/domain/enums';
/** Producto tal como lo necesita el carrito al añadir una variante. */
export interface CartProductRef {
  id: string;
  name: string;
  /** `SIMPLE` o `VARIABLE`; un producto simple no muestra combinación de atributos. */
  type?: string;
}

/** Variante que se añade al carrito, con sus precios ya como número. */
export interface CartVariantRef {
  id: string;
  sku: string;
  salePrice: number;
  wholesalePrice?: number | null;
  attributes?: Array<{ name: string; value: string }>;
  imageUrl?: string | null;
}

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
