/** Lectura del archivo de importación de productos con variantes (una fila por variante). Sin pantalla ni HTTP. */

export const MAX_IMPORT_ROWS = 2000;
export const MAX_IMPORT_ATTRIBUTES = 4;

export interface ImportRowInput {
  /** Número de fila en el archivo (la primera de datos es la 2). */
  row: number;
  name: string;
  baseSku: string;
  category: string;
  attributes: Array<{ name: string; value: string }>;
  sku: string;
  barcode: string;
  purchasePrice: number | null;
  salePrice: number | null;
  wholesalePrice: number | null;
  quantity: number | null;
}

export interface ImportProblem {
  row: number;
  /** Columna del archivo a la que se refiere (con su nombre en la plantilla). */
  column: string;
  message: string;
}

export interface ParsedSheet {
  rows: ImportRowInput[];
  /** Celdas ilegibles (un número escrito como texto raro): se señalan sin esperar al servidor. */
  problems: ImportProblem[];
  /** Columnas obligatorias que el archivo no trae. */
  missingColumns: string[];
}

/** Columnas de la plantilla, en orden. `aliases` son otros nombres que se aceptan al leer (sin acentos ni mayúsculas). */
const COLUMNS = {
  name: { label: 'Producto', aliases: ['producto', 'nombre', 'nombre del producto'] },
  baseSku: { label: 'SKU base', aliases: ['sku base', 'codigo base'] },
  category: { label: 'Categoría', aliases: ['categoria'] },
  sku: { label: 'SKU', aliases: ['sku', 'sku variante', 'codigo sku'] },
  barcode: { label: 'Código de barras', aliases: ['codigo de barras', 'codigo barras', 'codigo', 'barcode'] },
  purchasePrice: { label: 'Precio de compra', aliases: ['precio de compra', 'precio compra', 'costo'] },
  salePrice: { label: 'Precio de venta', aliases: ['precio de venta', 'precio venta', 'precio'] },
  wholesalePrice: { label: 'Precio de mayoreo', aliases: ['precio de mayoreo', 'precio mayoreo', 'mayoreo'] },
  quantity: { label: 'Existencias', aliases: ['existencias', 'existencia', 'stock', 'cantidad'] },
} as const;

type ColumnKey = keyof typeof COLUMNS;
const REQUIRED: readonly ColumnKey[] = ['name', 'sku', 'salePrice'];

/** Cabeceras de la plantilla en orden: producto, SKU base, categoría, hasta 4 pares atributo/valor y los datos de la variante. */
export const TEMPLATE_HEADERS: readonly string[] = [
  COLUMNS.name.label,
  COLUMNS.baseSku.label,
  COLUMNS.category.label,
  ...Array.from({ length: MAX_IMPORT_ATTRIBUTES }, (_, index) => [`Atributo ${index + 1}`, `Valor ${index + 1}`]).flat(),
  COLUMNS.sku.label,
  COLUMNS.barcode.label,
  COLUMNS.purchasePrice.label,
  COLUMNS.salePrice.label,
  COLUMNS.wholesalePrice.label,
  COLUMNS.quantity.label,
];

/** Cabecera comparable: sin acentos, en minúsculas y con los separadores como un espacio. */
export function normalizeHeader(header: string): string {
  return header
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[_\-.:]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const text = (value: unknown): string => (value === null || value === undefined ? '' : String(value).trim());

/** Número tal como lo escribe una persona (admite coma decimal); `null` si está vacío o no se entiende. */
function readNumber(value: unknown): { value: number | null; unreadable: boolean } {
  if (typeof value === 'number') return Number.isFinite(value) ? { value, unreadable: false } : { value: null, unreadable: true };
  const raw = text(value);
  if (raw === '') return { value: null, unreadable: false };
  const parsed = Number(raw.replace(',', '.'));
  return Number.isFinite(parsed) ? { value: parsed, unreadable: false } : { value: null, unreadable: true };
}

/**
 * Convierte las filas de la hoja (objetos por cabecera, como las da `sheet_to_json`) en filas de importación. Reconoce las
 * columnas por nombre (en cualquier orden y con sinónimos), ignora las filas vacías y señala las celdas numéricas ilegibles.
 */
export function parseImportSheet(records: ReadonlyArray<Record<string, unknown>>): ParsedSheet {
  const headers = new Map<string, string>(); // cabecera normalizada → cabecera original
  for (const record of records) for (const header of Object.keys(record)) if (!headers.has(normalizeHeader(header))) headers.set(normalizeHeader(header), header);

  const find = (aliases: readonly string[]): string | undefined => aliases.map((alias) => headers.get(alias)).find((header) => header !== undefined);
  const columns = Object.fromEntries((Object.keys(COLUMNS) as ColumnKey[]).map((key) => [key, find(COLUMNS[key].aliases)])) as Record<ColumnKey, string | undefined>;
  const attributePairs = Array.from({ length: MAX_IMPORT_ATTRIBUTES }, (_, index) => ({ name: find([`atributo ${index + 1}`]), value: find([`valor ${index + 1}`]) }));

  const missingColumns = REQUIRED.filter((key) => columns[key] === undefined).map((key) => COLUMNS[key].label);
  if (missingColumns.length > 0) return { rows: [], problems: [], missingColumns };

  const rows: ImportRowInput[] = [];
  const problems: ImportProblem[] = [];
  records.forEach((record, index) => {
    const cell = (key: ColumnKey): unknown => (columns[key] === undefined ? '' : record[columns[key] as string]);
    const rowNumber = typeof record['__rowNum__'] === 'number' ? record['__rowNum__'] + 1 : index + 2;
    if (Object.entries(record).every(([header, value]) => header === '__rowNum__' || text(value) === '')) return;

    const number = (key: 'purchasePrice' | 'salePrice' | 'wholesalePrice' | 'quantity'): number | null => {
      const read = readNumber(cell(key));
      if (read.unreadable) problems.push({ row: rowNumber, column: COLUMNS[key].label, message: `"${text(cell(key))}" no es un número.` });
      return read.value;
    };

    rows.push({
      row: rowNumber,
      name: text(cell('name')),
      baseSku: text(cell('baseSku')),
      category: text(cell('category')),
      attributes: attributePairs
        .map((pair) => ({ name: pair.name ? text(record[pair.name]) : '', value: pair.value ? text(record[pair.value]) : '' }))
        .filter((pair) => pair.name !== '' || pair.value !== ''),
      sku: text(cell('sku')),
      barcode: text(cell('barcode')),
      purchasePrice: number('purchasePrice'),
      salePrice: number('salePrice'),
      wholesalePrice: number('wholesalePrice'),
      quantity: number('quantity'),
    });
  });

  return { rows, problems, missingColumns: [] };
}

/** Texto de la columna del archivo a la que se refiere un error del servidor (para mostrarlo con el nombre que la persona ve). */
export function columnLabelOf(field: string): string {
  if (field === 'attributes') return 'Atributos';
  return field in COLUMNS ? COLUMNS[field as ColumnKey].label : field;
}
