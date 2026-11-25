import { describe, expect, it } from 'vitest';
import { columnLabelOf, normalizeHeader, parseImportSheet, TEMPLATE_HEADERS } from './variants-import';

const record = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  Producto: 'Playera',
  'SKU base': 'ply',
  Categoría: 'Ropa',
  'Atributo 1': 'Talla',
  'Valor 1': 'M',
  SKU: 'PLY-M',
  'Precio de compra': 5,
  'Precio de venta': 12,
  Existencias: 3,
  ...overrides,
});

describe('normalizeHeader', () => {
  it('quita acentos, mayúsculas y separadores', () => {
    expect(normalizeHeader('  Categoría ')).toBe('categoria');
    expect(normalizeHeader('Precio_de-venta')).toBe('precio de venta');
  });
});

describe('parseImportSheet', () => {
  it('lee una fila con sus atributos y números', () => {
    const { rows, problems, missingColumns } = parseImportSheet([record({ __rowNum__: 1 })]);

    expect(missingColumns).toEqual([]);
    expect(problems).toEqual([]);
    expect(rows).toEqual([
      { row: 2, name: 'Playera', baseSku: 'ply', category: 'Ropa', attributes: [{ name: 'Talla', value: 'M' }], sku: 'PLY-M', barcode: '', purchasePrice: 5, salePrice: 12, wholesalePrice: null, quantity: 3 },
    ]);
  });

  it('acepta otros nombres de columna, en cualquier orden, y coma decimal', () => {
    const { rows } = parseImportSheet([{ stock: '4', 'PRECIO VENTA': '12,5', Nombre: 'Tornillo', 'Código de barras': 7501, sku: 'T-1' }]);

    expect(rows[0]).toMatchObject({ name: 'Tornillo', sku: 'T-1', barcode: '7501', salePrice: 12.5, quantity: 4, attributes: [] });
  });

  it('ignora las filas vacías y usa el número de fila real del archivo', () => {
    const { rows } = parseImportSheet([record({ __rowNum__: 1 }), { Producto: '', SKU: ' ', 'Precio de venta': '', __rowNum__: 2 }, record({ SKU: 'PLY-L', 'Valor 1': 'L', __rowNum__: 5 })]);

    expect(rows.map((row) => row.row)).toEqual([2, 6]);
  });

  it('señala un número ilegible sin inventar un valor', () => {
    const { rows, problems } = parseImportSheet([record({ __rowNum__: 3, 'Precio de venta': 'doce', Existencias: '1e999x' })]);

    expect(rows[0]).toMatchObject({ salePrice: null, quantity: null });
    expect(problems).toEqual([
      { row: 4, column: 'Precio de venta', message: '"doce" no es un número.' },
      { row: 4, column: 'Existencias', message: '"1e999x" no es un número.' },
    ]);
  });

  it('un atributo a medias llega al servidor para que lo señale; los vacíos se descartan', () => {
    const { rows } = parseImportSheet([record({ 'Valor 1': '', 'Atributo 2': 'Color', 'Valor 2': 'Negro' })]);

    expect(rows[0]?.attributes).toEqual([{ name: 'Talla', value: '' }, { name: 'Color', value: 'Negro' }]);
  });

  it('avisa de las columnas obligatorias que faltan', () => {
    expect(parseImportSheet([{ Producto: 'X', SKU: 'X-1' }]).missingColumns).toEqual(['Precio de venta']);
    expect(parseImportSheet([{ Foo: 1 }]).missingColumns).toEqual(['Producto', 'SKU', 'Precio de venta']);
  });
});

describe('plantilla', () => {
  it('las cabeceras de la plantilla se leen de vuelta sin problemas', () => {
    const header = Object.fromEntries(TEMPLATE_HEADERS.map((name) => [name, 'x']));
    expect(parseImportSheet([{ ...header, 'Precio de venta': 1 }]).missingColumns).toEqual([]);
  });

  it('muestra el nombre de columna que la persona ve', () => {
    expect(columnLabelOf('salePrice')).toBe('Precio de venta');
    expect(columnLabelOf('attributes')).toBe('Atributos');
  });
});
