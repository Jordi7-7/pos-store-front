import type { Purchase, PurchaseItem } from '../types/purchases.types';
import type { PurchaseEntity, PurchaseItemEntity } from '../entities/purchase.entity';

const currencyFormatter = new Intl.NumberFormat('es-EC', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

export const toPurchaseItemEntity = (dto: PurchaseItem): PurchaseItemEntity => {
  const purchasePrice = Number(dto.purchasePrice ?? 0);
  const unitCost = Number(dto.unitCost ?? purchasePrice);
  const quantity = Number(dto.quantity ?? 0);
  const subtotal = purchasePrice * quantity;

  return {
    id: dto.id || '',
    variantId: dto.variant?.id || '',
    sku: dto.variant?.sku || 'S/SKU',
    productName: dto.variant?.product?.name || 'Producto Desconocido',
    quantity,
    purchasePrice,
    formattedPurchasePrice: currencyFormatter.format(purchasePrice),
    unitCost,
    formattedUnitCost: currencyFormatter.format(unitCost),
    subtotal,
    formattedSubtotal: currencyFormatter.format(subtotal),
  };
};

export const toPurchaseEntity = (dto: Purchase): PurchaseEntity => {
  const totalAmount = Number(dto.totalAmount ?? 0);
  const items = (dto.items || []).map(toPurchaseItemEntity);
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);

  let formattedDate = '';
  try {
    formattedDate = dto.createdAt ? new Date(dto.createdAt).toLocaleString('es-EC') : 'Sin fecha';
  } catch {
    formattedDate = dto.createdAt || 'Sin fecha';
  }

  let statusLabel = dto.status || 'DESCONOCIDO';
  let statusBadgeVariant: PurchaseEntity['statusBadgeVariant'] = 'outline';

  if (dto.status === 'COMPLETED') {
    statusLabel = 'Completado';
    statusBadgeVariant = 'success';
  } else if (dto.status === 'CANCELLED') {
    statusLabel = 'Cancelado';
    statusBadgeVariant = 'destructive';
  } else if (dto.status === 'PENDING') {
    statusLabel = 'Pendiente';
    statusBadgeVariant = 'secondary';
  }

  return {
    id: dto.id || '',
    invoiceNumber: dto.invoiceNumber || 'S/N',
    createdAt: dto.createdAt || '',
    formattedDate,
    status: dto.status || '',
    statusLabel,
    statusBadgeVariant,
    totalAmount,
    formattedTotalAmount: currencyFormatter.format(totalAmount),
    isCancellable: Boolean(dto.isCancellable),
    supplierName: dto.supplier?.name || 'Proveedor General',
    supplierIdentity: dto.supplier?.identityNumber || 'S/N',
    branchName: dto.branch?.name || 'Sucursal Principal',
    branchId: dto.branch?.id || '',
    items,
    totalUnits,
  };
};

export const toPurchaseEntities = (dtos: Purchase[]): PurchaseEntity[] =>
  (dtos || []).map(toPurchaseEntity);
