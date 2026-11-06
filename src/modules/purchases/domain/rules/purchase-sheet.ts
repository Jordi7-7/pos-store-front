/** Reglas de la hoja de Excel de ingreso masivo (SKU y Cantidad). Sin leer archivos: reciben las celdas ya extraídas. */

export const MAX_BULK_PURCHASE_ROWS = 3000;

export interface SheetItem {
  sku: string;
  quantity: number;
}

const REQUIRED_HEADERS = ['sku', 'cantidad'];
/** Columnas de otras plantillas (productos, existencias…): si aparecen, el archivo no es de ingresos. */
const FORBIDDEN_HEADERS = ['nombre', 'precio compra', 'precio venta', 'existencias', 'codigo'];

/** ¿Es la plantilla de ingresos? Debe traer SKU y Cantidad y ninguna columna de otras plantillas. */
export function isPurchaseTemplate(headers: string[]): boolean {
  const normalized = headers.map((header) => header.trim().toLowerCase());
  return REQUIRED_HEADERS.every((header) => normalized.includes(header)) && !normalized.some((header) => FORBIDDEN_HEADERS.includes(header));
}

/** Filas con SKU: el SKU se recorta y una cantidad ausente o ilegible queda en 0. */
export function normalizePurchaseRows(rows: Record<string, unknown>[]): SheetItem[] {
  return rows
    .map((row) => {
      const quantity = Number(row.Cantidad || row.cantidad || 0);
      // Un texto como "diez" daría NaN, que ninguna comparación detecta: se trata como 0 para que la fila quede marcada.
      return { sku: String(row.SKU || row.sku || '').trim(), quantity: Number.isFinite(quantity) ? quantity : 0 };
    })
    .filter((item) => item.sku);
}

/** Mensaje si el archivo trae más filas de las permitidas; `null` si cabe. */
export function rowLimitMessage(count: number): string | null {
  if (count <= MAX_BULK_PURCHASE_ROWS) return null;
  return `El archivo contiene ${count} filas. El límite máximo permitido por importación es de ${MAX_BULK_PURCHASE_ROWS.toLocaleString()} registros.`;
}

/** Errores del servidor más los propios: una cantidad de 0 o menos también invalida la fila. */
export function mergeImportErrors(items: SheetItem[], serverErrors: Record<string, string>): Record<string, string> {
  const merged = { ...serverErrors };
  for (const item of items) {
    if (item.quantity <= 0) merged[item.sku] = 'La cantidad a ingresar debe ser mayor a 0.';
  }
  return merged;
}
