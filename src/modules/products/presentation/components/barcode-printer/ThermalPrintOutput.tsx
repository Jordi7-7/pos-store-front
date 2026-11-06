import React from 'react';
import JsBarcode from 'jsbarcode';
import type { BarcodeLabelItem } from './types';
import type { TicketFormat } from '@/modules/printing/domain/entities/ticket';
import { labelPriceText } from '@/modules/printing/domain/rules/label-price';
import { labelPrinterService } from '../../../../printing/infrastructure/printers/label-printer.service';

interface ThermalPrintOutputProps {
  items?: BarcodeLabelItem[];
  storeName?: string;
}

/**
 * Renderiza una etiqueta individual directamente en un HTML5 Canvas a resolución nativa térmica de 203 DPI (8 dots/mm).
 * Esto convierte la etiqueta en una imagen fija rasterizada punto por punto, eliminando al 100%:
 * 1. Desfases causados por el zoom de Windows o del navegador.
 * 2. Fuentes borrosas o cambios de tamaño de texto.
 * 3. Saltos de línea o expulsión de etiquetas vacías.
 */
export const renderLabelToPng203Dpi = (
  item: BarcodeLabelItem,
  storeName: string,
  format: TicketFormat,
  widthMm: number = 50,
  heightMm: number = 30
): string => {
  const dotsPerMm = 8; // 203 DPI estándar industrial (Zebra / TSC / Xprinter)
  const widthDots = Math.max(80, Math.round(widthMm * dotsPerMm));
  const heightDots = Math.max(60, Math.round(heightMm * dotsPerMm));

  const canvas = document.createElement('canvas');
  canvas.width = widthDots;
  canvas.height = heightDots;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1. Fondo blanco puro de alta reflectancia para el cabezal térmico
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, widthDots, heightDots);

  // 2. Margen de seguridad térmico
  const padX = Math.round(widthDots * 0.03);
  const padY = Math.round(heightDots * 0.03);
  const usableW = widthDots - padX * 2;
  const usableH = heightDots - padY * 2;

  // 3. Franja superior invertida (Nombre de tienda)
  const bannerH = Math.max(16, Math.round(usableH * 0.16));
  ctx.fillStyle = '#000000';
  ctx.fillRect(padX, padY, usableW, bannerH);

  const cleanStoreName = (storeName || 'MI TIENDA').trim().toUpperCase();
  const bannerFontSize = Math.max(10, Math.round(bannerH * 0.65));
  ctx.font = `900 ${bannerFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  let displayStore = cleanStoreName;
  while (ctx.measureText(displayStore).width > usableW - 8 && displayStore.length > 3) {
    displayStore = displayStore.slice(0, -4) + '...';
  }
  ctx.fillText(displayStore, widthDots / 2, padY + bannerH / 2);

  // 4. Código de barras usando JsBarcode en canvas auxiliar
  const cleanSku = (item.sku || '').trim();
  const barcodeMaxH = Math.round(usableH * 0.44);
  const barcodeMaxW = Math.round(usableW * 0.94);

  let barcodeDrawn = false;
  if (cleanSku) {
    try {
      const barcodeCanvas = document.createElement('canvas');
      let barWidth = 2;
      if (cleanSku.length > 14) barWidth = 1.1;
      else if (cleanSku.length > 10) barWidth = 1.4;
      else if (cleanSku.length > 8) barWidth = 1.7;

      JsBarcode(barcodeCanvas, cleanSku, {
        format: 'CODE128',
        width: barWidth,
        height: Math.max(20, Math.round(barcodeMaxH * 0.65)),
        displayValue: true,
        fontSize: Math.max(10, Math.round(barcodeMaxH * 0.28)),
        font: 'monospace',
        fontOptions: 'bold',
        textMargin: 2,
        margin: 0,
        background: '#ffffff',
        lineColor: '#000000',
      });

      const bcW = barcodeCanvas.width;
      const bcH = barcodeCanvas.height;
      if (bcW > 0 && bcH > 0) {
        const scale = Math.min(barcodeMaxW / bcW, barcodeMaxH / bcH, 1.2);
        const destW = Math.round(bcW * scale);
        const destH = Math.round(bcH * scale);
        const destX = Math.round((widthDots - destW) / 2);
        const destY = Math.round(padY + bannerH + (barcodeMaxH - destH) / 2 + usableH * 0.02);

        ctx.drawImage(barcodeCanvas, destX, destY, destW, destH);
        barcodeDrawn = true;
      }
    } catch (err) {
      console.error('Error generando barcode en canvas 203 DPI:', err);
    }
  }

  // Fallback si no hay SKU
  if (!barcodeDrawn && cleanSku) {
    ctx.fillStyle = '#000000';
    ctx.font = `bold ${Math.max(12, Math.round(usableH * 0.12))}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cleanSku, widthDots / 2, padY + bannerH + barcodeMaxH / 2);
  }

  // 5. Nombre del producto
  const nameY = Math.round(padY + bannerH + barcodeMaxH + usableH * 0.10);
  const nameFontSize = Math.max(10, Math.round(usableH * 0.10));
  ctx.font = `bold ${nameFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`;
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  let displayName = (item.name || '').toUpperCase();
  while (ctx.measureText(displayName).width > usableW && displayName.length > 3) {
    displayName = displayName.slice(0, -4) + '...';
  }
  ctx.fillText(displayName, widthDots / 2, nameY);

  // 6. Precio destacado
  const priceY = Math.round(padY + usableH - usableH * 0.08);
  const priceFontSize = Math.max(13, Math.round(usableH * 0.14));
  ctx.font = `900 ${priceFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`;
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillText(labelPriceText(item.price, format), widthDots / 2, priceY);

  return canvas.toDataURL('image/png');
};

