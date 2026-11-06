import type { Formatters } from '@/shared/presentation/formatting/formatters';
import type { PurchaseEntity, PurchaseItemEntity } from '../../domain/entities/purchase.entity';
import type { SupplierEntity } from '../../domain/entities/supplier.entity';

/** Compras con los textos listos para mostrar (importes con la moneda de la tienda, fecha en su zona horaria). */

export type PurchaseItemVM = PurchaseItemEntity & { unitCostFormatted: string; subtotalFormatted: string };

export type PurchaseVM = Omit<PurchaseEntity, 'items'> & {
  items: PurchaseItemVM[];
  dateFormatted: string;
  totalFormatted: string;
};

export const toPurchaseVM = (purchase: PurchaseEntity, fmt: Formatters): PurchaseVM => ({
  ...purchase,
  invoiceNumber: purchase.invoiceNumber || 'S/Ref',
  supplierName: purchase.supplierName || 'Proveedor General',
  supplierIdentity: purchase.supplierIdentity || 'S/N',
  branchName: purchase.branchName || 'Sucursal Principal',
  dateFormatted: purchase.createdAt ? fmt.dateTime(purchase.createdAt) : 'Sin fecha',
  totalFormatted: fmt.money(purchase.totalAmount),
  items: purchase.items.map((item) => ({
    ...item,
    sku: item.sku || 'S/SKU',
    productName: item.productName || 'Producto Desconocido',
    unitCostFormatted: fmt.money(item.unitCost),
    subtotalFormatted: fmt.money(item.subtotal),
  })),
});

/** "Nombre (identificación)" para listas desplegables de proveedores. */
export const supplierDisplayText = (supplier: SupplierEntity): string =>
  `${supplier.name || 'Sin Nombre'} (${supplier.identityNumber || 'S/N'})`;
