import { escapeHtml } from '@/shared/domain/rules/escape-html';
import { toCsv } from '@/shared/domain/rules/csv';
import type { Formatters } from '@/shared/presentation/formatting/formatters';
import type { SalesCostReportRow } from '../../domain/entities/report.entity';
import type { SalesCostTotals } from '../../domain/rules/report-totals';
import { cell, reportDocumentHtml } from './report-document';

interface PrintContext {
  tenantName: string;
  period: string;
  printedOn: string;
}

const money = (fmt: Formatters, value: number) => fmt.money(Number(value));

function itemRowsHtml(row: SalesCostReportRow, fmt: Formatters): string {
  if (!row.items || row.items.length === 0) return '';
  const items = row.items
    .map(
      (item) => `
      <tr style="background-color: #fafafa; font-size: 8.5px; color: #555;">
        <td style="padding-left: 14px;">↳ ${item.sku ? `[${escapeHtml(item.sku)}] ` : ''}${escapeHtml(item.productName)}</td>
        <td></td>
        ${cell(`Costo U: ${fmt.money(item.unitCost)} | Venta U: ${fmt.money(item.unitPrice)}`, 'right')}
        ${cell(item.quantity, 'right')}
        ${cell(fmt.money(item.totalPrice), 'right')}
        ${cell(fmt.money(item.totalCost), 'right')}
        ${cell(fmt.money(item.profit), 'right')}
      </tr>`,
    )
    .join('');
  return `
    <tr style="background-color: #f0f0f0; font-size: 8px; font-weight: bold; color: #666;">
      <td colspan="7" style="padding-left: 14px; text-transform: uppercase;">Detalle de productos:</td>
    </tr>${items}`;
}

/** Informe de costo de ventas listo para imprimir. Todo dato de la base se escapa antes de entrar en el HTML. */
export function salesCostPrintHtml(rows: SalesCostReportRow[], totals: SalesCostTotals, fmt: Formatters, context: PrintContext): string {
  const rowsHtml = rows
    .map(
      (row) => `
    <tr style="border-top: 1px solid #ccc; font-weight: 500;">
      <td><strong>${escapeHtml(row.invoiceNumber)}</strong></td>
      ${cell(fmt.shortDate(row.createdAt))}
      ${cell(row.clientName, undefined, 'text-transform: uppercase;')}
      ${cell(Math.floor(row.pieces), 'right')}
      ${cell(money(fmt, row.salePrice), 'right')}
      ${cell(money(fmt, row.costPrice), 'right')}
      ${cell(money(fmt, row.difference), 'right')}
    </tr>${itemRowsHtml(row, fmt)}`,
    )
    .join('');

  return reportDocumentHtml({
    title: 'Resumen de costo de ventas por documentos',
    tenantName: context.tenantName,
    infoLines: [{ text: 'Documentos: Factura (Solo completadas)' }, { text: `Período: ${context.period}`, bold: true }],
    printedOn: context.printedOn,
    columns: [
      { label: 'Factura', width: 15 },
      { label: 'Fecha', width: 10 },
      { label: 'Cliente', width: 30 },
      { label: 'Pzas', width: 9, align: 'right' },
      { label: 'Precio de venta', width: 12, align: 'right' },
      { label: 'Precio de costo', width: 12, align: 'right' },
      { label: 'Diferencia', width: 12, align: 'right' },
    ],
    rowsHtml,
    totalRowHtml: `<tr class="total-row"><td colspan="3">Gran total...</td>${cell(Math.floor(totals.pieces), 'right')}${cell(money(fmt, totals.sales), 'right')}${cell(money(fmt, totals.cost), 'right')}${cell(money(fmt, totals.difference), 'right')}</tr>`,
  });
}

/** CSV del informe: una línea por venta, seguida de una por cada producto vendido, y el gran total. */
export function salesCostCsv(rows: SalesCostReportRow[], totals: SalesCostTotals, fmt: Formatters): string {
  const headers = ['Tipo', 'Factura', 'Fecha', 'Cliente / Producto', 'SKU', 'Pzas', 'Costo Unit.', 'Precio Unit.', 'Total Venta', 'Total Costo', 'Diferencia / Margen'];
  const lines: Array<Array<string | number>> = [];
  for (const row of rows) {
    lines.push(['VENTA', row.invoiceNumber, fmt.shortDate(row.createdAt), row.clientName, '', Math.floor(row.pieces), '', '', Number(row.salePrice).toFixed(2), Number(row.costPrice).toFixed(2), Number(row.difference).toFixed(2)]);
    for (const item of row.items ?? []) {
      lines.push(['PRODUCTO', row.invoiceNumber, '', item.productName, item.sku, item.quantity, item.unitCost.toFixed(2), item.unitPrice.toFixed(2), item.totalPrice.toFixed(2), item.totalCost.toFixed(2), item.profit.toFixed(2)]);
    }
  }
  lines.push(['TOTAL', 'Gran total...', '', '', '', Math.floor(totals.pieces), '', '', totals.sales.toFixed(2), totals.cost.toFixed(2), totals.difference.toFixed(2)]);
  return toCsv(headers, lines);
}
