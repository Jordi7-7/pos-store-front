import JsBarcode from 'jsbarcode';
import type { LabelItem } from '../../domain/entities/label';
import type { TicketFormat } from '../../domain/entities/ticket';
import { barcodeQuality, pickModuleWidth, type BarcodeQuality } from '../../domain/rules/barcode-fit';
import { toMonoBitmap, type MonoBitmap } from '../../domain/rules/label-bitmap';
import { layoutBarcodeOnly, layoutLabel, type Box, type LabelSpec } from '../../domain/rules/label-layout';
import { labelPriceText } from '../../domain/rules/label-price';
import { codesPerLabel, type LabelSheet, type LabelStyle } from '../../domain/rules/label-sheets';

export interface LabelRender {
  item: LabelItem;
  storeName: string;
  format: TicketFormat;
  spec: LabelSpec;
  showStore: boolean;
}

/** Lo que hace falta para dibujar una etiqueta física (con uno o dos códigos). */
export interface SheetRender {
  sheet: LabelSheet;
  storeName: string;
  format: TicketFormat;
  spec: LabelSpec;
  style: LabelStyle;
}

/** Ancho útil para las barras: se deja aire a los lados para que el escáner reconozca dónde empieza el código. */
const barsWidth = (box: Box): number => Math.floor(box.w * 0.92);

/** Dibuja el CODE128 del SKU centrado en la caja, con la barra más ancha que quepa. */
function drawBarcode(ctx: CanvasRenderingContext2D, sku: string, box: Box): void {
  const { narrow } = pickModuleWidth(sku.length, barsWidth(box));
  try {
    const barcode = document.createElement('canvas');
    JsBarcode(barcode, sku, { format: 'CODE128', width: narrow, height: box.h, displayValue: false, margin: 0, background: '#ffffff', lineColor: '#000000' });
    // Si ni con barras de 1 punto cabe, se encoge al ancho disponible (el escáner puede costar más; se avisa en pantalla)
    const width = Math.min(barcode.width, box.w);
    ctx.drawImage(barcode, 0, 0, barcode.width, barcode.height, Math.round(box.x + (box.w - width) / 2), box.y, width, box.h);
  } catch {
    drawFitted(ctx, sku, box, '700', 'monospace', '#000000');
  }
}

function blankCanvas(widthDots: number, heightDots: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D | null } {
  const canvas = document.createElement('canvas');
  canvas.width = widthDots;
  canvas.height = heightDots;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, widthDots, heightDots);
    ctx.imageSmoothingEnabled = false;
  }
  return { canvas, ctx };
}

/** Solo los códigos de barras con su número; con dos, una línea punteada marca por dónde cortar. */
function renderBarcodeOnlyCanvas({ sheet, spec, style }: SheetRender): HTMLCanvasElement {
  const geometry = layoutBarcodeOnly(spec, codesPerLabel(style));
  const { canvas, ctx } = blankCanvas(geometry.widthDots, geometry.heightDots);
  if (!ctx) return canvas;
  sheet.items.forEach((item, index) => {
    const slot = geometry.slots[index];
    if (!slot) return;
    const sku = item.sku.trim();
    drawBarcode(ctx, sku, slot.barcode);
    drawFitted(ctx, sku, slot.code, '700', 'monospace', '#000000');
  });
  if (geometry.cutY !== null) {
    ctx.fillStyle = '#000000';
    for (let x = 0; x < geometry.widthDots; x += 12) ctx.fillRect(x, geometry.cutY, 6, 1);
  }
  return canvas;
}

/** La imagen de una etiqueta física según lo que se haya elegido imprimir. */
export function renderSheetCanvas(render: SheetRender): HTMLCanvasElement {
  if (render.style.content === 'BARCODE') return renderBarcodeOnlyCanvas(render);
  const [item] = render.sheet.items;
  if (!item) return blankCanvas(1, 1).canvas;
  return renderLabelCanvas({ item, storeName: render.storeName, format: render.format, spec: render.spec, showStore: render.style.showStore });
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
  drawBarcode(ctx, sku, geometry.barcode);
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

/** La imagen de una etiqueta física en blanco y negro, lista para la impresora. */
export function renderSheetBitmap(render: SheetRender): MonoBitmap {
  return canvasToBitmap(renderSheetCanvas(render));
}

/** Cómo se leerá el código de este SKU en una etiqueta de este tamaño (el ancho útil es el mismo en los dos diseños). */
export function labelBarcodeQuality(sku: string, spec: LabelSpec): BarcodeQuality {
  const [slot] = layoutBarcodeOnly(spec, 1).slots;
  return barcodeQuality(sku.trim().length, slot ? barsWidth(slot.barcode) : 0);
}
