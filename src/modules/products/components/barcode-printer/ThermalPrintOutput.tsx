import React from 'react';
import JsBarcode from 'jsbarcode';
import type { BarcodeLabelItem } from './types';

interface ThermalPrintOutputProps {
  items?: BarcodeLabelItem[];
  storeName?: string;
}

/**
 * Imprime etiquetas térmicas creando un iframe aislado en memoria.
 * Esto evita al 100% que el DOM de la aplicación React (tablas, modales, scrollbars)
 * afecte la altura de la página de impresión, eliminando páginas en blanco fantasma.
 */
export const printThermalLabels = (items: BarcodeLabelItem[], storeName: string) => {
  if (!items || items.length === 0) return;

  // 1. Crear iframe temporal aislado
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '-9999px';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  // 2. Expandir items según sus cantidades
  const flatItems: BarcodeLabelItem[] = [];
  items.forEach((it) => {
    const qty = Number(it.quantity) || 1;
    for (let i = 0; i < qty; i++) {
      flatItems.push(it);
    }
  });

  // 3. Generar etiquetas HTML usando SVGs generados por JsBarcode en memoria
  const labelsHtml = flatItems
    .map((item, index) => {
      // Crear elemento SVG temporal para convertir el código de barras a XML puro
      const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      try {
        JsBarcode(tempSvg, item.sku, {
          format: 'CODE128',
          width: 1.4,
          height: 24,
          displayValue: true,
          fontSize: 10,
          font: 'monospace',
          fontOptions: 'bold',
          textMargin: 1,
          margin: 0,
        });
      } catch (e) {
        console.error('Error generando svg de barra para iframe:', item.sku, e);
      }

      const svgOuterHtml = tempSvg.outerHTML;
      const formattedPrice = Math.floor(item.price) === item.price ? item.price : item.price.toFixed(2);
      const isLast = index === flatItems.length - 1;

      return `
        <div class="label-page ${isLast ? 'last-page' : ''}">
          <div class="sticker">
            <div class="store-header">${storeName}</div>
            <div class="barcode-container">
              ${svgOuterHtml}
            </div>
            <div class="product-name">${item.name}</div>
            <div class="price-tag">PRECIO $ ${formattedPrice}</div>
          </div>
        </div>
      `;
    })
    .join('');

  // 4. Escribir documento minimalista puro sin rastro de la aplicación web
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Imprimir Etiquetas Térmicas</title>
        <style>
          @page {
            size: 50mm 30mm;
            margin: 0mm;
          }
          *, *::before, *::after {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          html, body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            width: 50mm;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            overflow: visible;
          }
          .label-page {
            width: 50mm;
            height: 30mm;
            max-height: 30mm;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            page-break-after: always;
            break-after: page;
            margin: 0;
            padding: 0;
          }
          .label-page.last-page {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          .sticker {
            width: 50mm;
            height: 29.5mm;
            max-height: 29.5mm;
            padding: 1mm 2mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            overflow: hidden;
            background: #ffffff;
            color: #000000;
          }
          .store-header {
            width: 100%;
            background-color: #000000 !important;
            color: #ffffff !important;
            text-align: center;
            font-size: 10px;
            font-weight: 900;
            line-height: 1;
            padding: 2px 3px;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            border-radius: 2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .barcode-container {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            min-height: 0;
            overflow: hidden;
            margin: 1px 0;
          }
          .barcode-container svg {
            max-width: 100%;
            max-height: 14mm;
            display: block;
          }
          .product-name {
            width: 100%;
            text-align: center;
            font-weight: 700;
            font-size: 9px;
            line-height: 1;
            text-transform: uppercase;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            padding: 0 1px;
            margin-bottom: 2px;
            color: #000000;
          }
          .price-tag {
            width: 100%;
            text-align: center;
            font-weight: 900;
            font-size: 12px;
            font-family: Georgia, 'Times New Roman', serif;
            line-height: 1;
            letter-spacing: 0.04em;
            color: #000000;
            padding-bottom: 1px;
          }
        </style>
      </head>
      <body>
        ${labelsHtml}
      </body>
    </html>
  `);
  doc.close();

  // 5. Esperar a que el motor renderice el iframe y disparar la ventana nativa de impresión
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();

    // Eliminar el iframe del DOM tras terminar
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1500);
  }, 250);
};

export const ThermalPrintOutput: React.FC<ThermalPrintOutputProps> = () => {
  // Ahora la impresión es 100% manejada por printThermalLabels vía iframe aislado
  return null;
};
