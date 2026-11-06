/** Catálogo de apoyo de los productos: categorías, atributos (talla, color…) y etiquetas. */

export interface CategoryEntity {
  id: string;
  name: string;
}

export interface TagEntity {
  id: string;
  name: string;
}

export interface AttributeValueEntity {
  id: string;
  attributeId: string;
  value: string;
}

export interface AttributeEntity {
  id: string;
  name: string;
  values: AttributeValueEntity[];
}

/** Variante encontrada por SKU (para compras). */
export interface VariantLookup {
  id: string;
  sku: string;
  purchasePrice: number;
  productName: string;
}

/** Variante disponible para vender en una sucursal, con su existencia ahí. */
export interface PosVariantEntity {
  id: string;
  sku: string;
  barcode?: string;
  productName: string;
  productType?: string;
  purchasePrice: number;
  salePrice: number;
  wholesalePrice?: number | null;
  stock: number;
  imageUrl?: string | null;
  attributes?: Array<{ name: string; value: string }>;
  attributeValues?: Array<{ id?: string; value: string; attribute?: { id?: string; name: string } }>;
}

/** Producto variable con todas sus variantes, para elegir una (la búsqueda por SKU base). */
export interface PosVariableProductEntity {
  productId: string;
  productName: string;
  baseSku: string | null;
  description?: string;
  imageUrl?: string | null;
  productType?: string;
  attributes: Array<{ id: string; name: string; values: Array<{ id: string; value: string }> }>;
  variants: Array<{
    id: string;
    sku: string;
    barcode: string;
    purchasePrice: number;
    salePrice: number;
    wholesalePrice: number | null;
    stock: number;
    imageUrl?: string | null;
    attributes?: Array<{ name: string; value: string }>;
    attributeValues: Array<{ attributeId: string; attributeName: string; valueId: string; valueName: string }>;
  }>;
}

/** Resultado de buscar por código en el POS: variantes que coinciden, o un producto variable por su SKU base. */
export type PosSearchResult =
  | { kind: 'variants'; variants: PosVariantEntity[] }
  | { kind: 'variable-product'; product: PosVariableProductEntity };

/** Variante recién creada en un producto existente. */
export interface CreatedVariantEntity {
  id: string;
  sku: string;
  barcode: string;
  purchasePrice: number;
  salePrice: number;
  wholesalePrice: number | null;
  attributes: Array<{ name: string; value: string }>;
  images: Array<{ id: string; url: string; description?: string }>;
}
