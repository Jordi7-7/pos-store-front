/** El último código visto y cuándo (ms), para no contar dos veces el mismo mientras sigue frente a la cámara. */
export interface LastScan {
  code: string;
  at: number;
}

/** Deja solo lo imprimible: una cámara puede devolver espacios o saltos de línea pegados al código. */
export const normalizeScan = (raw: string): string => raw.replace(/\p{Cc}/gu, '').trim();

/**
 * ¿Cuenta este código como una lectura nueva? Uno vacío no. El mismo que se está viendo tampoco: con la cámara fija sobre
 * una etiqueta se detecta decenas de veces por segundo, y hasta que no se aparta `absenceMs` no vuelve a contar (así dos
 * prendas iguales, una tras otra, cuentan dos). Uno distinto cuenta al instante. `last.at` es la ÚLTIMA vez que se vio.
 */
export function acceptScan(code: string, last: LastScan | null, now: number, absenceMs: number): boolean {
  if (code === '') return false;
  if (last && last.code === code && now - last.at < absenceMs) return false;
  return true;
}
