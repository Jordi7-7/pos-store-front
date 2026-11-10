import { describe, expect, it } from 'vitest';
import { requireDateRange, todayInTimezone, todayRange } from './date-range';

describe('todayInTimezone', () => {
  // 03:00 UTC del 9 de nov: en Guayaquil (UTC-5) todavía es el 8; en Tokio (UTC+9) ya son las 12:00 del 9
  const instant = new Date('2026-11-09T03:00:00Z');

  it('usa el día de la zona de la tienda, no el del navegador', () => {
    expect(todayInTimezone('America/Guayaquil', instant)).toEqual(new Date(2026, 10, 8));
    expect(todayInTimezone('Asia/Tokyo', instant)).toEqual(new Date(2026, 10, 9));
  });

  it('el rango por defecto es solo hoy', () => {
    const range = todayRange('America/Guayaquil', instant);
    expect(range.from).toEqual(new Date(2026, 10, 8));
    expect(range.to).toEqual(range.from);
  });
});

describe('requireDateRange', () => {
  const current = { from: new Date(2026, 10, 1), to: new Date(2026, 10, 5) };

  it('no deja el filtro vacío: conserva el rango anterior', () => {
    expect(requireDateRange(undefined, current)).toBe(current);
    expect(requireDateRange({ from: undefined, to: undefined }, current)).toBe(current);
  });

  it('un rango con solo inicio es ese único día', () => {
    const day = new Date(2026, 10, 9);
    expect(requireDateRange({ from: day }, current)).toEqual({ from: day, to: day });
  });

  it('acepta un rango completo', () => {
    const next = { from: new Date(2026, 9, 1), to: new Date(2026, 9, 31) };
    expect(requireDateRange(next, current)).toEqual(next);
  });
});
