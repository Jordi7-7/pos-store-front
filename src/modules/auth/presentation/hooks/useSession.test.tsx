import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '../stores/useAuthStore';
import { formatMoney, useTenantFormatKey } from './useSession';
import type { SessionTenant } from '../../domain/session';

const tenant: SessionTenant = {
  id: 't1',
  name: 'Tienda',
  slug: 'tienda',
  logoUrl: null,
  country: 'MX',
  currencyCode: 'MXN',
  currencySymbol: '$',
  timezone: 'America/Mexico_City',
};

/** Imita al contenido de la aplicación: se repinta (remonta) cuando cambia la clave de formato. */
function Content() {
  const key = useTenantFormatKey();
  return <div key={key} data-testid="price">{formatMoney(1234.5)}</div>;
}

const plain = (s: string | null) => (s ?? '').replace(/ /g, ' ');

beforeEach(() => useAuthStore.setState({ tenant }));

describe('formato reactivo a la tienda', () => {
  it('al cambiar la moneda de la tienda, el importe mostrado cambia sin recargar', () => {
    render(<Content />);
    expect(plain(screen.getByTestId('price').textContent)).toBe('$1,234.50');

    act(() => useAuthStore.setState({ tenant: { ...tenant, currencyCode: 'USD' } }));
    expect(plain(screen.getByTestId('price').textContent)).toContain('USD');
  });

  it('un cambio que no afecta al formato (nombre) no repinta', () => {
    render(<Content />);
    const before = screen.getByTestId('price');
    act(() => useAuthStore.setState({ tenant: { ...tenant, name: 'Otro nombre' } }));
    expect(screen.getByTestId('price')).toBe(before);
  });
});
