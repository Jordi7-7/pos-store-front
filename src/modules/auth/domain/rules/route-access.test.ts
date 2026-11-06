import { describe, expect, it } from 'vitest';
import { canAccessRoute, decideRouteAccess, homeRouteFor, ROUTE_PERMISSIONS, type GuardedPath } from './route-access';
import type { SessionUser } from '../entities/session';
import { navigationConfig } from '@/config/navigation.config';

const user = (permissions: string[], isOwner = false): SessionUser => ({
  id: 'u', name: 'N', username: 'n', email: null, isOwner, role: null, permissions, branches: [], cashRegisters: [],
});
const cashier = user(['view:pos', 'view:sales']);

describe('acceso a pantallas', () => {
  it('el propietario y el comodín entran a todo', () => {
    for (const path of Object.keys(ROUTE_PERMISSIONS) as GuardedPath[]) {
      expect(canAccessRoute(user([], true), path)).toBe(true);
      expect(canAccessRoute(user(['*']), path)).toBe(true);
    }
  });

  it('un cajero solo entra a lo que tiene asignado y el resto lo manda a su inicio', () => {
    expect(decideRouteAccess(cashier, '/pos')).toEqual({ allowed: true });
    expect(decideRouteAccess(cashier, '/usuarios')).toEqual({ allowed: false, redirectTo: '/pos' });
    expect(decideRouteAccess(cashier, '/configuracion')).toEqual({ allowed: false, redirectTo: '/pos' });
    expect(decideRouteAccess(cashier, '/reportes/costo-ventas')).toEqual({ allowed: false, redirectTo: '/pos' });
  });

  it('sin sesión no se entra a nada', () => {
    expect(canAccessRoute(null, '/pos')).toBe(false);
  });

  it('pantalla de inicio: propietario al panel; el resto a la primera permitida', () => {
    expect(homeRouteFor(user([], true))).toBe('/dashboard');
    expect(homeRouteFor(cashier)).toBe('/pos');
    expect(homeRouteFor(user(['view:sales']))).toBe('/ventas');
    expect(homeRouteFor(user(['view:users']))).toBe('/usuarios');
  });

  it('sin ninguna pantalla permitida no hay bucle de redirecciones', () => {
    const nobody = user([]);
    expect(homeRouteFor(nobody)).toBe('/pos');
    expect(decideRouteAccess(nobody, '/pos')).toEqual({ allowed: true });
    expect(decideRouteAccess(nobody, '/usuarios')).toEqual({ allowed: false, redirectTo: '/pos' });
  });

  it('el menú y la tabla de permisos dicen lo mismo (una sola fuente de verdad)', () => {
    const entries = navigationConfig.flatMap((item) => [item, ...(item.children ?? [])]).filter((i) => i.path);
    expect(entries.length).toBeGreaterThan(15);
    for (const entry of entries) {
      expect(ROUTE_PERMISSIONS[entry.path as GuardedPath], entry.path).toBe(entry.permission);
    }
  });
});

describe('todas las pantallas llevan guarda', () => {
  const files = import.meta.glob('/src/routes/_layout/**/*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

  it('cada archivo de ruta protegida llama a guardRoute con su propia ruta', () => {
    const covered = new Set<string>();
    for (const [file, source] of Object.entries(files)) {
      const route = /createFileRoute\('\/_layout(\/[^']*)'\)/.exec(source)?.[1] ?? '';
      if (route === '/reportes/') continue; // solo redirige a /reportes/costo-ventas, que sí lleva guarda
      const guard = /guardRoute\('([^']+)'\)/.exec(source)?.[1];
      expect(guard, file).toBe(route);
      covered.add(route);
    }
    expect([...covered].sort()).toEqual(Object.keys(ROUTE_PERMISSIONS).sort());
  });
});
