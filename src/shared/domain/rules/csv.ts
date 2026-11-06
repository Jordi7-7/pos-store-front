/** CSV con `;` como separador (el que abre Excel en configuración regional hispana) y todas las celdas entre comillas. */
export function toCsv(headers: string[], rows: Array<Array<string | number>>): string {
  const cell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  return [headers.join(';'), ...rows.map((row) => row.map(cell).join(';'))].join('\n');
}
