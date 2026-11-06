import { describe, expect, it } from 'vitest';
import { toCsv } from './csv';

describe('toCsv', () => {
  it('separa con ; y entrecomilla cada celda', () => {
    expect(toCsv(['SKU', 'Cant.'], [['A-1', 3]])).toBe('SKU;Cant.\n"A-1";"3"');
  });

  it('duplica las comillas internas y respeta ; dentro del texto', () => {
    expect(toCsv(['N'], [['Playera "XL"; azul']])).toBe('N\n"Playera ""XL""; azul"');
  });
});
