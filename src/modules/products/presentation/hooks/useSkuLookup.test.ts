import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSkuLookup } from './useSkuLookup';

const { searchPos, findVariantBySku } = vi.hoisted(() => ({ searchPos: vi.fn(), findVariantBySku: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), info: vi.fn(), warning: vi.fn(), error: vi.fn() } }));
vi.mock('./useVariantSearch', () => ({ useVariantSearch: () => ({ searchPos, findVariantBySku }) }));

const scanned = { id: 'v1', sku: 'CAM-1', barcode: '779', productName: 'Camisa', salePrice: 10, stock: 3 };

async function find(code: string) {
  const { result } = renderHook(() => useSkuLookup('b1'));
  let found: Awaited<ReturnType<typeof result.current.find>> = null;
  await act(async () => {
    found = await result.current.find(code, 'mover');
  });
  return found;
}

describe('buscar un producto en las pantallas de inventario', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchPos.mockResolvedValue({ kind: 'variants', variants: [scanned] });
  });

  it('agrega el costo de referencia, consultado aparte por el SKU de la variante encontrada', async () => {
    findVariantBySku.mockResolvedValue({ id: 'v1', sku: 'CAM-1', purchasePrice: 4.5, productName: 'Camisa' });

    await expect(find('779')).resolves.toMatchObject({ sku: 'CAM-1', stock: 3, referenceCost: 4.5 });
    expect(findVariantBySku).toHaveBeenCalledWith('CAM-1');
  });

  it('si el costo no se puede consultar, devuelve el producto sin él', async () => {
    findVariantBySku.mockRejectedValue(new Error('sin permiso'));

    await expect(find('CAM-1')).resolves.toMatchObject({ sku: 'CAM-1', referenceCost: undefined });
  });
});
