import type { BarcodeLabelItem } from '../components/barcode-printer/types';

export type LabelProtocol = 'TSPL' | 'ZPL';

export interface LabelDimensions {
  widthMm: number;    // Ancho en milímetros (ej: 50)
  heightMm: number;   // Alto en milímetros (ej: 30)
  gapMm: number;      // Separación entre etiquetas (ej: 2)
  dpi?: number;       // Resolución típica: 203 DPI (8 dots/mm)
}

export const DEFAULT_LABEL_DIMENSIONS: LabelDimensions = {
  widthMm: 50,
  heightMm: 30,
  gapMm: 2,
  dpi: 203,
};

export interface LabelPreset {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  gapMm: number;
  category: 'Comercio / Ropa' | 'Joyería / Farmacia' | 'Cajas / Almacén' | 'Envíos / Logística';
  description: string;
}

export const ZEBRA_LABEL_PRESETS: LabelPreset[] = [
  {
    id: '50x30',
    name: '50 × 30 mm (Estándar Comercio)',
    widthMm: 50,
    heightMm: 30,
    gapMm: 2,
    category: 'Comercio / Ropa',
    description: 'El tamaño más popular para tiendas de ropa, calzado y retail.',
  },
  {
    id: '50x25',
    name: '50 × 25 mm (2" × 1")',
    widthMm: 50,
    heightMm: 25,
    gapMm: 2,
    category: 'Joyería / Farmacia',
    description: 'Ideal para farmacias, cosméticos, perfumerías y productos pequeños.',
  },
  {
    id: '40x30',
    name: '40 × 30 mm (Compacta)',
    widthMm: 40,
    heightMm: 30,
    gapMm: 2,
    category: 'Comercio / Ropa',
    description: 'Etiquetas compactas para accesorios, bisutería y papelería.',
  },
  {
    id: '38x25',
    name: '38 × 25 mm (1.5" × 1")',
    widthMm: 38,
    heightMm: 25,
    gapMm: 2,
    category: 'Joyería / Farmacia',
    description: 'Etiqueta pequeña para códigos de barra compactos.',
  },
  {
    id: '60x40',
    name: '60 × 40 mm (Mediana)',
    widthMm: 60,
    heightMm: 40,
    gapMm: 2,
    category: 'Cajas / Almacén',
    description: 'Etiqueta amplia para cajas medianas, calzado y repuestos.',
  },
  {
    id: '80x50',
    name: '80 × 50 mm (Almacén)',
    widthMm: 80,
    heightMm: 50,
    gapMm: 3,
    category: 'Cajas / Almacén',
    description: 'Para bultos, pallets pequeños y cajas de inventario.',
  },
  {
    id: '100x50',
    name: '100 × 50 mm (4" × 2")',
    widthMm: 100,
    heightMm: 50,
    gapMm: 3,
    category: 'Cajas / Almacén',
    description: 'Etiqueta ancha industrial Zebra para distribución.',
  },
  {
    id: '100x150',
    name: '100 × 150 mm (4" × 6" Courier)',
    widthMm: 100,
    heightMm: 150,
    gapMm: 3,
    category: 'Envíos / Logística',
    description: 'Medida estándar mundial de guías de paquetería y logística.',
  },
];

/**
 * Normaliza cadenas de texto para impresoras térmicas de etiquetas:
 * Reemplaza tildes y caracteres especiales para evitar símbolos extraños en fuentes bitmap.
 */
