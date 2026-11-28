import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { backpack } from '@/test/fixtures/backpack';
import { ExchangeReturnModal } from './ExchangeReturnModal';

const { toast, searchPos } = vi.hoisted(() => ({ toast: { success: vi.fn(), info: vi.fn(), warning: vi.fn(), error: vi.fn() }, searchPos: vi.fn() }));
const sale = vi.hoisted(() => ({
  id: 's1',
  invoiceNumber: '001-001-000000001',
  total: 10,
  status: 'COMPLETED',
  items: [{ saleItemId: 'i1', variantId: 'old', productName: 'Camisa', sku: 'CAM-1', attributes: '', quantity: 1, refundedQty: 0, refundableQty: 1, price: 10, cost: 4, discountAmount: 0 }],
}));

vi.mock('sonner', () => ({ toast }));
vi.mock('@/modules/auth/presentation/hooks/useSession', () => ({ formatMoney: (value: number) => `$${value.toFixed(2)}` }));
vi.mock('@/modules/auth/presentation/hooks/useCurrencySymbol', () => ({ useCurrencySymbol: () => '$' }));
vi.mock('@/modules/products', () => ({ useVariantSearch: () => ({ searchPos }) }));
vi.mock('../../hooks/useSaleDetail', () => ({ useSaleByInvoice: () => ({ fetchSale: () => Promise.resolve(sale) }) }));
vi.mock('../../hooks/useSalesMutations', () => ({
  useExchangeProducts: () => ({ exchangeProducts: vi.fn(), isExchanging: false }),
  useRefundSale: () => ({ refundSale: vi.fn(), isRefunding: false }),
}));

const scanned = (sku: string) => ({
  id: sku,
  sku,
  barcode: '779',
  productName: 'Gorra',
  salePrice: 6,
  wholesalePrice: null,
  stock: 2,
  attributes: [{ name: 'Color', value: 'Rojo' }, { name: 'Talla', value: 'M' }],
});

/** Llega al paso de escanear las prendas que se lleva el cliente. */
async function openExchange() {
  const onClose = vi.fn();
  render(<ExchangeReturnModal isOpen onClose={onClose} activeSession={null} branchId="b1" cashSessionId="c1" />);
  await userEvent.type(screen.getByPlaceholderText(/Ej:/), '001-001-000000001{Enter}');
  await screen.findByText('Camisa');
  const addUnit = document.querySelector('.lucide-plus')?.closest('button');
  if (!addUnit) throw new Error('No está el botón para sumar una unidad a devolver');
  await userEvent.click(addUnit);
  await userEvent.click(screen.getByRole('button', { name: /Continuar/ }));
  await userEvent.click(screen.getByRole('button', { name: /Cambio de Prenda/ }));
  const scan = (code: string) => userEvent.type(screen.getByPlaceholderText(/Escanear/), `${code}{Enter}`);
  return { onClose, scan };
}

describe('escanear en un cambio de mercancía', () => {
  beforeEach(() => vi.clearAllMocks());

  it('con el SKU base abre la elección y agrega solo la variante elegida', async () => {
    searchPos.mockResolvedValue({ kind: 'variable-product', product: backpack() });
    const { scan, onClose } = await openExchange();

    await scan('MNEG');
    const base = await screen.findByRole('group', { name: 'Base' });
    expect(screen.queryByText('SKU: MNEG-1')).toBeNull();
    await userEvent.click(within(base).getByRole('button', { name: 'Rojo' }));
    await userEvent.click(screen.getByRole('button', { name: /Agregar al cambio/ }));

    expect(await screen.findByText('SKU: MNEG-3')).toBeTruthy();
    expect(screen.getByText('Base: Rojo / Cierre: Negro / Copa: Rojo')).toBeTruthy();
    expect(screen.queryByRole('group', { name: 'Base' })).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('cerrar la elección no cierra el cambio ni agrega nada', async () => {
    searchPos.mockResolvedValue({ kind: 'variable-product', product: backpack() });
    const { scan, onClose } = await openExchange();

    await scan('MNEG');
    await screen.findByRole('group', { name: 'Base' });
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('group', { name: 'Base' })).toBeNull();
    expect(screen.getByPlaceholderText(/Escanear/)).toBeTruthy();
    expect(screen.queryByText(/SKU: MNEG/)).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('con el SKU de una variante la agrega con su combinación', async () => {
    searchPos.mockResolvedValue({ kind: 'variants', variants: [scanned('GOR-ROJO')] });
    const { scan } = await openExchange();

    await scan('GOR-ROJO');

    expect(await screen.findByText('SKU: GOR-ROJO')).toBeTruthy();
    expect(screen.getByText('Color: Rojo / Talla: M')).toBeTruthy();
  });

  it('si el código es de varias variantes no elige por el cajero', async () => {
    searchPos.mockResolvedValue({ kind: 'variants', variants: [scanned('GOR-ROJO'), scanned('GOR-VERDE')] });
    const { scan } = await openExchange();

    await scan('779');

    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('varios productos')));
    expect(screen.queryByText(/SKU: GOR/)).toBeNull();
  });
});
