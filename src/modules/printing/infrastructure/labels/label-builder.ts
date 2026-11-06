import type { TicketFormat } from '../../domain/entities/ticket';
import type { LabelDimensions, LabelItem, LabelProtocol } from '../../domain/entities/label';
import { DEFAULT_LABEL_DIMENSIONS } from '../../domain/entities/label';
import { labelPriceText } from '../../domain/rules/label-price';

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
  items: LabelItem[],
  storeName: string,
  format: TicketFormat,
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
    const priceText = labelPriceText(item.price, format);

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
  items: LabelItem[],
  storeName: string,
  format: TicketFormat,
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
    const priceText = labelPriceText(item.price, format);

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
  format: TicketFormat,
  dimensions: LabelDimensions = DEFAULT_LABEL_DIMENSIONS
): Uint8Array {
  const dummyItem: LabelItem = {
    sku: 'TEST-123456',
    name: 'ETIQUETA DE PRUEBA POS',
    price: 9.99,
    quantity: 1,
  };

  if (protocol === 'ZPL') {
    return buildZplLabelCommands([dummyItem], 'AURA POS STORE', format, dimensions);
  }
  return buildTsplLabelCommands([dummyItem], 'AURA POS STORE', format, dimensions);
}
