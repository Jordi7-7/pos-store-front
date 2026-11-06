import { escapeHtml } from '@/shared/domain/rules/escape-html';

export interface ReportColumn {
  label: string;
  /** Ancho como porcentaje de la tabla. */
  width: number;
  align?: 'right';
}

export interface ReportDocument {
  title: string;
  tenantName: string;
  /** Líneas bajo el nombre del negocio (período, filtros…). */
  infoLines: Array<{ text: string; bold?: boolean }>;
  printedOn: string;
  columns: ReportColumn[];
  /** Filas ya construidas: quien las arma debe escapar los datos con `escapeHtml`. */
  rowsHtml: string;
  totalRowHtml: string;
}

const STYLES = `
  @page { margin: 10mm; size: portrait; }
  body { font-family: Arial, sans-serif; font-size: 10px; color: #000; margin: 0; padding: 0; }
  .header { margin-bottom: 15px; }
  .header-title { font-size: 13px; font-weight: bold; text-decoration: underline; margin-bottom: 2px; text-transform: uppercase; }
  .header-info { font-size: 10px; margin-bottom: 1px; }
  .print-date { float: right; font-size: 9px; }
  .page-number { float: right; font-size: 8px; }
  table { width: 100%; border-collapse: collapse; margin-top: 5px; }
  th { border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 5px 3px; font-weight: bold; text-align: left; font-size: 10px; }
  td { padding: 4px 3px; font-size: 9.5px; }
  .total-row td { border-top: 1px solid #000; border-bottom: 1.5px double #000; font-weight: bold; }
`;

/** Documento HTML de un informe para imprimir: encabezado del negocio, tabla y fila de totales. */
export function reportDocumentHtml(doc: ReportDocument): string {
  const head = doc.columns
    .map((column) => `<th style="width: ${column.width}%;${column.align ? ' text-align: right;' : ''}">${escapeHtml(column.label)}</th>`)
    .join('');
  const info = doc.infoLines.map((line) => `<div class="header-info"${line.bold ? ' style="font-weight: bold;"' : ''}>${escapeHtml(line.text)}</div>`).join('');
  return `<html>
  <head><title>${escapeHtml(doc.title)}</title><style>${STYLES}</style></head>
  <body>
    <div class="print-date">Impreso el: ${escapeHtml(doc.printedOn)}</div>
    <div class="page-number">Página: 1</div>
    <div class="header">
      <div class="header-title">${escapeHtml(doc.tenantName || 'NEGOCIO')}</div>
      <div class="header-info" style="font-weight: bold;">${escapeHtml(doc.title)}</div>
      ${info}
    </div>
    <table>
      <thead><tr>${head}</tr></thead>
      <tbody>${doc.rowsHtml}${doc.totalRowHtml}</tbody>
    </table>
  </body>
</html>`;
}

/** Celda de tabla con el dato ya escapado. */
export const cell = (value: unknown, align?: 'right', style = ''): string => `<td style="${align ? 'text-align: right;' : ''}${style}">${escapeHtml(value)}</td>`;
