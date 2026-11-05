import { describe, expect, it } from 'vitest';

/**
 * Guarda de arquitectura: la moneda, el idioma de formato y la zona horaria salen de la tienda
 * (sesión), nunca de valores fijos. Antes había `USD`, `es-EC` y `America/Guayaquil` repartidos
 * por el código, y una tienda en MXN veía importes con otra moneda.
 */

const sources = import.meta.glob(['/src/**/*.ts', '/src/**/*.tsx'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

// Se excluyen los tests, el catálogo shadcn (no es nuestro) y el árbol de rutas generado.
const IGNORED = ['/components/ui/', '/routeTree.gen.ts', '.test.ts', '.test.tsx'];
// Los tickets térmicos y las etiquetas se imprimen con su propio formato (Etapa 3: puertos de impresión).
const PRINTING = ['escpos-builder.ts', 'label-builder.ts'];

const files = Object.entries(sources).filter(([path]) => !IGNORED.some((part) => path.includes(part)));

const FORBIDDEN: Array<{ name: string; pattern: RegExp }> = [
  { name: "moneda fija (currency: 'USD')", pattern: /currency:\s*['"]USD['"]/ },
  { name: "idioma de Ecuador fijo ('es-EC')", pattern: /['"]es-EC['"]/ },
  { name: "zona horaria de Ecuador fija ('America/Guayaquil')", pattern: /America\/Guayaquil/ },
  { name: 'símbolo de moneda fijo ($ delante de toFixed(2))', pattern: /\$\$\{[^}]*\.toFixed\(2\)\}/ },
];

describe('datos de la tienda sin valores fijos', () => {
  it('encuentra los archivos fuente (la guarda no puede pasar en vacío)', () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it.each(FORBIDDEN)('ningún archivo usa $name', ({ pattern }) => {
    const offenders = files
      .filter(([path]) => !PRINTING.some((p) => path.endsWith(p)))
      .filter(([, content]) => pattern.test(content))
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });
});
