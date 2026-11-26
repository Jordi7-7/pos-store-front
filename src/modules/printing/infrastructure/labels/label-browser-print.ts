import type { LabelItem } from '../../domain/entities/label';
import type { TicketFormat } from '../../domain/entities/ticket';
import type { LabelSpec } from '../../domain/rules/label-layout';
import { buildSheets, codesPerLabel, type LabelStyle } from '../../domain/rules/label-sheets';
import { renderSheetCanvas } from './label-canvas';

const PRINT_FRAME_ID = 'label-print-frame';

/**
 * Imprime las etiquetas por el diálogo del sistema (cualquier impresora con controlador instalado). Cada etiqueta es una
 * página del tamaño exacto del rollo con la misma imagen de la vista previa.
 */
export function printLabelsWithSystemDriver(items: LabelItem[], storeName: string, format: TicketFormat, spec: LabelSpec, style: LabelStyle): void {
  if (items.length === 0) return;

  const pages = buildSheets(items, codesPerLabel(style)).flatMap((sheet) => {
    const url = renderSheetCanvas({ sheet, storeName, format, spec, style }).toDataURL('image/png');
    return Array.from({ length: sheet.copies }, () => url);
  });

  // La página de la impresión anterior se quita ahora, nunca por tiempo: la ventana del sistema la sigue usando para su vista
  // previa (y al imprimir) mientras la persona no la cierre, y no hay forma fiable de saber cuándo terminó
  document.getElementById(PRINT_FRAME_ID)?.remove();
  const iframe = document.createElement('iframe');
  iframe.id = PRINT_FRAME_ID;
  iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:0;height:0;border:none';
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    return;
  }

  const { widthMm, heightMm } = spec;
  doc.open();
  doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8" /><title>Etiquetas</title><style>
    @page { size: ${widthMm}mm ${heightMm}mm; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { background: #fff; width: ${widthMm}mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { width: ${widthMm}mm; height: ${heightMm}mm; overflow: hidden; break-after: page; }
    .page:last-child { break-after: avoid; }
    img { display: block; width: ${widthMm}mm; height: ${heightMm}mm; image-rendering: pixelated; }
  </style></head><body>${pages.map((url) => `<div class="page"><img src="${url}" alt="Etiqueta" /></div>`).join('')}</body></html>`);
  doc.close();

  const printWindow = iframe.contentWindow;
  const start = () => {
    printWindow?.focus();
    printWindow?.print();
  };
  // Espera a que carguen las imágenes antes de abrir el diálogo
  const images = Array.from(doc.images);
  Promise.all(images.map((image) => (image.complete ? Promise.resolve() : new Promise<void>((resolve) => { image.onload = () => resolve(); image.onerror = () => resolve(); })))).then(start, start);
}
