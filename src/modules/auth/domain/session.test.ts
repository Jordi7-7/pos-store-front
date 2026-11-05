import { describe, expect, it } from 'vitest';
import { hasAnyPermission, hasPermission, homeRouteFor, roleLabel, type SessionUser } from './session';

const base: SessionUser = {
  id: 'u',
  name: 'N',
  username: 'n',
  email: null,
  isOwner: false,
  role: { id: 'r', name: 'Cajero' },
  permissions: ['view:pos'],
  branches: [],
  cashRegisters: [],
};

describe('reglas de sesión', () => {
  it('permisos: propietario o comodín pueden todo; el resto solo lo asignado; sin usuario nada', () => {
    expect(hasPermission(base, 'view:pos')).toBe(true);
    expect(hasPermission(base, 'view:users')).toBe(false);
    expect(hasPermission({ ...base, isOwner: true, permissions: [] }, 'x')).toBe(true);
    expect(hasPermission({ ...base, permissions: ['*'] }, 'x')).toBe(true);
    expect(hasPermission(null, 'view:pos')).toBe(false);
    expect(hasAnyPermission(base, ['x', 'view:pos'])).toBe(true);
    expect(hasAnyPermission(base, ['x', 'y'])).toBe(false);
  });

  it('etiqueta de rol y pantalla de inicio', () => {
    expect(roleLabel({ ...base, isOwner: true })).toBe('Propietario');
    expect(roleLabel(base)).toBe('Cajero');
    expect(roleLabel({ ...base, role: null })).toBe('Usuario');
    expect(homeRouteFor({ ...base, isOwner: true })).toBe('/dashboard');
    expect(homeRouteFor(base)).toBe('/pos');
    expect(homeRouteFor(null)).toBe('/pos');
  });
});
