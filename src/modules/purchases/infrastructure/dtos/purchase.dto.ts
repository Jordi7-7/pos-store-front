/** Forma de las respuestas del backend para compras y proveedores. */

export interface SupplierDto {
  id: string;
  identityNumber: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface PurchaseItemDto {
  id: string;
  quantity: number;
  purchasePrice: number;
  unitCost?: number;
  variant: {
    id: string;
    sku: string;
    product: {
      name: string;
    };
  };
}

export interface PurchaseDto {
  id: string;
  invoiceNumber?: string;
  createdAt: string;
  status: string;
  totalAmount: number;
  isCancellable: boolean;
  supplier?: SupplierDto | null;
  branch?: {
    id: string;
    name: string;
  } | null;
  items: PurchaseItemDto[];
}

export interface PaginatedPurchasesDto {
  data: PurchaseDto[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
