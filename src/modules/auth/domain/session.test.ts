import { describe, expect, it } from 'vitest';
import { hasAnyPermission, hasPermission, roleLabel, tenantFormatKey, type SessionUser } from './session';

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

  it('etiqueta de rol', () => {
    expect(roleLabel({ ...base, isOwner: true })).toBe('Propietario');
    expect(roleLabel(base)).toBe('Cajero');
    expect(roleLabel({ ...base, role: null })).toBe('Usuario');
  });
});

describe('tenantFormatKey', () => {
  const tenant = { id: 't', name: 'T', slug: 't', logoUrl: null, country: 'MX', currencyCode: 'MXN', currencySymbol: '$', timezone: 'America/Mexico_City' };

  it('cambia solo con moneda, país o zona horaria; no con nombre o logo', () => {
    const base = tenantFormatKey(tenant);
    expect(tenantFormatKey({ ...tenant, currencyCode: 'USD' })).not.toBe(base);
    expect(tenantFormatKey({ ...tenant, country: 'EC' })).not.toBe(base);
    expect(tenantFormatKey({ ...tenant, timezone: 'America/Guayaquil' })).not.toBe(base);
    expect(tenantFormatKey({ ...tenant, name: 'Otro', logoUrl: 'x' })).toBe(base);
    expect(tenantFormatKey(null)).toBe('');
  });
});
