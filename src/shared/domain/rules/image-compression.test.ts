import { describe, expect, it } from 'vitest';
import { keepCompressed } from './image-compression';

describe('compresión de fotos', () => {
  it('solo se usa la versión comprimida si ahorra al menos un 10 %', () => {
    expect(keepCompressed(1000, 900)).toBe(true);
    expect(keepCompressed(1000, 901)).toBe(false);
    expect(keepCompressed(1000, 1200)).toBe(false);
    expect(keepCompressed(1000, 0)).toBe(false);
  });
});
