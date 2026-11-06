import { describe, expect, it } from 'vitest';
import { createFormatters } from '@/shared/presentation/formatting/formatters';
import type { SalesCostReportRow } from '../../domain/entities/report.entity';
import { salesCostPrintHtml, salesCostCsv } from './sales-cost.export';

const fmt = createFormatters({ currencyCode: 'USD', locale: 'es-EC', timezone: 'America/Guayaquil' });
const totals = { pieces: 2, sales: 20, cost: 12, difference: 8 };
const row: SalesCostReportRow = {
  id: '1', invoiceNumber: 'F-1', createdAt: '2026-01-02T15:00:00Z', clientName: '<img src=x onerror=alert(1)>', pieces: 2, salePrice: 20, costPrice: 12, difference: 8, status: 'COMPLETED',
  items: [{ id: 'i', variantId: 'v', productName: 'Tom & <b>Jerry</b>', sku: 'A"1', quantity: 2, refundedQuantity: 0, netQuantity: 2, unitCost: 6, totalCost: 12, unitPrice: 10, discountAmount: 0, totalPrice: 20, profit: 8 }],
};

describe('informe de costo de ventas impreso', () => {
  const html = salesCostPrintHtml([row], totals, fmt, { tenantName: 'Mi <Tienda>', period: '01/01 al 02/01', printedOn: '05/01/2026' });

  it('escapa los datos de la base: un cliente o producto con HTML no inyecta etiquetas', () => {
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('<b>Jerry</b>');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('Tom &amp; &lt;b&gt;Jerry&lt;/b&gt;');
    expect(html).toContain('Mi &lt;Tienda&gt;');
  });

  it('incluye factura, importes con la moneda de la tienda y el gran total', () => {
    expect(html).toContain('F-1');
    expect(html).toContain(fmt.money(20));
    expect(html).toContain('Gran total...');
  });
});

describe('csv de costo de ventas', () => {
  it('una línea por venta, otra por producto y el total, con comillas duplicadas', () => {
    const lines = salesCostCsv([row], totals, fmt).split('\n');
    expect(lines).toHaveLength(4);
    expect(lines[2]).toContain('"A""1"');
    expect(lines[3]).toContain('"TOTAL"');
    expect(lines[3]).toContain('"20.00"');
  });
});
