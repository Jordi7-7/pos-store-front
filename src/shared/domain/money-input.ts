import { Money } from './money';

/**
 * Importes escritos por el usuario en un campo de texto. Devuelven `null` si no son un importe
 * válido, para que el caso de uso decida qué error comunicar (nunca `NaN` ni valores negativos).
 */

/** Importe mayor o igual a cero; vacío o inválido → `null`. */
export function parseMoneyInput(input: string): number | null {
  const text = input.trim();
  if (text === '') return null;
  try {
    const value = Money.of(text);
    return value.isNegative() ? null : value.toNumber();
  } catch {
    return null;
  }
}

/** Importe estrictamente mayor que cero; vacío, inválido o cero → `null`. */
export function parsePositiveMoneyInput(input: string): number | null {
  const value = parseMoneyInput(input);
  return value !== null && value > 0 ? value : null;
}