/**
 * Imprime etiquetas térmicas creando un iframe aislado en memoria con imágenes rasterizadas a 203 DPI.
 * Cada etiqueta es un bloque de imagen fija @page 1:1, garantizando compatibilidad con drivers ZDesigner y Zebra.
 */
export const printThermalLabels = (
  items: BarcodeLabelItem[],
  storeName: string,
  format: TicketFormat,
  dimensions?: { widthMm: number; heightMm: number }
) => {
  if (!items || items.length === 0) return;

  const config = labelPrinterService.getConfig();
  const widthMm = dimensions?.widthMm || config.widthMm || 50;
  const heightMm = dimensions?.heightMm || config.heightMm || 30;

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

  // 3. Generar imágenes fijas 203 DPI (con caché para no re-renderizar productos duplicados)
  const imageCache = new Map<string, string>();
  const labelsHtml = flatItems
    .map((item, index) => {
      const cacheKey = `${item.sku}_${item.name}_${item.price}_${widthMm}_${heightMm}_${storeName}_${format.currencyCode}_${format.locale}`;
      let dataUrl = imageCache.get(cacheKey);
      if (!dataUrl) {
        dataUrl = renderLabelToPng203Dpi(item, storeName, format, widthMm, heightMm);
        imageCache.set(cacheKey, dataUrl);
      }
      const isLast = index === flatItems.length - 1;

      return `
        <div class="label-page ${isLast ? 'last-page' : ''}">
          <img src="${dataUrl}" class="label-img" alt="Etiqueta" />
        </div>
      `;
    })
    .join('');

  // 4. Escribir documento con @page exacto al milímetro
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Imprimir Etiquetas Térmicas Zebra</title>
        <style>
          @page {
            size: ${widthMm}mm ${heightMm}mm;
            margin: 0mm;
          }
          *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          html, body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            width: ${widthMm}mm;
            height: ${heightMm}mm;
            overflow: visible;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .label-page {
            width: ${widthMm}mm;
            height: ${heightMm}mm;
            max-width: ${widthMm}mm;
            max-height: ${heightMm}mm;
            page-break-after: always;
            break-after: page;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            margin: 0;
            padding: 0;
          }
          .label-page.last-page {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          .label-img {
            width: ${widthMm}mm;
            height: ${heightMm}mm;
            max-width: 100%;
            max-height: 100%;
            display: block;
            object-fit: fill;
            image-rendering: -webkit-optimize-contrast;
            image-rendering: pixelated;
            image-rendering: crisp-edges;
          }
        </style>
      </head>
      <body>
        ${labelsHtml}
      </body>
    </html>
  `);
  doc.close();

  // 5. Esperar a que el motor cargue las imágenes y disparar la ventana nativa
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();

    // Eliminar el iframe del DOM tras terminar
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 2000);
  }, 300);
};

export const ThermalPrintOutput: React.FC<ThermalPrintOutputProps> = () => {
  return null;
};
