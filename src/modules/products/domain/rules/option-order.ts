import type { AttributeEntity } from '../entities/catalog.entity';
import type { ProductVariantEntity } from '../entities/product.entity';

export interface OrderableOption {
  id: string;
  value: string;
}

/** Mueve el elemento de la posición `index` una posición arriba (-1) o abajo (+1); en el borde no hace nada. */
export function moveItem<T>(items: readonly T[], index: number, delta: -1 | 1): T[] {
  const target = index + delta;
  const item = items[index];
  if (item === undefined || target < 0 || target >= items.length) return [...items];
  const next = [...items];
  next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}

/** Lugar de una talla de letras en la escala (S = 0, M = 1, L = 2, XL = 3, XXL = 4…); `null` si no es una talla de letras. */
function letterSizeRank(text: string): number | null {
  const size = text.toUpperCase().replace(/[\s.]/g, '');
  const base: Record<string, number> = { S: 0, M: 1, L: 2, CH: 0, G: 2 };
  if (size in base) return base[size] ?? null;
  const repeated = /^(X{1,4})([SL])$/.exec(size); // XS, XXS, XL, XXL…
  const counted = /^(\d)X([SL])$/.exec(size); // 2XL, 3XS…
  const match = repeated ?? counted;
  if (!match) return null;
  const extra = repeated ? (match[1] ?? '').length : Number(match[1]);
  return match[2] === 'L' ? 2 + extra : 0 - extra;
}

const numberOf = (text: string): number | null => {
  const value = Number(text.trim().replace(',', '.'));
  return text.trim() !== '' && Number.isFinite(value) ? value : null;
};

/**
 * Propuesta de orden para tallas: todas de letras (XS, S, M, L, XL, 2XL…) o todas números (38, 38.5, 40…), de menor a mayor.
 * Devuelve `null` si las opciones no son de ese tipo (colores, materiales…), para no inventar un orden.
 */
export function suggestSizeOrder<T extends OrderableOption>(options: readonly T[]): T[] | null {
  if (options.length < 2) return null;
  const letters = options.map((option) => letterSizeRank(option.value));
  if (letters.every((rank): rank is number => rank !== null)) {
    return options.map((option, index) => ({ option, rank: letters[index] ?? 0 })).sort((a, b) => a.rank - b.rank).map((item) => item.option);
  }
  const numbers = options.map((option) => numberOf(option.value));
  if (numbers.every((value): value is number => value !== null)) {
    return options.map((option, index) => ({ option, rank: numbers[index] ?? 0 })).sort((a, b) => a.rank - b.rank).map((item) => item.option);
  }
  return null;
}

/** Orden alfabético sin distinguir mayúsculas ni acentos, con los números por su valor (`Talla 2` antes que `Talla 10`). */
export function sortAlphabetically<T extends OrderableOption>(options: readonly T[]): T[] {
  return [...options].sort((a, b) => a.value.localeCompare(b.value, 'es', { numeric: true, sensitivity: 'base' }));
}

/**
 * Variantes de un producto en el orden de las opciones del catálogo: primero por el primer atributo (el que lleva la variante
 * en primer lugar), luego por el segundo… Las que no se pueden comparar (sin ids de valor) conservan su orden.
 */
export function sortVariantsByOptions<V extends { attributes: ProductVariantEntity['attributes'] }>(variants: readonly V[], catalog: readonly AttributeEntity[]): V[] {
  const position = new Map<string, number>();
  for (const attribute of catalog) attribute.values.forEach((value, index) => position.set(value.id, index));
  const keyOf = (variant: V): number[] => variant.attributes.map((attribute) => (attribute.valueId ? (position.get(attribute.valueId) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER));
  return variants
    .map((variant, index) => ({ variant, index, key: keyOf(variant) }))
    .sort((a, b) => {
      for (let i = 0; i < Math.max(a.key.length, b.key.length); i++) {
        const diff = (a.key[i] ?? Number.MAX_SAFE_INTEGER) - (b.key[i] ?? Number.MAX_SAFE_INTEGER);
        if (diff !== 0) return diff;
      }
      return a.index - b.index;
    })
    .map((item) => item.variant);
}
