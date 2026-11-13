import type { EscPosParseResult } from './escpos-parser';
import { PAPER_MM, type PaperWidth } from '../../domain/rules/print-layout';

export interface EscPosImageOptions {
  scale?: number;
  includeCutLine?: boolean;
  includeDrawerPulse?: boolean;
}

/**
 * Renderiza los bytes parseados de ESC/POS en un canvas HTML de alta resolución (2x Retina)
 * para generar imágenes PNG nítidas sin artefactos de compresión.
 */
export function renderEscPosToCanvas(
  parseResult: EscPosParseResult,
  options: EscPosImageOptions = {}
): HTMLCanvasElement {
  const scale = options.scale || 2; // 2x para nitidez Retina
  const maxCols = parseResult.maxCols;

  const baseFontSize = 13;
  const fontFamily = '"Courier New", Courier, monospace';
  const paddingX = 18;
  const paddingY = 24;
  const baseLineHeight = Math.round(baseFontSize * 1.6); // ~21px

  // Medir el ancho de un caracter monoespaciado en canvas para cuadrícula perfecta
  const testCanvas = document.createElement('canvas');
  const testCtx = testCanvas.getContext('2d');
  let charWidth = 7.82;
  if (testCtx) {
    testCtx.font = `${baseFontSize}px ${fontFamily}`;
    charWidth = testCtx.measureText('M').width || 7.82;
  }

  // Ancho exacto del contenido correspondiente a maxCols (32 o 48 columnas)
  const contentWidth = Math.ceil(maxCols * charWidth);
  const baseWidth = contentWidth + paddingX * 2;

  // Filtrar líneas relevantes (omitir pulso de cajón en imágenes para clientes)
  const printableLines = parseResult.lines.filter((line) => {
    if (line.isDrawer && !options.includeDrawerPulse) return false;
    return true;
  });

  // Calcular la altura total necesaria
  let totalHeight = paddingY * 2;
  printableLines.forEach((line) => {
    if (line.isCut) {
      totalHeight += 26;
    } else if (line.doubleHeight) {
      totalHeight += baseLineHeight * 1.4;
    } else {
      totalHeight += baseLineHeight;
    }
  });

  const canvas = document.createElement('canvas');
  canvas.width = baseWidth * scale;
  canvas.height = totalHeight * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Escalar contexto para resolución 2x
  ctx.scale(scale, scale);

  // Fondo blanco puro con textura de papel térmico suave
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, baseWidth, totalHeight);

  // Borde sutil del ticket
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, baseWidth, totalHeight);

  // Renderizar líneas
  let currentY = paddingY;

  printableLines.forEach((line) => {
    if (line.isCut) {
      // Línea de corte estética
      ctx.save();
      ctx.strokeStyle = '#9CA3AF';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(paddingX, currentY + 10);
      ctx.lineTo(baseWidth - paddingX, currentY + 10);
      ctx.stroke();

      ctx.fillStyle = '#6B7280';
      ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✂ CORTE', baseWidth / 2, currentY + 14);
      ctx.restore();

      currentY += 26;
      return;
    }

    if (line.isDrawer) {
      currentY += baseLineHeight;
      return;
    }

    // Configuración tipográfica
    const fontSize = line.doubleHeight ? Math.round(baseFontSize * 1.35) : baseFontSize;
    const fontWeight = line.bold ? 'bold' : 'normal';
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = '#111827'; // Negro carbón para contraste óptimo

    // Si es centrada, recortar espacios marginales para centrado geométrico perfecto
    const textToDraw = line.align === 'center' ? line.text.trim() : line.text;

    let posX = paddingX;
    if (line.align === 'center') {
      ctx.textAlign = 'center';
      posX = baseWidth / 2;
    } else if (line.align === 'right') {
      ctx.textAlign = 'right';
      posX = baseWidth - paddingX;
    } else {
      ctx.textAlign = 'left';
      posX = paddingX;
    }

    ctx.fillText(textToDraw, posX, currentY + fontSize);
    currentY += line.doubleHeight ? baseLineHeight * 1.4 : baseLineHeight;
  });

  return canvas;
}

/**
 * Convierte el ticket en una URL base64 de imagen PNG
 */
export function renderEscPosToDataUrl(
  parseResult: EscPosParseResult,
  options: EscPosImageOptions = {}
): string {
  const canvas = renderEscPosToCanvas(parseResult, options);
  return canvas.toDataURL('image/png');
}

/**
 * Descarga el ticket como archivo PNG en el navegador
 */
export function downloadEscPosImage(
  parseResult: EscPosParseResult,
  filename: string = 'ticket.png',
  options: EscPosImageOptions = {}
): void {
  const dataUrl = renderEscPosToDataUrl(parseResult, options);
  const link = document.createElement('a');
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Envía la imagen PNG del ticket al diálogo de impresión del navegador de forma limpia
 */
export function printImageViaIframe(
  dataUrl: string,
  title: string = 'Impresión de Ticket',
  paperWidth: PaperWidth = '80mm'
): void {
  const widthMm = PAPER_MM[paperWidth];
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page {
            margin: 0;
            size: ${widthMm}mm auto;
          }
          body {
            margin: 0;
            padding: 0;
            width: ${widthMm}mm;
            background: #fff;
          }
          img {
            width: 100%;
            height: auto;
            display: block;
          }
        </style>
      </head>
      <body>
        <img src="${dataUrl}" />
      </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    const win = iframe.contentWindow;
    if (win) {
      win.focus();
      win.print();
    }
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 2000);
  }, 150);
}
