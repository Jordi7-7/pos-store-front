import { describe, expect, it } from 'vitest';
import { findModuleCycles, findViolations, importsOf, layerOf, moduleDependencies, resolveImport } from './test/layer-rules';

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

/** Textos ya formateados para pantalla: son del view-model, no de la entidad. */
const PRESENTATION_FIELD = /\b\w+(Formatted|Label)\??\s*:\s*string\b/;

describe('el dominio no lleva texto de pantalla', () => {
  it('ninguna entidad de domain tiene campos *Formatted ni *Label (van en presentation/view-models)', () => {
    const offenders = Object.entries(production)
      .filter(([path]) => layerOf(path) === 'domain')
      .filter(([, content]) => PRESENTATION_FIELD.test(content))
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });

  it('la regla detecta el campo prohibido', () => {
    expect(PRESENTATION_FIELD.test('  totalFormatted: string;')).toBe(true);
    expect(PRESENTATION_FIELD.test('  statusLabel?: string;')).toBe(true);
    expect(PRESENTATION_FIELD.test('  total: number;')).toBe(false);
  });
});

/**
 * En los módulos ya migrados, la presentación habla con repositorios y casos de uso a través de la
 * raíz de composición (`infrastructure/dependencies`): nunca importa mappers, DTO ni clases HTTP.
 */
const MIGRATED_MODULES = ['/modules/sales/', '/modules/cash-sessions/', '/modules/cash-registers/'];
const INFRA_INTERNALS = /infrastructure\/(mappers|dtos|[\w-]+\.http-repository|[\w.-]+\.service)\b/;
const ALLOWED_INFRA = /infrastructure\/printing\//; // la configuración de la impresora USB es específica del dispositivo

describe('la presentación no usa los internos de infraestructura', () => {
  it('sales, cash-sessions y cash-registers solo entran por infrastructure/dependencies', () => {
    const offenders: string[] = [];
    for (const [path, content] of Object.entries(production)) {
      if (layerOf(path) !== 'presentation' || !MIGRATED_MODULES.some((m) => path.includes(m))) continue;
      for (const specifier of importsOf(content)) {
        if (INFRA_INTERNALS.test(specifier) && !ALLOWED_INFRA.test(specifier)) offenders.push(`${path}: ${specifier}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('la regla detecta un import prohibido y permite la raíz de composición', () => {
    expect(INFRA_INTERNALS.test('../../infrastructure/mappers/sale.mapper')).toBe(true);
    expect(INFRA_INTERNALS.test('../../infrastructure/dtos/sales.dto')).toBe(true);
    expect(INFRA_INTERNALS.test('../../infrastructure/sales.http-repository')).toBe(true);
    expect(INFRA_INTERNALS.test('../../infrastructure/sales.service')).toBe(true);
    expect(INFRA_INTERNALS.test('../../infrastructure/dependencies')).toBe(false);
  });
});

/**
 * Dirección de las dependencias entre módulos. Los módulos migrados solo pueden depender de lo
 * listado aquí: `printing` no conoce a nadie, `cash-sessions` no conoce a `sales` (es `sales` quien
 * usa el turno), y no hay ciclos. Ampliar una lista exige una decisión consciente.
 */
const ALLOWED_DEPENDENCIES: Record<string, string[]> = {
  printing: ['auth'],
  'cash-sessions': ['auth', 'printing'],
  'cash-registers': ['auth', 'branches', 'users'],
  sales: ['auth', 'branches', 'cash-registers', 'cash-sessions', 'customers', 'printing', 'products'],
};
/** Ciclos que ya existían en módulos sin migrar. La lista solo puede encogerse. */
const KNOWN_LEGACY_CYCLES = [['media', 'products']];

describe('dependencias entre módulos', () => {
  const graph = moduleDependencies(production);

  it.each(Object.entries(ALLOWED_DEPENDENCIES))('%s solo depende de lo permitido', (module, allowed) => {
    expect([...(graph.get(module) ?? [])].filter((dependency) => !allowed.includes(dependency))).toEqual([]);
  });

  it('no hay ciclos entre módulos salvo los heredados conocidos', () => {
    expect(findModuleCycles(graph)).toEqual(KNOWN_LEGACY_CYCLES);
  });

  it('el detector encuentra ciclos (si no, la regla no sirve)', () => {
    const cyclic = new Map([['a', new Set(['b'])], ['b', new Set(['c'])], ['c', new Set(['a'])], ['d', new Set(['a'])]]);
    expect(findModuleCycles(cyclic)).toEqual([['a', 'b', 'c']]);
    expect(findModuleCycles(new Map([['a', new Set(['b'])]]))).toEqual([]);
  });

  it('el grafo no está vacío (la regla no pasa en vacío)', () => {
    expect(graph.get('sales')?.has('cash-sessions')).toBe(true);
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
