import { describe, expect, it } from 'vitest';
import { backpack } from '@/test/fixtures/backpack';
import { combinationLabel, readExchangeScan } from './exchange-scan';

const variant = (sku: string) => ({ id: sku, sku, barcode: '779', productName: 'Gorra', salePrice: 6, stock: 1 });

describe('escanear en un cambio', () => {
  it('un SKU base pide elegir la variante', () => {
    const product = backpack();

    expect(readExchangeScan({ kind: 'variable-product', product }, 'MNEG')).toEqual({ kind: 'choose', product });
  });

  it('una sola coincidencia se agrega y ninguna avisa', () => {
    expect(readExchangeScan({ kind: 'variants', variants: [variant('A')] }, '779')).toEqual({ kind: 'variant', variant: variant('A') });
    expect(readExchangeScan({ kind: 'variants', variants: [] }, '779')).toEqual({ kind: 'not-found' });
  });

  it('con varias solo vale la del SKU escrito, sin importar mayúsculas; un código repetido no elige', () => {
    const variants = [variant('A'), variant('B')];

    expect(readExchangeScan({ kind: 'variants', variants }, ' b ')).toEqual({ kind: 'variant', variant: variants[1] });
    expect(readExchangeScan({ kind: 'variants', variants }, '779')).toEqual({ kind: 'ambiguous' });
  });

  it('escribe la combinación en una línea', () => {
    expect(combinationLabel([{ name: 'Base', value: 'Rojo' }, { name: 'Copa', value: 'Negro' }])).toBe('Base: Rojo / Copa: Negro');
    expect(combinationLabel()).toBe('');
  });
});
