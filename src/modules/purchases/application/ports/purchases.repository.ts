import type { PurchaseEntity } from '../../domain/entities/purchase.entity';
import type { PaginatedResult } from '@/shared/domain/value-objects/paginated';

export interface RegisterPurchaseInput {
  supplierId?: string;
  branchId: string;
  invoiceNumber?: string;
  items: { variantId: string; quantity: number; purchasePrice: number }[];
}

export interface PurchasesQuery {
  branchId?: string;
  startDate?: string;
  endDate?: string;
  supplierId?: string;
  page?: number;
  limit?: number;
}

export interface BulkPurchaseItemInput {
  sku: string;
  quantity: number;
  cost?: number;
}

export interface ImportValidationItem {
  sku: string;
  quantity: number;
}

/** Errores y nombres de producto por SKU tras validar una importación. */
export interface ImportValidation {
  errors: Record<string, string>;
  names: Record<string, string>;
}

export interface BulkImportInput {
  branchId: string;
  items: BulkPurchaseItemInput[];
  invoiceNumber?: string;
  supplierId?: string;
}

/** Puerto de salida: compras de mercancía y su importación masiva. */
export interface PurchasesRepository {
  list(query?: PurchasesQuery): Promise<PaginatedResult<PurchaseEntity>>;
  register(input: RegisterPurchaseInput): Promise<PurchaseEntity>;
  cancel(id: string): Promise<void>;
  validateImport(items: ImportValidationItem[]): Promise<ImportValidation>;
  import(input: BulkImportInput): Promise<PurchaseEntity>;
}
