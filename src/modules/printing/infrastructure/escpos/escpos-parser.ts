export interface EscPosParsedLine {
  text: string;
  align: 'left' | 'center' | 'right';
  bold: boolean;
  doubleWidth: boolean;
  doubleHeight: boolean;
  isCut?: boolean;
  isDrawer?: boolean;
  isOverflow?: boolean;
}

export interface EscPosParseResult {
  lines: EscPosParsedLine[];
  maxCols: number;
  totalChars: number;
  hexDump: string;
  paperWidth: '58mm' | '80mm';
}

/**
 * Decodificador de buffers ESC/POS crudos (Uint8Array).
 * Simula el comportamiento del microcontrolador de una impresora térmica de tickets,
 * respetando alineaciones, negrita, tamaño, saltos de línea y ancho físico de columna.
 */
export function parseEscPosBytes(
  bytes: Uint8Array,
  paperWidth: '58mm' | '80mm' = '58mm'
): EscPosParseResult {
  const maxCols = paperWidth === '80mm' ? 48 : 32;
  const lines: EscPosParsedLine[] = [];

  let currentAlign: 'left' | 'center' | 'right' = 'left';
  let isBold = false;
  let doubleWidth = false;
  let doubleHeight = false;
  let currentChars: string[] = [];

  const flushLine = (special?: { isCut?: boolean; isDrawer?: boolean }) => {
    const text = currentChars.join('');
    // Una línea se considera desbordada si supera el ancho máximo de la impresora
    const effectiveWidth = doubleWidth ? text.length * 2 : text.length;
    const isOverflow = effectiveWidth > maxCols;

    lines.push({
      text,
      align: currentAlign,
      bold: isBold,
      doubleWidth,
      doubleHeight,
      isCut: special?.isCut,
      isDrawer: special?.isDrawer,
      isOverflow,
    });
    currentChars = [];
  };

  let i = 0;
  while (i < bytes.length) {
    const byte = bytes[i] ?? 0;

    // ESC @ (Init / Reset)
    if (byte === 0x1b && bytes[i + 1] === 0x40) {
      currentAlign = 'left';
      isBold = false;
      doubleWidth = false;
      doubleHeight = false;
      i += 2;
      continue;
    }

    // ESC t n (Select code table)
    if (byte === 0x1b && bytes[i + 1] === 0x74) {
      i += 3;
      continue;
    }

    // ESC a n (Align: 0=Left, 1=Center, 2=Right)
    if (byte === 0x1b && bytes[i + 1] === 0x61) {
      const alignVal = bytes[i + 2];
      if (alignVal === 1) currentAlign = 'center';
      else if (alignVal === 2) currentAlign = 'right';
      else currentAlign = 'left';
      i += 3;
      continue;
    }

    // ESC E n (Bold on/off)
    if (byte === 0x1b && bytes[i + 1] === 0x45) {
      isBold = bytes[i + 2] === 1;
      i += 3;
      continue;
    }

    // GS ! n (Character size)
    if (byte === 0x1d && bytes[i + 1] === 0x21) {
      const n = bytes[i + 2] ?? 0;
      doubleWidth = (n & 0x10) !== 0;
      doubleHeight = (n & 0x01) !== 0;
      i += 3;
      continue;
    }

    // ESC p (Open cash drawer: 1B 70 m t1 t2)
    if (byte === 0x1b && bytes[i + 1] === 0x70) {
      flushLine({ isDrawer: true });
      i += 5;
      continue;
    }

    // GS V m (Cut paper: 1D 56 m)
    if (byte === 0x1d && bytes[i + 1] === 0x56) {
      flushLine({ isCut: true });
      i += 3;
      continue;
    }

    // Line Feed (0x0A)
    if (byte === 0x0a) {
      flushLine();
      i++;
      continue;
    }

    // Caracteres imprimibles (ASCII estándar o extendido)
    if (byte >= 0x20) {
      currentChars.push(String.fromCharCode(byte));
      i++;
      continue;
    }

    // Otros bytes de control ignorados de forma segura
    i++;
  }

  // Si quedó texto pendiente sin salto de línea final
  if (currentChars.length > 0) {
    flushLine();
  }

  // Generar volcado Hexadecimal para depuración
  const hexParts: string[] = [];
  for (let idx = 0; idx < bytes.length; idx++) {
    hexParts.push((bytes[idx] ?? 0).toString(16).padStart(2, '0').toUpperCase());
  }
  const hexDump = hexParts.join(' ');

  return {
    lines,
    maxCols,
    totalChars: bytes.length,
    hexDump,
    paperWidth,
  };
}
