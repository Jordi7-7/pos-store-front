import { describe, expect, it } from 'vitest';
import { roundQuantity } from './quantity';

describe('roundQuantity', () => {
  it('quita el ruido de coma flotante a 2 decimales', () => {
    expect(roundQuantity(0.3 - 0.1)).toBe(0.2);
    expect(roundQuantity(0.1 + 0.2)).toBe(0.3);
  });

  it('deja intactos los enteros y los valores ya redondeados', () => {
    expect(roundQuantity(5)).toBe(5);
    expect(roundQuantity(1.25)).toBe(1.25);
  });
});
