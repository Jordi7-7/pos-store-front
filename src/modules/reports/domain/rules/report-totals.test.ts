import { describe, expect, it } from 'vitest';
import type { SalesCostReportRow, ValuedInventoryRow } from '../entities/report.entity';
import { inventoryTotals, salesCostTotals, soldPieces } from './report-totals';

const sale = (pieces: number, salePrice: number, costPrice: number, difference: number): SalesCostReportRow => ({
  id: 'x', invoiceNumber: 'F', createdAt: '', clientName: '', pieces, salePrice, costPrice, difference, status: 'COMPLETED',
});

describe('totales de informes', () => {
  it('costo de ventas: suma y redondea al céntimo (0.1 + 0.2 no arrastra decimales)', () => {
    expect(salesCostTotals([sale(1, 0.1, 0.05, 0.05), sale(2, 0.2, 0.1, 0.1)])).toEqual({ pieces: 3, sales: 0.3, cost: 0.15, difference: 0.15 });
    expect(salesCostTotals([])).toEqual({ pieces: 0, sales: 0, cost: 0, difference: 0 });
  });

  it('piezas vendidas ignora valores ausentes', () => {
    expect(soldPieces([{ soldQuantity: 2 }, { soldQuantity: Number.NaN }, { soldQuantity: 3 }] as never)).toBe(5);
  });

  it('inventario valuado: unidades y valor redondeado', () => {
    const rows = [{ quantity: 2, totalValue: 0.1 }, { quantity: 1, totalValue: 0.2 }] as ValuedInventoryRow[];
    expect(inventoryTotals(rows)).toEqual({ quantity: 3, totalValue: 0.3 });
  });
});
