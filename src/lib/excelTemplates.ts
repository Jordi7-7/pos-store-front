import * as XLSX from 'xlsx';

export const downloadProductsTemplate = () => {
  const headers = [['SKU', 'Nombre', 'Codigo', 'Precio Compra', 'Precio Venta', 'Existencias']];
  const sampleData = [
    ['CAM-001', 'Camiseta Negra Algodón', '1234567890', 8.50, 15.00, 20],
    ['JEAN-002', 'Jeans Slim Fit Azul', '0987654321', 12.00, 28.99, 15]
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
