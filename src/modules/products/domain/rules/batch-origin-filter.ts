import { BatchOriginType } from '../enums';

/** Orden en que se ofrecen los tipos de lote en el filtro. */
export const BATCH_ORIGIN_TYPES: readonly BatchOriginType[] = [
  BatchOriginType.PURCHASE,
  BatchOriginType.INITIAL_STOCK,
  BatchOriginType.ADJUSTMENT,
  BatchOriginType.REFUND,
];

/**
 * Marca o desmarca un tipo. Si quedan todos marcados equivale a no filtrar, así que se vuelve a
 * la lista vacía ("Todos"); el resultado siempre sale en el orden del filtro.
 */
export function toggleOriginType(selected: readonly BatchOriginType[], type: BatchOriginType): BatchOriginType[] {
  const next = new Set(selected);
  if (!next.delete(type)) next.add(type);
  if (next.size === BATCH_ORIGIN_TYPES.length) return [];
  return BATCH_ORIGIN_TYPES.filter((candidate) => next.has(candidate));
}
