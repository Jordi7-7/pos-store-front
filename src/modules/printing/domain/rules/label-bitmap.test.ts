import { describe, expect, it } from 'vitest';
import { toMonoBitmap } from './label-bitmap';

/** Píxeles RGBA de una fila: 'B' negro, 'W' blanco, 'G' gris claro, 'T' transparente. */
const pixels = (rows: string[]): number[] =>
  rows.flatMap((row) => [...row].flatMap((c) => (c === 'B' ? [0, 0, 0, 255] : c === 'W' ? [255, 255, 255, 255] : c === 'G' ? [200, 200, 200, 255] : [0, 0, 0, 0])));

describe('imagen en blanco y negro', () => {
  it('empaqueta 8 puntos por byte, el primero en el bit más alto, con 1 = negro', () => {
    const bitmap = toMonoBitmap(pixels(['BWWWWWWB']), 8, 1);
    expect(bitmap.widthBytes).toBe(1);
    expect([...bitmap.bytes]).toEqual([0b10000001]);
  });

  it('el ancho que no es múltiplo de 8 se completa con blanco a la derecha', () => {
    const bitmap = toMonoBitmap(pixels(['BBBBBBBBB']), 9, 1);
    expect(bitmap.widthBytes).toBe(2);
    expect([...bitmap.bytes]).toEqual([0xff, 0b10000000]);
  });

  it('el gris claro y lo transparente son papel; cada fila empieza en su propio byte', () => {
    const bitmap = toMonoBitmap(pixels(['GTWWWWWW', 'BBBBBBBB']), 8, 2);
    expect([...bitmap.bytes]).toEqual([0x00, 0xff]);
    expect(bitmap.height).toBe(2);
  });
});
