export enum ProductType {
  SIMPLE = 'SIMPLE',
  VARIABLE = 'VARIABLE',
}

export enum InventoryMovementType {
  IN = 'IN',
  OUT = 'OUT',
}

export enum BatchOriginType {
  PURCHASE = 'PURCHASE',
  INITIAL_STOCK = 'INITIAL_STOCK',
  ADJUSTMENT = 'ADJUSTMENT',
  REFUND = 'REFUND',
}

export enum BatchStatus {
  ACTIVE = 'ACTIVE',
  DEPLETED = 'DEPLETED',
  CANCELLED = 'CANCELLED',
}

export const BatchOriginLabels: Record<BatchOriginType, string> = {
  [BatchOriginType.PURCHASE]: 'Compra a proveedor',
  [BatchOriginType.INITIAL_STOCK]: 'Stock inicial',
  [BatchOriginType.ADJUSTMENT]: 'Ajuste manual',
  [BatchOriginType.REFUND]: 'Devolución de cliente',
};
