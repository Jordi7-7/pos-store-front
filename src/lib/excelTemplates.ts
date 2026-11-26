import * as XLSX from 'xlsx';
import { TEMPLATE_HEADERS } from '@/modules/products/domain/rules/variants-import';

export const downloadProductsTemplate = () => {
  const headers = [['SKU', 'Nombre', 'Codigo', 'Precio Compra', 'Precio Venta', 'Precio Mayoreo', 'Existencias']];
  const sampleData = [
    ['CAM-001', 'Camiseta Negra Algodón', '1234567890', 8.50, 15.00, 12.00, 20],
    ['JEAN-002', 'Jeans Slim Fit Azul', '0987654321', 12.00, 28.99, 22.50, 15],
    ['GOR-003', 'Gorra Deportiva Negra (Déficit)', '1122334455', 5.00, 10.00, 8.00, -2]
  ];

  const ws = XLSX.utils.aoa_to_sheet([...headers, ...sampleData]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Productos');
  XLSX.writeFile(wb, 'plantilla_creacion_productos.xlsx');
};

export const downloadPurchasesTemplate = () => {
  const headers = [['SKU', 'Cantidad']];
  const sampleData = [
    ['CAM-001', 50],
    ['JEAN-002', 30]
  ];

  const ws = XLSX.utils.aoa_to_sheet([...headers, ...sampleData]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Ingresos');
  XLSX.writeFile(wb, 'plantilla_ingreso_mercancia.xlsx');
};

/** Plantilla de importación de productos con variantes: una fila por variante, con ejemplos y una hoja de instrucciones. */
export const downloadVariantsTemplate = () => {
  const row = (values: Record<string, string | number>): Array<string | number> => TEMPLATE_HEADERS.map((header) => values[header] ?? '');
  const example = [
    row({ Producto: 'Playera oversize', 'SKU base': 'PLY', Categoría: 'Ropa', 'Atributo 1': 'Talla', 'Valor 1': 'M', 'Atributo 2': 'Color', 'Valor 2': 'Negro', SKU: 'PLY-M-NEGRO', 'Precio de compra': 8, 'Precio de venta': 18, 'Precio de mayoreo': 15, Existencias: 10 }),
    row({ Producto: 'Playera oversize', 'SKU base': 'PLY', Categoría: 'Ropa', 'Atributo 1': 'Talla', 'Valor 1': 'L', 'Atributo 2': 'Color', 'Valor 2': 'Negro', SKU: 'PLY-L-NEGRO', 'Precio de compra': 8, 'Precio de venta': 18, 'Precio de mayoreo': 15, Existencias: 6 }),
    row({ Producto: 'Playera oversize', 'SKU base': 'PLY', Categoría: 'Ropa', 'Atributo 1': 'Talla', 'Valor 1': 'M', 'Atributo 2': 'Color', 'Valor 2': 'Blanco', SKU: 'PLY-M-BLANCO', 'Precio de compra': 8, 'Precio de venta': 18, Existencias: 4 }),
    row({ Producto: 'Tornillo 1/4"', Categoría: 'Ferretería', SKU: 'TOR-14', 'Código de barras': '7501234567890', 'Precio de compra': 0.1, 'Precio de venta': 0.25, Existencias: 500 }),
  ];
  const instructions = [
    ['Cómo llenar la plantilla'],
    ['Cada fila es UNA variante (o un producto simple). Las filas con el mismo "SKU base" forman un producto con variantes.'],
    ['Un producto sin atributos y sin "SKU base" es un producto simple (como el tornillo del ejemplo).'],
    ['Obligatorio: Producto, SKU y Precio de venta. En las variantes también el SKU base y los atributos.'],
    ['Todas las variantes de un producto usan los mismos atributos (p. ej. todas con Talla y Color) y no pueden repetir la combinación.'],
    ['Cada fila admite hasta 5 atributos (columnas "Atributo 1" a "Atributo 5"), por ejemplo las cuatro piezas de una mochila y el cierre.'],
    ['Si la categoría, el atributo o el valor no existen, se crean. No hace falta crearlos antes.'],
    ['Las existencias se guardan en la sucursal que elijas al importar. Máximo 2000 filas por archivo.'],
    ['Primero se revisa el archivo y se te muestran los errores por fila; no se guarda nada hasta que lo confirmes.'],
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([[...TEMPLATE_HEADERS], ...example]), 'Productos');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(instructions), 'Instrucciones');
  XLSX.writeFile(wb, 'plantilla_productos_con_variantes.xlsx');
};
