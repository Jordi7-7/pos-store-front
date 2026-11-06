import { escapeHtml } from '@/shared/domain/rules/escape-html';
import { toCsv } from '@/shared/domain/rules/csv';
import type { Formatters } from '@/shared/presentation/formatting/formatters';
import type { ValuedInventoryRow } from '../../domain/entities/report.entity';
import type { InventoryTotals } from '../../domain/rules/report-totals';
import { cell, reportDocumentHtml } from './report-document';

/** Existencias valuadas listas para imprimir. */
export function valuedInventoryPrintHtml(rows: ValuedInventoryRow[], totals: InventoryTotals, fmt: Formatters, context: { tenantName: string; printedOn: string }): string {
  const rowsHtml = rows
    .map(
      (row) => `
    <tr>
      <td>${escapeHtml(row.sku)}</td>
      ${cell(row.name, undefined, 'text-transform: uppercase;')}
      ${cell(Math.floor(row.quantity), 'right')}
      ${cell(fmt.money(Number(row.purchasePrice)), 'right')}
      ${cell(fmt.money(Number(row.totalValue)), 'right')}
    </tr>`,
    )
    .join('');

  return reportDocumentHtml({
    title: 'Reporte de Existencias Valuadas',
    tenantName: context.tenantName,
    infoLines: [{ text: 'Valores consolidados de inventario actual' }],
    printedOn: context.printedOn,
    columns: [
      { label: 'SKU', width: 20 },
      { label: 'Nombre', width: 45 },
      { label: 'Cantidad', width: 10, align: 'right' },
      { label: 'Precio de compra', width: 12, align: 'right' },
      { label: 'Total', width: 13, align: 'right' },
    ],
    rowsHtml,
    totalRowHtml: `<tr class="total-row"><td colspan="2">Gran total...</td>${cell(Math.floor(totals.quantity), 'right')}${cell('-', 'right')}${cell(fmt.money(Number(totals.totalValue)), 'right')}</tr>`,
  });
}

export function valuedInventoryCsv(rows: ValuedInventoryRow[], totals: InventoryTotals): string {
  const lines: Array<Array<string | number>> = rows.map((row) => [row.sku, row.name, Math.floor(row.quantity), Number(row.purchasePrice).toFixed(2), Number(row.totalValue).toFixed(2)]);
  lines.push(['Gran total...', '', Math.floor(totals.quantity), '', totals.totalValue.toFixed(2)]);
  return toCsv(['SKU', 'Nombre', 'Cantidad', 'Precio de compra', 'Total'], lines);
}
