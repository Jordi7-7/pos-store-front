import { numeroALetras } from 'numero-a-letras-es';
import type { TicketSaleData } from '../components/pos/ThermalTicketModal';
import { CashSessionStatus } from '@/modules/cash-sessions/enums';
import { PaymentMethod } from '../enums';

export type PaperWidth = '58mm' | '80mm';

export interface EscPosOptions {
  paperWidth?: PaperWidth;
  openDrawer?: boolean;
  cutPaper?: boolean;
  tenantName?: string;
  tenantRuc?: string;
  currencyCode?: string;
}

/**
 * Generador nativo de comandos ESC/POS en formato Uint8Array sin dependencias externas.
 * Soporta anchos de 58mm (32 columnas) y 80mm (42 columnas) y caracteres en español.
 */
export class EscPosBuilder {
  private buffer: number[] = [];
  private readonly maxCols: number;

  constructor(paperWidth: PaperWidth = '58mm') {
    // 58mm = 32 columnas estándar | 80mm = 42 columnas estándar
    this.maxCols = paperWidth === '80mm' ? 42 : 32;
    this.init();
  }

  /** Inicializar impresora (ESC @) */
  init(): this {
    this.buffer.push(0x1b, 0x40);
    return this;
  }

  /** Seleccionar tabla de caracteres Multilingual CP850 (ESC t 2) */
  setCodePage(): this {
    this.buffer.push(0x1b, 0x74, 0x02);
    return this;
  }

  /** Alineación (ESC a n: 0=Left, 1=Center, 2=Right) */
  align(alignment: 'left' | 'center' | 'right'): this {
    const val = alignment === 'center' ? 1 : alignment === 'right' ? 2 : 0;
    this.buffer.push(0x1b, 0x61, val);
    return this;
  }

  /** Modo Negrita (ESC E n) */
  bold(enable: boolean): this {
    this.buffer.push(0x1b, 0x45, enable ? 1 : 0);
    return this;
  }

  /** Tamaño de texto (GS ! n) */
  textSize(width: 1 | 2 = 1, height: 1 | 2 = 1): this {
    const n = ((width - 1) << 4) | (height - 1);
    this.buffer.push(0x1d, 0x21, n);
    return this;
  }

  /** Normaliza texto en español para impresoras térmicas (reemplaza acentos problemáticos) */
  private sanitizeText(text: string): string {
    return text
      .replace(/[áàäâ]/gi, 'a')
      .replace(/[éèëê]/gi, 'e')
      .replace(/[íìïî]/gi, 'i')
      .replace(/[óòöô]/gi, 'o')
      .replace(/[úùüû]/gi, 'u')
      .replace(/ñ/g, 'n')
      .replace(/Ñ/g, 'N');
  }

  /** Escribe una cadena cruda en el buffer seguida de Line Feed (0x0A) */
  private rawLine(clean: string): this {
    for (let i = 0; i < clean.length; i++) {
      this.buffer.push(clean.charCodeAt(i) & 0xff);
    }
    this.buffer.push(0x0a); // Line Feed
    return this;
  }

