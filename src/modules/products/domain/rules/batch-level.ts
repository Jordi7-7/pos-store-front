export type StockLevel = 'high' | 'medium' | 'low';

/** Qué tan lleno está un lote o una línea según el porcentaje que queda: más de 50 alto, más de 20 medio, el resto bajo. */
export function stockLevel(percentRemaining: number): StockLevel {
  if (percentRemaining > 50) return 'high';
  if (percentRemaining > 20) return 'medium';
  return 'low';
}

/** Ancho de la barra de progreso: el porcentaje acotado entre 0 y 100. */
export function barWidth(percentRemaining: number): number {
  return Math.min(100, Math.max(0, percentRemaining));
}
