import { describe, expect, it } from 'vitest';
import { findViolations, importsOf, layerOf, resolveImport } from './test/layer-rules';

const sources = import.meta.glob(['/src/**/*.ts', '/src/**/*.tsx'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const IGNORED = ['/components/ui/', '/routeTree.gen.ts', '.test.ts', '.test.tsx', '/src/test/'];
const production = Object.fromEntries(Object.entries(sources).filter(([path]) => !IGNORED.some((part) => path.includes(part))));

describe('arquitectura: dependencias solo hacia adentro', () => {
  it('el código real cumple las reglas (domain/application sin UI ni infraestructura; infrastructure sin presentation)', () => {
    expect(findViolations(production)).toEqual([]);
  });

  it('la regla no pasa en vacío: hay archivos en las capas vigiladas', () => {
    const layered = Object.keys(production).filter((p) => ['domain', 'infrastructure'].includes(layerOf(p) ?? ''));
    expect(layered.length).toBeGreaterThan(5);
  });
});

describe('las reglas detectan las violaciones (si no, la guarda no sirve)', () => {
  const v = (files: Record<string, string>) => findViolations(files);

  it('domain no puede importar React, Zustand, sonner ni TanStack', () => {
    for (const pkg of ['react', 'zustand', 'zustand/middleware', 'sonner', '@tanstack/react-query', 'lucide-react']) {
      expect(v({ '/src/modules/x/domain/a.ts': `import { y } from '${pkg}';` })).toHaveLength(1);
    }
  });

  it('domain no puede importar infrastructure, presentation ni application (alias o relativo)', () => {
    expect(v({ '/src/modules/x/domain/a.ts': `import { s } from '@/modules/x/infrastructure/repo';` })).toHaveLength(1);
    expect(v({ '/src/modules/x/domain/a.ts': `import { s } from '../presentation/hook';` })).toHaveLength(1);
    expect(v({ '/src/modules/x/domain/rules/a.ts': `import type { s } from '../../application/ports/p';` })).toHaveLength(1);
  });

  it('domain y application no pueden usar fetch ni localStorage', () => {
    expect(v({ '/src/modules/x/domain/a.ts': `const r = await fetch('/api');` })).toHaveLength(1);
    expect(v({ '/src/modules/x/application/a.ts': `localStorage.getItem('k');` })).toHaveLength(1);
  });

  it('application no puede importar infrastructure ni presentation', () => {
    expect(v({ '/src/modules/x/application/uc.ts': `import { r } from '../infrastructure/r';` })).toHaveLength(1);
    expect(v({ '/src/modules/x/application/uc.ts': `import { c } from '../presentation/c';` })).toHaveLength(1);
  });

  it('infrastructure no puede importar presentation ni librerías de interfaz/estado', () => {
    expect(v({ '/src/shared/infrastructure/h.ts': `import { toast } from 'sonner';` })).toHaveLength(1);
    expect(v({ '/src/shared/infrastructure/h.ts': `import { useAuthStore } from '@/modules/auth/presentation/store';` })).toHaveLength(1);
  });

  it('lo permitido no da falsos positivos', () => {
    expect(
      v({
        '/src/modules/x/domain/a.ts': `import { b } from './b';\nimport type { C } from '../../../shared/domain/c';`,
        '/src/modules/x/application/uc.ts': `import { R } from './ports/r';\nimport { rule } from '../domain/rules/rule';`,
        '/src/modules/x/infrastructure/repo.ts': `import { R } from '../application/ports/r';\nconst r = await fetch('/x');`,
        '/src/modules/x/presentation/h.ts': `import { useQuery } from '@tanstack/react-query';\nimport { uc } from '../application/uc';`,
      }),
    ).toEqual([]);
  });

  it('entiende las distintas formas de import', () => {
    expect(importsOf(`import a from 'a';\nimport { b } from "b";\nimport 'c';\nexport * from 'd';\nconst e = await import('e');`)).toEqual(
      ['a', 'b', 'c', 'd', 'e'],
    );
    expect(resolveImport('/src/a/b/c.ts', '../d')).toBe('/src/a/d');
    expect(resolveImport('/src/a/b/c.ts', './d')).toBe('/src/a/b/d');
    expect(resolveImport('/src/a/b/c.ts', '@/x/y')).toBe('/src/x/y');
    expect(resolveImport('/src/a/b/c.ts', 'react')).toBeNull();
  });
});
