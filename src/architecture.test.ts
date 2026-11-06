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
const MIGRATED_MODULES = ['/modules/sales/', '/modules/cash-sessions/', '/modules/cash-registers/', '/modules/printing/', '/modules/auth/', '/modules/branches/', '/modules/customers/', '/modules/media/', '/modules/products/', '/modules/users/', '/modules/reports/'];
const INFRA_INTERNALS = /infrastructure\/(mappers|dtos|[\w-]+\.http-repository|[\w.-]+\.service)\b/;
/** `printing` es un módulo de dispositivo: sus pantallas de vista previa y configuración usan su propia infraestructura (generador ESC/POS, impresora USB). */
const DEVICE_MODULES = ['/modules/printing/'];

describe('la presentación no usa los internos de infraestructura', () => {
  it('los módulos migrados solo entran por infrastructure/dependencies', () => {
    const offenders: string[] = [];
    for (const [path, content] of Object.entries(production)) {
      if (layerOf(path) !== 'presentation' || !MIGRATED_MODULES.some((m) => path.includes(m))) continue;
      if (DEVICE_MODULES.some((m) => path.includes(m))) continue;
      for (const specifier of importsOf(content)) {
        if (INFRA_INTERNALS.test(specifier)) offenders.push(`${path}: ${specifier}`);
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
  auth: [],
  branches: ['auth'],
  customers: ['auth'],
  media: ['auth'],
  printing: ['auth'],
  products: ['auth', 'branches', 'media', 'printing'],
  users: ['auth', 'branches'],
  reports: ['auth'],
  'cash-sessions': ['auth', 'printing'],
  'cash-registers': ['auth', 'branches', 'users'],
  sales: ['auth', 'branches', 'cash-registers', 'cash-sessions', 'customers', 'printing', 'products'],
};
/** Ciclos heredados de módulos sin migrar. La lista solo puede encogerse (hoy no queda ninguno). */
const KNOWN_LEGACY_CYCLES: string[][] = [];

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

/**
 * Jerarquía de carpetas de un módulo migrado: cada archivo vive en la carpeta que dice su función.
 *
 *   domain/          entities/ enums/ rules/              (qué es el negocio: datos y reglas puras)
 *   application/     ports/ use-cases/ errors/            (qué se puede hacer: casos de uso y puertos)
 *   infrastructure/  repositories/ dtos/ mappers/ dependencies.ts   (cómo se hace: HTTP, impresora…)
 *   presentation/    components/ hooks/ stores/ view-models/        (cómo se muestra)
 */
const MODULE_LAYOUT = new RegExp(
  '^/src/modules/[^/]+/(' +
    [
      'index\\.ts',
      'domain/(entities|enums|rules)/[^/]+',
      'application/(ports|use-cases|errors)/[^/]+',
      'infrastructure/(repositories|dtos|mappers|escpos|labels|printers)/[^/]+',
      'infrastructure/dependencies\\.ts',
      'presentation/(components|hooks|stores|view-models)/.+',
    ].join('|') +
    ')$',
);

describe('jerarquía de carpetas de los módulos migrados', () => {
  const inMigratedModule = Object.keys(sources).filter((path) => MIGRATED_MODULES.some((m) => path.includes(m)));

  it('hay archivos que revisar (la regla no pasa en vacío)', () => {
    expect(inMigratedModule.length).toBeGreaterThan(150);
  });

  it('todo archivo está en la carpeta que corresponde a su función', () => {
    expect(inMigratedModule.filter((path) => !MODULE_LAYOUT.test(path))).toEqual([]);
  });

  it('los casos de uso están en use-cases/, los puertos en ports/ y los repositorios HTTP en repositories/', () => {
    const misplaced = inMigratedModule.filter(
      (path) =>
        (/\.repository\.ts$/.test(path) && !path.includes('/application/ports/')) ||
        (/\.http-repository(\.test)?\.ts$/.test(path) && !path.includes('/infrastructure/repositories/')),
    );
    expect(misplaced).toEqual([]);
  });

  it('la regla detecta una carpeta no permitida', () => {
    expect(MODULE_LAYOUT.test('/src/modules/x/application/sign-in.ts')).toBe(false);
    expect(MODULE_LAYOUT.test('/src/modules/x/application/use-cases/sign-in.ts')).toBe(true);
    expect(MODULE_LAYOUT.test('/src/modules/x/domain/session.ts')).toBe(false);
    expect(MODULE_LAYOUT.test('/src/modules/x/infrastructure/x.http-repository.ts')).toBe(false);
    expect(MODULE_LAYOUT.test('/src/modules/x/presentation/components/pos/A.tsx')).toBe(true);
  });
});

/** El núcleo compartido sigue la misma lógica que un módulo, con sus propias carpetas. */
const SHARED_LAYOUT =
  /^\/src\/shared\/(domain\/(value-objects|enums|rules)\/[^/]+|infrastructure\/http\/[^/]+|presentation\/(components|stores|formatting)\/[^/]+)$/;

describe('jerarquía de carpetas del núcleo compartido', () => {
  const shared = Object.keys(sources).filter((path) => path.startsWith('/src/shared/'));

  it('hay archivos que revisar (la regla no pasa en vacío)', () => {
    expect(shared.length).toBeGreaterThan(15);
  });

  it('todo archivo de shared está en la carpeta que corresponde a su función', () => {
    expect(shared.filter((path) => !SHARED_LAYOUT.test(path))).toEqual([]);
  });

  it('la regla detecta un archivo suelto', () => {
    expect(SHARED_LAYOUT.test('/src/shared/domain/money.ts')).toBe(false);
    expect(SHARED_LAYOUT.test('/src/shared/domain/value-objects/money.ts')).toBe(true);
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
