import type { PurchaseDto, PurchaseItemDto } from '../dtos/purchase.dto';
import type { PurchaseEntity, PurchaseItemEntity } from '../../domain/entities/purchase.entity';
import { roundMoney } from '@/shared/domain/value-objects/money';

export const toPurchaseItemEntity = (dto: PurchaseItemDto): PurchaseItemEntity => {
  const purchasePrice = Number(dto.purchasePrice ?? 0);
  const quantity = Number(dto.quantity ?? 0);
  return {
    id: dto.id || '',
    variantId: dto.variant?.id || '',
    sku: dto.variant?.sku || '',
    productName: dto.variant?.product?.name || '',
    quantity,
    purchasePrice,
    unitCost: Number(dto.unitCost ?? purchasePrice),
    subtotal: roundMoney(purchasePrice * quantity),
  };
};

export const toPurchaseEntity = (dto: PurchaseDto): PurchaseEntity => {
  const items = (dto.items || []).map(toPurchaseItemEntity);
  return {
    id: dto.id || '',
    invoiceNumber: dto.invoiceNumber || '',
    createdAt: dto.createdAt || '',
    status: dto.status || '',
    totalAmount: Number(dto.totalAmount ?? 0),
    isCancellable: Boolean(dto.isCancellable),
    supplierName: dto.supplier?.name || '',
    supplierIdentity: dto.supplier?.identityNumber || '',
    branchName: dto.branch?.name || '',
    branchId: dto.branch?.id || '',
    items,
    totalUnits: items.reduce((sum, item) => sum + item.quantity, 0),
  };
};
