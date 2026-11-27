/** A qué se le puede poner una foto: un producto o una de sus variantes. */
export interface ImageTarget {
  kind: 'PRODUCT' | 'VARIANT';
  productId: string;
  variantId: string | null;
  productName: string;
  sku: string | null;
  /** Valores de la variante (`01`, `Rojo`); vacío si el destino es el producto. */
  attributes: string[];
}

export interface FileMatch {
  fileName: string;
  status: 'MATCHED' | 'AMBIGUOUS' | 'NOT_FOUND';
  candidates: ImageTarget[];
}

export interface ImageAssignment {
  imageId: string;
  productId?: string;
  variantId?: string;
}
