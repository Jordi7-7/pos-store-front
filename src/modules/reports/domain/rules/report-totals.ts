import { roundMoney } from '@/shared/domain/value-objects/money';
import type { ProductSaleRow, SalesCostReportRow, ValuedInventoryRow } from '../entities/report.entity';

export interface SalesCostTotals {
  pieces: number;
  sales: number;
  cost: number;
  difference: number;
}

/** Totales del informe de costo de ventas: piezas y los tres importes, redondeados al céntimo. */
export function salesCostTotals(rows: SalesCostReportRow[]): SalesCostTotals {
  const sum = (pick: (row: SalesCostReportRow) => number) => rows.reduce((total, row) => total + Number(pick(row) || 0), 0);
  return {
    pieces: sum((row) => row.pieces),
    sales: roundMoney(sum((row) => row.salePrice)),
    cost: roundMoney(sum((row) => row.costPrice)),
    difference: roundMoney(sum((row) => row.difference)),
  };
}

/** Piezas vendidas en total en el informe de ventas por producto. */
export const soldPieces = (rows: ProductSaleRow[]): number => rows.reduce((total, row) => total + Number(row.soldQuantity || 0), 0);

export interface InventoryTotals {
  quantity: number;
  totalValue: number;
}

/** Totales del inventario valuado: unidades y valor, redondeado al céntimo. */
export function inventoryTotals(rows: ValuedInventoryRow[]): InventoryTotals {
  return {
    quantity: rows.reduce((total, row) => total + Number(row.quantity || 0), 0),
    totalValue: roundMoney(rows.reduce((total, row) => total + Number(row.totalValue || 0), 0)),
  };
}
