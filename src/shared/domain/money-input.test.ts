import { describe, expect, it } from 'vitest';
import { parseMoneyInput, parsePositiveMoneyInput } from './money-input';

describe('importes escritos por el usuario', () => {
  it('acepta importes válidos, con o sin decimales, y el cero', () => {
    expect(parseMoneyInput('100')).toBe(100);
    expect(parseMoneyInput(' 100.50 ')).toBe(100.5);
    expect(parseMoneyInput('0')).toBe(0);
  });

  it('rechaza vacío, texto, negativos y valores no finitos', () => {
    for (const bad of ['', '   ', 'abc', '-5', '1e', 'NaN', 'Infinity']) expect(parseMoneyInput(bad), bad).toBeNull();
  });

  it('el positivo además rechaza el cero', () => {
    expect(parsePositiveMoneyInput('0.01')).toBe(0.01);
    expect(parsePositiveMoneyInput('0')).toBeNull();
    expect(parsePositiveMoneyInput('-1')).toBeNull();
  });
});
