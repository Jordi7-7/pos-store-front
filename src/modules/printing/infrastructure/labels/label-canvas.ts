import JsBarcode from 'jsbarcode';
import type { LabelItem } from '../../domain/entities/label';
import type { TicketFormat } from '../../domain/entities/ticket';
import { pickModuleWidth } from '../../domain/rules/barcode-fit';
import { toMonoBitmap, type MonoBitmap } from '../../domain/rules/label-bitmap';
import { layoutLabel, type Box, type LabelSpec } from '../../domain/rules/label-layout';
import { labelPriceText } from '../../domain/rules/label-price';

export interface LabelRender {
  item: LabelItem;
  storeName: string;
  format: TicketFormat;
  spec: LabelSpec;
  showStore: boolean;
}

const SANS = 'Arial, Helvetica, "Segoe UI", sans-serif';
const MIN_FONT_PX = 7;

/** Escribe el texto centrado en la caja con la letra más grande que quepa; si ni así cabe, lo recorta con «…». */
function drawFitted(ctx: CanvasRenderingContext2D, text: string, box: Box, weight: '400' | '700' | '900', family: string, color: string): void {
  let size = Math.max(MIN_FONT_PX, Math.floor(box.h * 0.9));
  ctx.font = `${weight} ${size}px ${family}`;
  while (ctx.measureText(text).width > box.w && size > MIN_FONT_PX) {
    size -= 1;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  let shown = text;
  while (ctx.measureText(shown).width > box.w && shown.length > 1) shown = `${shown.slice(0, -2)}…`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(shown, box.x + box.w / 2, box.y + box.h / 2);
}

/**
 * Dibuja la etiqueta punto por punto, a la resolución real de la impresora. Esta imagen es la vista previa, la que se
 * manda a la impresora (TSPL/ZPL) y la que se imprime por el controlador del sistema: las tres son idénticas.
 */
export function renderLabelCanvas({ item, storeName, format, spec, showStore }: LabelRender): HTMLCanvasElement {
  const detail = item.detail?.trim() ?? '';
  const geometry = layoutLabel(spec, { showStore, hasDetail: detail !== '' });
  const canvas = document.createElement('canvas');
  canvas.width = geometry.widthDots;
  canvas.height = geometry.heightDots;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;

  if (geometry.banner) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(geometry.banner.x, geometry.banner.y, geometry.banner.w, geometry.banner.h);
    drawFitted(ctx, (storeName || 'MI TIENDA').trim().toUpperCase(), { ...geometry.banner, x: geometry.banner.x + 4, w: geometry.banner.w - 8 }, '900', SANS, '#ffffff');
  }

  const sku = item.sku.trim();
  const bars = geometry.barcode;
  const { narrow } = pickModuleWidth(sku.length, Math.floor(bars.w * 0.92));
  try {
    const barcode = document.createElement('canvas');
    JsBarcode(barcode, sku, { format: 'CODE128', width: narrow, height: bars.h, displayValue: false, margin: 0, background: '#ffffff', lineColor: '#000000' });
    // Si ni con barras de 1 punto cabe, se encoge al ancho disponible (el escáner puede costar más; se avisa en pantalla)
    const width = Math.min(barcode.width, bars.w);
    ctx.drawImage(barcode, 0, 0, barcode.width, barcode.height, Math.round(bars.x + (bars.w - width) / 2), bars.y, width, bars.h);
  } catch {
    drawFitted(ctx, sku, bars, '700', 'monospace', '#000000');
  }
  drawFitted(ctx, sku, geometry.code, '700', 'monospace', '#000000');
  drawFitted(ctx, item.name.trim().toUpperCase(), geometry.name, '700', SANS, '#000000');
  if (geometry.detail) drawFitted(ctx, detail, geometry.detail, '700', SANS, '#000000');
  drawFitted(ctx, labelPriceText(item.price, format), geometry.price, '900', SANS, '#000000');
  return canvas;
}

/**
 * Etiqueta de comprobación de medidas: un marco en el borde exacto de la etiqueta y una regla en milímetros. Si el marco sale
 * cortado o corrido, el tamaño o la separación no coinciden con el rollo; si la regla no mide lo que dice, la resolución
 * elegida no es la de la impresora.
 */
export function renderMeasureCanvas(spec: LabelSpec): HTMLCanvasElement {
  const geometry = layoutLabel(spec, { showStore: false, hasDetail: false });
  const perMm = geometry.widthDots / spec.widthMm;
  const canvas = document.createElement('canvas');
  canvas.width = geometry.widthDots;
  canvas.height = geometry.heightDots;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000000';
  const edge = 3;
  ctx.fillRect(0, 0, canvas.width, edge);
  ctx.fillRect(0, canvas.height - edge, canvas.width, edge);
  ctx.fillRect(0, 0, edge, canvas.height);
  ctx.fillRect(canvas.width - edge, 0, edge, canvas.height);

  const pad = geometry.name.x + 4;
  const rows = Math.max(1, geometry.heightDots - pad * 2);
  drawFitted(ctx, `${spec.widthMm} × ${spec.heightMm} mm · ${spec.dpi} dpi`, { x: pad, y: pad, w: canvas.width - pad * 2, h: Math.round(rows * 0.28) }, '700', SANS, '#000000');
  // Regla: una marca cada 5 mm, la de 10 mm más larga
  const rulerMm = Math.max(5, Math.floor((spec.widthMm - 8) / 5) * 5);
  const x0 = Math.round((canvas.width - rulerMm * perMm) / 2);
  const baseY = pad + Math.round(rows * 0.62);
  ctx.fillRect(x0, baseY, Math.round(rulerMm * perMm), 2);
  for (let mmMark = 0; mmMark <= rulerMm; mmMark += 5) {
    const long = mmMark % 10 === 0;
    ctx.fillRect(x0 + Math.round(mmMark * perMm) - 1, baseY - (long ? Math.round(rows * 0.2) : Math.round(rows * 0.12)), 2, long ? Math.round(rows * 0.2) : Math.round(rows * 0.12));
  }
  drawFitted(ctx, `Esta regla debe medir ${rulerMm} mm`, { x: pad, y: baseY + 6, w: canvas.width - pad * 2, h: Math.max(10, Math.round(rows * 0.2)) }, '700', SANS, '#000000');
  return canvas;
}

/** Pasa un canvas a blanco y negro para la impresora. */
export function canvasToBitmap(canvas: HTMLCanvasElement): MonoBitmap {
  const ctx = canvas.getContext('2d');
  const pixels = ctx ? ctx.getImageData(0, 0, canvas.width, canvas.height).data : new Uint8ClampedArray(canvas.width * canvas.height * 4).fill(255);
  return toMonoBitmap(pixels, canvas.width, canvas.height);
}

/** La imagen de la etiqueta en blanco y negro, lista para la impresora. */
export function renderLabelBitmap(render: LabelRender): MonoBitmap {
  return canvasToBitmap(renderLabelCanvas(render));
}

/** ¿El código de barras cabe con barras de al menos 1 punto? Si no, se avisa que el SKU es demasiado largo para esta etiqueta. */
export function barcodeFits(sku: string, spec: LabelSpec, showStore: boolean): boolean {
  const geometry = layoutLabel(spec, { showStore, hasDetail: false });
  return pickModuleWidth(sku.trim().length, Math.floor(geometry.barcode.w * 0.92)).fits;
}