function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ñÑ]/g, 'N')
    .replace(/["\\]/g, '') // Quitar comillas y barras invertidas que rompen comandos
    .trim();
}

/**
 * Genera el paquete de comandos en formato TSPL (compatible con Xprinter, TSC, Rongta, HPRT, Godex).
 */
export function buildTsplLabelCommands(
  items: BarcodeLabelItem[],
  storeName: string,
  dimensions: LabelDimensions = DEFAULT_LABEL_DIMENSIONS
): Uint8Array {
  const dpi = dimensions.dpi || 203;
  const dotsPerMm = dpi === 300 ? 12 : 8; // 203 DPI = 8 dots/mm
  const widthDots = Math.round(dimensions.widthMm * dotsPerMm);

  const cleanStoreName = normalizeText(storeName || 'MI TIENDA').toUpperCase();

  let tspl = '';

  for (const item of items) {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const cleanSku = (item.sku || '').trim().replace(/["\\]/g, '');
    const cleanName = normalizeText(item.name || '').toUpperCase();
    const formattedPrice = Math.floor(item.price) === item.price 
      ? item.price.toString() 
      : item.price.toFixed(2);
    const priceText = `PRECIO $ ${formattedPrice}`;

    // Configuración inicial de etiqueta y sensor de GAP
    tspl += `SIZE ${dimensions.widthMm} mm, ${dimensions.heightMm} mm\r\n`;
    tspl += `GAP ${dimensions.gapMm} mm, 0 mm\r\n`;
    tspl += `DIRECTION 1\r\n`;
    tspl += `REFERENCE 0,0\r\n`;
    tspl += `CLS\r\n`;

    // 1. Recuadro y nombre de la tienda (Header)
    const boxX1 = 12;
    const boxX2 = widthDots - 12;
    tspl += `BOX ${boxX1}, 8, ${boxX2}, 38, 2\r\n`;

    // Centrado de texto de la tienda (Font "3" = ~16 dots por caracter)
    const storeCharWidth = 16;
    const maxStoreChars = Math.floor((widthDots - 36) / storeCharWidth);
    const displayStore = cleanStoreName.slice(0, maxStoreChars);
    const storeX = Math.max(16, Math.floor((widthDots - displayStore.length * storeCharWidth) / 2));
    tspl += `TEXT ${storeX}, 14, "3", 0, 1, 1, "${displayStore}"\r\n`;

    // 2. Código de barras CODE128
    // En CODE128: ancho aprox = (longitud * 11 + 35) * narrow
    const narrow = cleanSku.length > 12 ? 1 : 2;
    const approxBarcodeWidth = (cleanSku.length * 11 + 35) * narrow;
    const barcodeX = Math.max(12, Math.floor((widthDots - approxBarcodeWidth) / 2));
    const barcodeHeight = cleanSku.length > 12 ? 45 : 50;
    tspl += `BARCODE ${barcodeX}, 48, "128", ${barcodeHeight}, 1, 0, ${narrow}, ${narrow}, "${cleanSku}"\r\n`;

    // 3. Nombre del producto (Font "2" = ~12 dots por caracter)
    const nameCharWidth = 12;
    const maxNameChars = Math.floor((widthDots - 24) / nameCharWidth);
    const displayName = cleanName.length > maxNameChars 
      ? cleanName.slice(0, maxNameChars - 2) + '..' 
      : cleanName;
    const nameX = Math.max(12, Math.floor((widthDots - displayName.length * nameCharWidth) / 2));
    tspl += `TEXT ${nameX}, 142, "2", 0, 1, 1, "${displayName}"\r\n`;

    // 4. Precio destacado (Font "3" = ~16 dots por caracter)
    const priceX = Math.max(12, Math.floor((widthDots - priceText.length * storeCharWidth) / 2));
    tspl += `TEXT ${priceX}, 176, "3", 0, 1, 1, "${priceText}"\r\n`;

    // 5. Imprimir lote según la cantidad
    tspl += `PRINT 1, ${qty}\r\n`;
  }

  return new TextEncoder().encode(tspl);
}

/**
 * Genera el paquete de comandos en formato ZPL (Zebra Programming Language).
 */
export function buildZplLabelCommands(
  items: BarcodeLabelItem[],
  storeName: string,
  dimensions: LabelDimensions = DEFAULT_LABEL_DIMENSIONS
): Uint8Array {
  const dpi = dimensions.dpi || 203;
  const dotsPerMm = dpi === 300 ? 12 : 8;
  const widthDots = Math.round(dimensions.widthMm * dotsPerMm);
  const heightDots = Math.round(dimensions.heightMm * dotsPerMm);

  const cleanStoreName = normalizeText(storeName || 'MI TIENDA').toUpperCase();

  let zpl = '';

  for (const item of items) {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const cleanSku = (item.sku || '').trim().replace(/["\\]/g, '');
    const cleanName = normalizeText(item.name || '').toUpperCase();
    const formattedPrice = Math.floor(item.price) === item.price 
      ? item.price.toString() 
      : item.price.toFixed(2);
    const priceText = `PRECIO $ ${formattedPrice}`;

    const narrow = cleanSku.length > 12 ? 1 : 2;
    const approxBarcodeWidth = (cleanSku.length * 11 + 35) * narrow;
    const barcodeX = Math.max(12, Math.floor((widthDots - approxBarcodeWidth) / 2));

    zpl += `^XA\r\n`;
    zpl += `^PW${widthDots}\r\n`;
    zpl += `^LL${heightDots}\r\n`;

    // 1. Recuadro superior y nombre de la tienda
    zpl += `^FO12,8^GB${widthDots - 24},32,2^FS\r\n`;
    zpl += `^FO12,14^A0N,20,20^FB${widthDots - 24},1,0,C^FD${cleanStoreName}^FS\r\n`;

    // 2. Código de barras CODE128
    zpl += `^FO${barcodeX},48^BY${narrow},2,48^BCN,48,Y,N,N^FD${cleanSku}^FS\r\n`;

    // 3. Nombre del producto
    zpl += `^FO12,142^A0N,18,18^FB${widthDots - 24},1,0,C^FD${cleanName}^FS\r\n`;

    // 4. Precio
    zpl += `^FO12,176^A0N,24,24^FB${widthDots - 24},1,0,C^FD${priceText}^FS\r\n`;

    // 5. Cantidad de copias
    zpl += `^PQ${qty}\r\n`;
    zpl += `^XZ\r\n`;
  }

  return new TextEncoder().encode(zpl);
}

/**
 * Genera etiqueta de prueba en TSPL o ZPL.
 */
export function buildTestLabelCommands(
  protocol: LabelProtocol = 'TSPL',
  dimensions: LabelDimensions = DEFAULT_LABEL_DIMENSIONS
): Uint8Array {
  const dummyItem: BarcodeLabelItem = {
    sku: 'TEST-123456',
    name: 'ETIQUETA DE PRUEBA POS',
    price: 9.99,
    quantity: 1,
  };

  if (protocol === 'ZPL') {
    return buildZplLabelCommands([dummyItem], 'AURA POS STORE', dimensions);
  }
  return buildTsplLabelCommands([dummyItem], 'AURA POS STORE', dimensions);
}
