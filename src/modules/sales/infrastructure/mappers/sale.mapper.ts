import type { PaginatedSaleSummaryDTO, SaleDetailDTO, SaleDetailItemDTO } from '../dtos/sales.dto';
import type { SaleSummaryEntity, SaleDetailEntity, SaleDetailItemEntity } from '../../domain/entities/sale.entity';
import { SaleStatus } from '../../domain/enums';

export const toSaleSummaryEntity = (dto: PaginatedSaleSummaryDTO): SaleSummaryEntity => {
  const total = Number(dto.total || 0);
  const discountAmount = Number(dto.discountAmount || 0);
  const dateObj = new Date(dto.createdAt);

  const status = Object.values(SaleStatus).includes(dto.status as SaleStatus)
    ? (dto.status as SaleStatus)
    : SaleStatus.COMPLETED;

  return {
    id: dto.id,
    invoiceNumber: dto.invoiceNumber || 'S/N',
    createdAt: dateObj,
    total,
    discountAmount,
    status,
    customerName: dto.customer?.name?.trim() || 'Consumidor Final',
    branchName: dto.branch?.name || 'Sucursal Principal',
  };
};

export const toSaleSummaryEntities = (dtos: PaginatedSaleSummaryDTO[]): SaleSummaryEntity[] =>
  dtos.map(toSaleSummaryEntity);

export const toSaleDetailItemEntity = (dto: SaleDetailItemDTO): SaleDetailItemEntity => {
  const price = Number(dto.price || 0);
  const lineTotal = Number(dto.lineTotal || 0);

  return {
    saleItemId: dto.saleItemId,
    variantId: dto.variantId,
    productName: dto.productName || 'Producto',
    sku: dto.sku || '',
    attributes: dto.attributes || '',
    quantity: Number(dto.quantity || 0),
    refundedQty: Number(dto.refundedQty || 0),
    refundableQty: Number(dto.refundableQty || 0),
    price,
    cost: Number(dto.cost || 0),
    discountAmount: Number(dto.discountAmount || 0),
    lineTotal,
  };
};

export const toSaleDetailEntity = (dto: SaleDetailDTO): SaleDetailEntity => {
  const total = Number(dto.total || 0);
  const subtotal = Number(dto.subtotal || 0);
  const discountAmount = Number(dto.discountAmount || 0);
  const dateObj = new Date(dto.createdAt);

  const items = (dto.items || []).map(toSaleDetailItemEntity);
  const totalPieces = items.reduce((acc, it) => acc + it.quantity, 0);

  const payments = (dto.payments || []).map((p) => {
    const amount = Number(p.amount || 0);
    return {
      id: p.id,
      paymentMethod: p.paymentMethod,
      amount,
    };
  });

  const refunds = (dto.refunds || []).map((r) => {
    const rDateObj = new Date(r.createdAt);
    const rTotal = Number(r.totalRefunded || 0);
    return {
      id: r.id,
      createdAt: rDateObj,
      reason: r.reason || 'Sin motivo',
      totalRefunded: rTotal,
      items: (r.items || []).map((ri) => {
        const pRef = Number(ri.priceRefunded || 0);
        return {
          id: ri.id,
          variantId: ri.variantId,
          sku: ri.sku || '',
          productName: ri.productName || 'Producto',
          quantity: Number(ri.quantity || 0),
          priceRefunded: pRef,
        };
      }),
    };
  });

  return {
    id: dto.id,
    invoiceNumber: dto.invoiceNumber || 'S/N',
    createdAt: dateObj,
    total,
    subtotal,
    discountAmount,
    itemsDiscountAmount: dto.itemsDiscountAmount !== undefined ? Number(dto.itemsDiscountAmount) : undefined,
    globalDiscountAmount: dto.globalDiscountAmount !== undefined ? Number(dto.globalDiscountAmount) : undefined,
    status: Object.values(SaleStatus).includes(dto.status as SaleStatus)
      ? (dto.status as SaleStatus)
      : SaleStatus.COMPLETED,
    branchName: dto.branch?.name || 'Sucursal Principal',
    branchAddress: dto.branch?.address || '',
    customerName: dto.customer?.name?.trim() || 'Consumidor Final',
    userName: dto.user?.name || 'Cajero',
    items,
    payments,
    refunds,
    totalPieces,
  };
};
