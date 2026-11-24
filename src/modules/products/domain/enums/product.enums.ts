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
  TRANSFER = 'TRANSFER',
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
  [BatchOriginType.TRANSFER]: 'Traslado entre sucursales',
};

/** Motivos que el backend guarda en el kardex (`reason`). Un motivo desconocido se muestra tal cual. */
export enum InventoryMovementReason {
  INITIAL_STOCK = 'INITIAL_STOCK',
  PURCHASE = 'COMPRA',
  REFUND = 'DEVOLUCION',
  SALE = 'VENTA',
  PURCHASE_CANCELLATION = 'ANULACION_COMPRA',
  ADJUSTMENT = 'ADJUSTMENT',
  DONATION = 'DONACION',
  PRODUCTION = 'PRODUCCION',
  DAMAGE = 'MERMA',
  LOSS = 'PERDIDA',
  INTERNAL_USE = 'USO_INTERNO',
  PHYSICAL_COUNT = 'CONTEO_FISICO',
  OTHER = 'OTRO',
  SUPPLIER_RETURN = 'DEVOLUCION_PROVEEDOR',
  TRANSFER = 'TRASLADO',
}

/** Clase de operación de cada línea del kardex: la única clasificación para filtrar el historial (el motivo solo detalla los ajustes). */
export enum InventoryMovementCategory {
  INITIAL = 'INITIAL',
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  RETURN = 'RETURN',
  ADJUSTMENT = 'ADJUSTMENT',
  COUNT = 'COUNT',
  TRANSFER = 'TRANSFER',
}

export const InventoryMovementCategoryLabels: Record<InventoryMovementCategory, string> = {
  [InventoryMovementCategory.INITIAL]: 'Stock inicial',
  [InventoryMovementCategory.PURCHASE]: 'Compras',
  [InventoryMovementCategory.SALE]: 'Ventas',
  [InventoryMovementCategory.RETURN]: 'Devoluciones',
  [InventoryMovementCategory.ADJUSTMENT]: 'Entradas y salidas manuales',
  [InventoryMovementCategory.COUNT]: 'Conteos',
  [InventoryMovementCategory.TRANSFER]: 'Traslados',
};

/** Entrada o salida manual: lo que entra o sale de una sucursal. */
export enum InventoryDocumentKind {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
  /** Conteo físico: cada línea es la diferencia entre lo contado y lo que decía el sistema. */
  COUNT = 'COUNT',
  /** Traslado entre sucursales: sale del origen y entra al destino en la misma operación. */
  TRANSFER = 'TRANSFER',
}

export const InventoryMovementReasonLabels: Record<InventoryMovementReason, string> = {
  [InventoryMovementReason.INITIAL_STOCK]: 'Stock inicial',
  [InventoryMovementReason.PURCHASE]: 'Compra',
  [InventoryMovementReason.REFUND]: 'Devolución de cliente',
  [InventoryMovementReason.SALE]: 'Venta',
  [InventoryMovementReason.PURCHASE_CANCELLATION]: 'Anulación de compra',
  [InventoryMovementReason.ADJUSTMENT]: 'Ajuste manual',
  [InventoryMovementReason.DONATION]: 'Donación',
  [InventoryMovementReason.PRODUCTION]: 'Producción propia',
  [InventoryMovementReason.DAMAGE]: 'Merma o caducidad',
  [InventoryMovementReason.LOSS]: 'Pérdida o robo',
  [InventoryMovementReason.INTERNAL_USE]: 'Uso interno o muestras',
  [InventoryMovementReason.PHYSICAL_COUNT]: 'Conteo físico',
  [InventoryMovementReason.OTHER]: 'Otro',
  [InventoryMovementReason.SUPPLIER_RETURN]: 'Devolución a proveedor',
  [InventoryMovementReason.TRANSFER]: 'Traslado',
};
