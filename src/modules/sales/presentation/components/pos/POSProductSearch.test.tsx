import { createRef } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { backpack } from '@/test/fixtures/backpack';
import { POSProductSearch } from './POSProductSearch';

const { searchPos } = vi.hoisted(() => ({ searchPos: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), info: vi.fn(), warning: vi.fn(), error: vi.fn() } }));
vi.mock('@/modules/auth/presentation/hooks/useSession', () => ({ formatMoney: (value: number) => `$${value.toFixed(2)}` }));
vi.mock('@/modules/products/presentation/hooks', () => ({ useVariantSearch: () => ({ searchPos }) }));

function open() {
  const onAdd = vi.fn();
  const inputRef = createRef<HTMLInputElement>();
  render(<POSProductSearch branchId="b1" searchInputRef={inputRef} onAddVariantToCart={onAdd} />);
  const input = screen.getByPlaceholderText(/Escanea código/);
  const scan = (code: string) => userEvent.type(input, `${code}{Enter}`);
  return { onAdd, input, scan };
}

describe('buscador del POS', () => {
  beforeEach(() => vi.clearAllMocks());

  it('con el SKU base, tras agregar la variante elegida el lector vuelve a escribir en el buscador', async () => {
    searchPos.mockResolvedValue({ kind: 'variable-product', product: backpack() });
    const { onAdd, input, scan } = open();

    await scan('MNEG');
    const base = await screen.findByRole('group', { name: 'Base' });
    await userEvent.click(within(base).getByRole('button', { name: 'Celeste' }));
    await userEvent.click(screen.getByRole('button', { name: /Agregar al carrito/ }));

    expect(onAdd.mock.calls[0]?.[1]).toMatchObject({ sku: 'MNEG-6', imageUrl: 'https://fotos/mneg-6.jpg' });
    await vi.waitFor(() => expect(document.activeElement).toBe(input));
  });

  it('un Enter del lector con la ventana recién abierta no agrega nada', async () => {
    searchPos.mockResolvedValue({ kind: 'variable-product', product: backpack() });
    const { onAdd, scan } = open();

    await scan('MNEG');
    await screen.findByRole('group', { name: 'Base' });
    await new Promise((resolve) => setTimeout(resolve, 50));
    await userEvent.keyboard('{Enter}');

    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getByRole('group', { name: 'Base' })).toBeTruthy();
  });

  it('con varias coincidencias la lista muestra la combinación de cada una', async () => {
    const variant = (sku: string, color: string) => ({ id: sku, sku, barcode: '779', productName: 'Gorra', productType: 'VARIABLE', salePrice: 6, stock: 1, attributes: [{ name: 'Color', value: color }] });
    searchPos.mockResolvedValue({ kind: 'variants', variants: [variant('GOR-R', 'Rojo'), variant('GOR-V', 'Verde')] });
    const { scan } = open();

    await scan('779');

    expect(await screen.findByText('Color: Rojo')).toBeTruthy();
    expect(screen.getByText('Color: Verde')).toBeTruthy();
  });
});
