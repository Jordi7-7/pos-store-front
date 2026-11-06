import { describe, expect, it } from 'vitest';
import { barWidth, stockLevel } from './batch-level';

describe('nivel de un lote', () => {
  it('los límites 50 y 20 pertenecen al nivel de abajo', () => {
    expect([100, 50.1, 50, 20.1, 20, 0].map(stockLevel)).toEqual(['high', 'high', 'medium', 'medium', 'low', 'low']);
  });

  it('la barra nunca se sale de 0–100', () => {
    expect([-5, 0, 42, 100, 130].map(barWidth)).toEqual([0, 0, 42, 100, 100]);
  });
});
