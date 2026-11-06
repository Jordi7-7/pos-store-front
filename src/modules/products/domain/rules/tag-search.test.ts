import { describe, expect, it } from 'vitest';
import { canCreateTag, filterTags } from './tag-search';

const tags = [{ name: 'Oferta' }, { name: 'Nuevo' }, { name: 'Ofertón' }];

describe('búsqueda de etiquetas', () => {
  it('filtra por contenido sin distinguir mayúsculas; vacío devuelve todas', () => {
    expect(filterTags(tags, 'OFERT').map((t) => t.name)).toEqual(['Oferta', 'Ofertón']);
    expect(filterTags(tags, '')).toHaveLength(3);
  });

  it('solo se crea si hay texto y no existe una igual (sin mayúsculas ni espacios de más)', () => {
    expect(canCreateTag(tags, '  ')).toBe(false);
    expect(canCreateTag(tags, ' oferta ')).toBe(false);
    expect(canCreateTag(tags, 'Liquidación')).toBe(true);
  });
});
