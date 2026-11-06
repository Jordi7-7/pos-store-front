import { escapeHtml } from '@/shared/domain/rules/escape-html';
import type { Formatters } from '@/shared/presentation/formatting/formatters';
import type { ProductSaleRow } from '../../domain/entities/report.entity';
import { cell, reportDocumentHtml } from './report-document';

interface PrintContext {
  tenantName: string;
  period: string;
  printedOn: string;
}

/** Informe de ventas por producto listo para imprimir. */
export function productSalesPrintHtml(rows: ProductSaleRow[], soldTotal: number, fmt: Formatters, context: PrintContext): string {
  const rowsHtml = rows
    .map(
      (row) => `
    <tr style="border-top: 1px solid #e5e7eb;">
      <td style="font-family: monospace; font-weight: bold;">${escapeHtml(row.sku)}</td>
      ${cell(row.name, undefined, 'text-transform: uppercase;')}
      ${cell(fmt.dateTime(row.createdAt), undefined, 'font-size: 8.5px; color: #555;')}
      ${cell(row.soldQuantity, 'right', 'font-weight: bold;')}
      ${cell(row.currentStock, 'right')}
      ${cell(fmt.money(Number(row.salePrice)), 'right')}
    </tr>`,
    )
    .join('');

  return reportDocumentHtml({
    title: 'Reporte de Ventas por Producto',
    tenantName: context.tenantName,
    infoLines: [{ text: `Período: ${context.period}`, bold: true }],
    printedOn: context.printedOn,
    columns: [
      { label: 'SKU', width: 15 },
      { label: 'Nombre del Producto', width: 37 },
      { label: 'Fecha y Hora', width: 18 },
      { label: 'Vendidos', width: 10, align: 'right' },
      { label: 'Stock Actual', width: 10, align: 'right' },
      { label: 'Precio Vta.', width: 10, align: 'right' },
    ],
    rowsHtml,
    totalRowHtml: `<tr class="total-row"><td colspan="3" style="text-align: right; text-transform: uppercase;">Total Piezas Vendidas:</td>${cell(soldTotal, 'right')}${cell('-', 'right')}${cell('-', 'right')}</tr>`,
  });
}
