export interface ScanResultEntry {
  status: 'ok' | 'error';
  message: string;
  /** Cuántas veces seguidas salió lo mismo (la misma prenda dos veces: «×2»). */
  count: number;
}

/** Las últimas lecturas, la más nueva primero; si es igual a la anterior se suma en vez de repetir la línea. */
export function pushScanResult(history: readonly ScanResultEntry[], entry: Omit<ScanResultEntry, 'count'>, max = 4): ScanResultEntry[] {
  const [latest, ...rest] = history;
  if (latest && latest.status === entry.status && latest.message === entry.message) return [{ ...latest, count: latest.count + 1 }, ...rest].slice(0, max);
  return [{ ...entry, count: 1 }, ...history].slice(0, max);
}
