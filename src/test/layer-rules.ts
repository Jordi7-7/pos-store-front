/**
 * Reglas de dependencia entre capas (docs/refactor-plan.md §2). Dependencias solo hacia adentro:
 * presentation → application → domain, e infrastructure → application/domain.
 * Equivalente en la web al `architecture.spec.ts` del backend.
 */

export type Layer = 'domain' | 'application' | 'infrastructure' | 'presentation';
const LAYERS: readonly Layer[] = ['domain', 'application', 'infrastructure', 'presentation'];

/** Librerías de interfaz y de estado: no pertenecen al núcleo (dominio/aplicación) ni al cliente HTTP. */
const UI_PACKAGES = /^(react|react-dom|zustand|sonner|lucide-react|recharts|@tanstack\/.+|@base-ui\/.+|@radix-ui\/.+)(\/.*)?$/;

interface Rule {
  layer: Layer;
  forbiddenLayers: readonly Layer[];
  forbidPackages: boolean;
  /** APIs del navegador que el núcleo no debe tocar directamente. */
  forbiddenGlobals: readonly RegExp[];
}

const BROWSER_GLOBALS = [/\bfetch\(/, /\blocalStorage\b/, /\bsessionStorage\b/, /\bwindow\./, /\bdocument\./];

const RULES: readonly Rule[] = [
  { layer: 'domain', forbiddenLayers: ['application', 'infrastructure', 'presentation'], forbidPackages: true, forbiddenGlobals: BROWSER_GLOBALS },
  { layer: 'application', forbiddenLayers: ['infrastructure', 'presentation'], forbidPackages: true, forbiddenGlobals: BROWSER_GLOBALS },
  { layer: 'infrastructure', forbiddenLayers: ['presentation'], forbidPackages: true, forbiddenGlobals: [] },
];

export function layerOf(path: string): Layer | null {
  const segments = path.split('/');
  return LAYERS.find((layer) => segments.includes(layer)) ?? null;
}

function dirname(path: string): string {
  return path.slice(0, path.lastIndexOf('/'));
}

/** Resuelve un import (alias `@/`, relativo o paquete) a una ruta absoluta bajo `/src`, o `null` si es un paquete. */
export function resolveImport(from: string, specifier: string): string | null {
  if (specifier.startsWith('@/')) return `/src/${specifier.slice(2)}`;
  if (!specifier.startsWith('.')) return null;
  const parts = dirname(from).split('/');
  for (const part of specifier.split('/')) {
    if (part === '.' || part === '') continue;
    if (part === '..') parts.pop();
    else parts.push(part);
  }
  return parts.join('/');
}

const IMPORT_PATTERN = /(?:^|\n)\s*(?:import|export)\s[^'";]*?from\s*['"]([^'"]+)['"]|(?:^|\n)\s*import\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;

export function importsOf(source: string): string[] {
  return [...source.matchAll(IMPORT_PATTERN)].map((m) => m[1] ?? m[2] ?? m[3]).filter((s): s is string => Boolean(s));
}

/** Devuelve una descripción por cada violación encontrada en `files` (ruta → contenido). */
export function findViolations(files: Record<string, string>): string[] {
  const violations: string[] = [];
  for (const [path, source] of Object.entries(files)) {
    const layer = layerOf(path);
    const rule = RULES.find((r) => r.layer === layer);
    if (!rule) continue;

    for (const specifier of importsOf(source)) {
      const resolved = resolveImport(path, specifier);
      if (resolved === null) {
        if (rule.forbidPackages && UI_PACKAGES.test(specifier)) violations.push(`${path}: ${rule.layer} importa "${specifier}"`);
        continue;
      }
      const target = layerOf(resolved);
      if (target && rule.forbiddenLayers.includes(target)) {
        violations.push(`${path}: ${rule.layer} importa de ${target} ("${specifier}")`);
      }
    }
    for (const pattern of rule.forbiddenGlobals) {
      if (pattern.test(source)) violations.push(`${path}: ${rule.layer} usa ${pattern.source}`);
    }
  }
  return violations;
}