  /** Escribe texto dividiéndolo limpiamente por palabras si supera el ancho de columna de la impresora */
  wrappedLines(text: string): this {
    const clean = this.sanitizeText(text).trim();
    if (!clean) {
      return this.rawLine('');
    }

    if (clean.length <= this.maxCols) {
      return this.rawLine(clean);
    }

    const words = clean.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      if (!currentLine) {
        currentLine = word;
      } else if (currentLine.length + 1 + word.length <= this.maxCols) {
        currentLine += ' ' + word;
      } else {
        this.rawLine(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) {
      this.rawLine(currentLine);
    }

    return this;
  }

  /** Escribe texto con salto de línea. Si el texto supera el ancho de la impresora, lo divide por palabras */
  line(text: string = ''): this {
    const clean = this.sanitizeText(text);
    if (clean.length > this.maxCols && clean.includes(' ')) {
      return this.wrappedLines(clean);
    }
    return this.rawLine(clean);
  }

  /** Imprime una línea divisoria de guiones de ancho exacto */
  separator(): this {
    return this.line('-'.repeat(this.maxCols));
  }

  /** Imprime dos columnas perfectamente justificadas (izquierda y derecha) */
  row(left: string, right: string, padChar: string = ' '): this {
    const cleanLeft = this.sanitizeText(left);
    const cleanRight = this.sanitizeText(right);
    const totalLen = cleanLeft.length + cleanRight.length;

    if (totalLen >= this.maxCols) {
      // Truncar izquierda para dejar espacio a la derecha
      const maxLeftLen = Math.max(1, this.maxCols - cleanRight.length - 1);
      const truncatedLeft = cleanLeft.substring(0, maxLeftLen);
      const spaces = this.maxCols - (truncatedLeft.length + cleanRight.length);
      return this.line(truncatedLeft + padChar.repeat(Math.max(1, spaces)) + cleanRight);
    }

    const spaces = this.maxCols - totalLen;
    return this.line(cleanLeft + padChar.repeat(spaces) + cleanRight);
  }

  /** Cortar papel (GS V 0) */
  cut(): this {
    this.buffer.push(0x0a, 0x0a, 0x0a); // Avanzar 3 líneas antes de cortar
    this.buffer.push(0x1d, 0x56, 0x00);
    return this;
  }

  /** Abrir cajón monedero (ESC p 0 25 250) */
  openCashDrawer(): this {
    this.buffer.push(0x1b, 0x70, 0x00, 0x19, 0xfa);
    return this;
  }

  /** Devuelve el buffer binario final listo para enviar al puerto USB */
  encode(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

/**
 * Convierte los datos de una venta en un buffer ESC/POS optimizado.
 */
export function buildSaleReceiptBytes(
  saleData: TicketSaleData,
  options: EscPosOptions = {}
): Uint8Array {
  const width = options.paperWidth || '58mm';
  const builder = new EscPosBuilder(width);

  // Apertura de cajón monedero si está habilitado
  if (options.openDrawer !== false) {
    builder.openCashDrawer();
  }

  // 1. Encabezado
  builder
    .align('center')
    .bold(true)
    .textSize(1, 2)
    .line(saleData.branchName.toUpperCase())
    .textSize(1, 1);

  if (options.tenantRuc) {
    builder.line(`RFC: ${options.tenantRuc}`);
  }
  if (saleData.branchAddress) {
    builder.line(saleData.branchAddress.toUpperCase());
  }

  builder.bold(false).separator();

  // 2. Metadatos
  builder
    .align('left')
    .row('FOLIO:', saleData.invoiceNumber)
    .row('VENDEDOR:', saleData.userName || '01000001')
    .row('FECHA:', saleData.createdAt)
    .row('CLIENTE:', saleData.clientName)
    .separator();

  // 3. Encabezado de Productos
  builder.bold(true);
  if (width === '80mm') {
    builder.row('CANT  DESCRIPCION', 'TOTAL');
  } else {
    builder.row('CANT DESCRIPCION', 'TOTAL');
  }
  builder.bold(false).separator();

  // 4. Lista de Ítems
  saleData.items.forEach((item) => {
    const qty = Number(item.quantity || 1);
    const unitPrice = Number(item.price || 0);
    const unitDiscount = Number(item.discountAmount || 0);
    const totalLinePrice = unitPrice * qty;
    const totalLineDiscount = unitDiscount * qty;

    const titleLine = `${item.variantSku ? item.variantSku + ' ' : ''}${item.productName}`.toUpperCase();
    builder.line(titleLine);

    builder.row(` ${qty} x $${unitPrice.toFixed(2)}`, `$${totalLinePrice.toFixed(2)}`);

    if (totalLineDiscount > 0) {
      const pct = unitPrice > 0 ? Math.round((unitDiscount / unitPrice) * 100) : 0;
      const discountLabel = pct > 0
        ? (qty > 1 ? `   Desc. (-${pct}% x${qty}):` : `   Desc. (-${pct}%):`)
        : (qty > 1 ? `   Desc. Ítem (x${qty}):` : `   Desc. Ítem:`);
      builder.row(discountLabel, `-$${totalLineDiscount.toFixed(2)}`);
    }
  });

  builder.separator();

  // 5. Totales
  const totalPieces = saleData.items.reduce((acc, item) => acc + Number(item.quantity || 0), 0);
  const grossSubtotal = Number(saleData.subtotal || saleData.total);
  const itemsDiscount = Number(saleData.itemsDiscountAmount || 0);
  const globalDiscount = Number(saleData.globalDiscountAmount || 0);
  const totalDiscount = Number(saleData.discountAmount || (itemsDiscount + globalDiscount));
  const totalToPay = Number(saleData.total);

  // Porcentaje del descuento global
  const netSubtotalBase = Math.max(0, grossSubtotal - itemsDiscount);
  const globalPct = netSubtotalBase > 0 && globalDiscount > 0
    ? Math.round((globalDiscount / netSubtotalBase) * 100)
    : 0;
  const globalDescLabel = globalPct > 0 ? `DESC. GENERAL (-${globalPct}%):` : 'DESC. GENERAL:';

  builder.row('Piezas:', `${totalPieces}`);
  builder.separator();

  // Caso 1: Tiene AMBOS descuentos (por producto Y global de venta)
  if (itemsDiscount > 0 && globalDiscount > 0) {
    builder
      .row('SUBTOTAL BRUTO:', `$${grossSubtotal.toFixed(2)}`)
      .row('DESC. PRODUCTOS:', `-$${itemsDiscount.toFixed(2)}`)
      .separator()
      .row('SUBTOTAL NETO:', `$${netSubtotalBase.toFixed(2)}`)
      .row(globalDescLabel, `-$${globalDiscount.toFixed(2)}`)
      .separator();
  }
  // Caso 2: Solo descuento de productos
  else if (itemsDiscount > 0) {
    builder
      .row('SUBTOTAL:', `$${grossSubtotal.toFixed(2)}`)
      .row('DESC. PRODUCTOS:', `-$${itemsDiscount.toFixed(2)}`)
      .separator();
  }
  // Caso 3: Solo descuento global de venta
  else if (globalDiscount > 0) {
    builder
      .row('SUBTOTAL:', `$${grossSubtotal.toFixed(2)}`)
      .row(globalDescLabel, `-$${globalDiscount.toFixed(2)}`)
      .separator();
  }
  // Caso 4: Descuento genérico (si solo viene discountAmount)
  else if (totalDiscount > 0) {
    builder
      .row('SUBTOTAL:', `$${grossSubtotal.toFixed(2)}`)
      .row('DESCUENTO:', `-$${totalDiscount.toFixed(2)}`)
      .separator();
  }
  // Caso 5: Sin descuentos
  else {
    builder
      .row('SUBTOTAL:', `$${grossSubtotal.toFixed(2)}`)
      .separator();
  }

  // TOTAL A PAGAR (Destacado)
  builder.bold(true);
  builder.row('TOTAL A PAGAR:', `$${totalToPay.toFixed(2)}`);
  builder.bold(false);

  // Leyenda de Ahorro
  if (totalDiscount > 0) {
    builder
      .align('center')
      .line(`¡Su ahorro total fue de $${totalDiscount.toFixed(2)}!`);
  }

  // Texto en letras
  const currency = (options.currencyCode || 'MXN').toUpperCase();
  try {
    const letras = numeroALetras(totalToPay, { moneda: currency, mayusculas: true });
    builder.align('center').line(`Son: ${letras}`);
  } catch {
    // Fallback silencioso si numeroALetras falla
  }

  builder.separator();

  // 6. Pie de Ticket
  builder
    .align('center')
    .bold(true)
    .line('NO SE ACEPTAN CAMBIOS NI DEVOLUCIONES')
    .line('CONSERVA ESTE TICKET PARA CUALQUIER ACLARACION');

  // Corte de papel
  if (options.cutPaper !== false) {
    builder.cut();
  }

  return builder.encode();
}

function formatClosingDateTime(dateStr?: string): string {
  if (!dateStr) return '---';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '---';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${mins}`;
  } catch {
    return '---';
  }
}

function formatShiftDuration(openDateStr?: string, closeDateStr?: string): string {
  if (!openDateStr) return '---';
  try {
    const start = new Date(openDateStr).getTime();
    const end = closeDateStr ? new Date(closeDateStr).getTime() : Date.now();
    if (isNaN(start) || isNaN(end) || end < start) return '---';
    const diffMs = end - start;
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  } catch {
    return '---';
  }
}

/**
 * Convierte los datos de un Cierre de Caja en un ticket de auditoria estructurado y profesional.
 * Separa claramente el Arqueo de Efectivo Fisico del Resumen General de Ventas, con doble firma.
 */
export function buildClosingReceiptBytes(
  sessionData: any,
  options: EscPosOptions = {}
): Uint8Array {
  const width = options.paperWidth || '58mm';
  const builder = new EscPosBuilder(width);

  if (options.openDrawer !== false) {
    builder.openCashDrawer();
  }

  // 1. Cabecera Comercial (Sucursal en lugar de tenant)
  builder.align('center');
  const branchHeader = (sessionData.branchName || 'SUCURSAL').toUpperCase();
  builder
    .bold(true)
    .textSize(1, 2)
    .line(branchHeader)
    .textSize(1, 1)
    .bold(false);

  if (options.tenantRuc) {
    builder.line(`RFC/RUC: ${options.tenantRuc.toUpperCase()}`);
  }
  if (sessionData.branchAddress) {
    builder.line(sessionData.branchAddress.toUpperCase());
  }

  // Determinar si es Corte Z (Cierre definitivo) o Corte X (Arqueo Parcial)
  const isClosed = sessionData.status === CashSessionStatus.CLOSED || !!sessionData.closedAt;
  builder
    .bold(true)
    .line(isClosed ? 'CORTE Z (CIERRE)' : 'CORTE X (ARQUEO)')
    .bold(false);

  if (sessionData.cashRegisterName) {
    builder.line(`CAJA: ${sessionData.cashRegisterName.toUpperCase()}`);
  }
  builder.separator();

  // 2. Metadatos de la Sesion
  builder
    .align('left')
    .row('SESION FOLIO:', sessionData.id ? sessionData.id.slice(0, 8).toUpperCase() : '---')
    .row('CAJERO:', (sessionData.userName || 'Usuario').toUpperCase())
    .row('APERTURA:', formatClosingDateTime(sessionData.openedAt))
    .row('CIERRE:', sessionData.closedAt ? formatClosingDateTime(sessionData.closedAt) : 'TURNO ACTIVO')
    .row('DURACION:', formatShiftDuration(sessionData.openedAt, sessionData.closedAt))
    .separator();

  // 3. Arqueo de Efectivo Fisico (Cajon)
  const openingCash = Number(sessionData.openingBalance || 0);
  const cashSales = Number(sessionData.cashSales ?? sessionData.paymentsBreakdown?.[PaymentMethod.EFECTIVO] ?? 0);
  const expenses = Number(sessionData.expensesTotal || 0);
  const refunds = Number(sessionData.refundsTotal || 0);
  const expectedCash = Number(sessionData.expectedBalance ?? (openingCash + cashSales - expenses - refunds));
  const countedCash = isClosed
    ? Number(sessionData.closingBalance ?? expectedCash)
    : expectedCash;
  const cashDiff = isClosed ? countedCash - expectedCash : 0;

  builder
    .bold(true)
    .line('ARQUEO DE EFECTIVO (CAJON)')
    .bold(false)
    .row('(+) Fondo Inicial:', `$${openingCash.toFixed(2)}`)
    .row('(+) Cobros Efectivo:', `$${cashSales.toFixed(2)}`)
    .row('(-) Gastos en Caja:', `-$${expenses.toFixed(2)}`);

  if (refunds > 0) {
    builder.row('(-) Devoluciones Efec:', `-$${refunds.toFixed(2)}`);
  }

  builder
    .separator()
    .bold(true)
    .row('(=) EFECTIVO ESPERADO:', `$${expectedCash.toFixed(2)}`);

  if (isClosed) {
    builder.row('(=) EFECTIVO CONTADO:', `$${countedCash.toFixed(2)}`);
    if (Math.abs(cashDiff) < 0.01) {
      builder.row('ESTADO:', 'CUADRADA ($0.00)');
    } else if (cashDiff > 0) {
      builder.row('ESTADO:', `SOBRANTE (+$${cashDiff.toFixed(2)})`);
    } else {
      builder.row('ESTADO:', `FALTANTE (-$${Math.abs(cashDiff).toFixed(2)})`);
    }
  } else {
    builder.row('ESTADO:', 'TURNO EN CURSO');
  }

  builder.bold(false).separator();

  // 4. Resumen General de Ventas (Todos los Medios)
  const salesCount = Number(sessionData.salesCount || sessionData.salesList?.length || 0);
  const totalPieces = Number(sessionData.totalPieces || 0);
  const totalSales = Number(sessionData.salesTotal || 0);
  const cardSales = Number(sessionData.cardSales ?? sessionData.paymentsBreakdown?.[PaymentMethod.TARJETA] ?? 0);
  const avgTicket = salesCount > 0 ? totalSales / salesCount : 0;

  builder
    .bold(true)
    .line('RESUMEN GENERAL VENTAS')
    .bold(false)
    .row('Tickets Emitidos:', `${salesCount}`)
    .row('Piezas Vendidas:', `${totalPieces}`)
    .row('Ticket Promedio:', `$${avgTicket.toFixed(2)}`)
    .row('Ventas Efectivo:', `$${cashSales.toFixed(2)}`)
    .row('Ventas Tarjeta/Dig:', `$${cardSales.toFixed(2)}`);

  // Otros metodos de pago si existieran (ej. TRANSFERENCIA)
  if (sessionData.paymentsBreakdown) {
    Object.entries(sessionData.paymentsBreakdown).forEach(([method, amount]) => {
      const mUpper = method.toUpperCase();
      if (mUpper !== PaymentMethod.EFECTIVO && mUpper !== PaymentMethod.TARJETA && Number(amount) > 0) {
        builder.row(`Ventas ${mUpper.slice(0, 10)}:`, `$${Number(amount).toFixed(2)}`);
      }
    });
  }

  // Si hubo devoluciones en el turno, mostrarlas como deducción de ventas
  if (refunds > 0) {
    builder.row('(-) Devoluciones/Reemb:', `-$${refunds.toFixed(2)}`);
  }

  builder
    .separator()
    .bold(true)
    .row('TOTAL VENTAS NETAS:', `$${totalSales.toFixed(2)}`)
    .bold(false)
    .separator();

  // 5. Desglose de Gastos de Turno (si existen)
  if (sessionData.expensesList && sessionData.expensesList.length > 0) {
    builder.bold(true).line('DETALLE DE GASTOS').bold(false);
    sessionData.expensesList.forEach((exp: any) => {
      const maxDesc = width === '80mm' ? 24 : 16;
      const desc = (exp.description || 'Gasto').slice(0, maxDesc);
      builder.row(` ${desc}`, `-$${Number(exp.amount).toFixed(2)}`);
    });
    builder
      .bold(true)
      .row('TOTAL GASTOS:', `-$${expenses.toFixed(2)}`)
      .bold(false)
      .separator();
  }

  // 6. Auditoria y Doble Firma
  builder.line('').line('');
  if (width === '80mm') {
    builder
      .align('center')
      .line('-----------------    -----------------')
      .line('  FIRMA CAJERO       FIRMA SUPERVISOR ')
      .line('');
  } else {
    builder
      .align('center')
      .line('-------------    -------------')
      .line('FIRMA CAJERO      FIRMA SUPERV')
      .line('');
  }

  if (options.cutPaper !== false) {
    builder.cut();
  }

  return builder.encode();
}
