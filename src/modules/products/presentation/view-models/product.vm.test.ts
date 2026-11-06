import { describe, expect, it } from 'vitest';
import { createFormatters } from '@/shared/presentation/formatting/formatters';
import { ProductType } from '../../domain/enums';
import type { ProductEntity, ProductVariantEntity } from '../../domain/entities/product.entity';
import { toProductVM } from './product.vm';

const mxn = createFormatters({ currencyCode: 'MXN', locale: 'es-MX', timezone: 'America/Mexico_City' });
const eur = createFormatters({ currencyCode: 'EUR', locale: 'es-ES', timezone: 'Europe/Madrid' });

const variant = (overrides: Partial<ProductVariantEntity> = {}): ProductVariantEntity => ({
  id: 'v', sku: 'A', barcode: '1', purchasePrice: 50, salePrice: 100, wholesalePrice: 80, images: [], primaryImageUrl: '',
  attributes: [{ name: 'Talla', value: 'M' }, { name: 'Color', value: 'Rojo' }], stocks: [], tags: [], totalStock: 0, ...overrides,
});
const product = (variants: ProductVariantEntity[]): ProductEntity => ({
  id: 'p', name: 'Camisa', description: '', type: ProductType.VARIABLE, baseSku: 'CAM', categoryId: null, categoryName: 'Ropa',
  images: [], primaryImageUrl: '', variants, totalVariants: variants.length, totalStock: 0, minPrice: 0, maxPrice: 0,
});

describe('view-model de producto', () => {
  it('precios y etiquetas con la moneda de la tienda', () => {
    const vm = toProductVM(product([variant()]), mxn);
    expect(vm.variants[0]).toMatchObject({ purchasePriceFormatted: '$50.00', salePriceFormatted: '$100.00', wholesalePriceFormatted: '$80.00', attributesLabel: 'Talla: M / Color: Rojo' });
    expect(vm.priceRangeFormatted).toBe('$100.00');
  });

  it('el rango muestra mínimo y máximo si varían, y — si ninguna variante tiene precio', () => {
    expect(toProductVM(product([variant({ salePrice: 100 }), variant({ salePrice: 250 })]), mxn).priceRangeFormatted).toBe('$100.00 - $250.00');
    expect(toProductVM(product([variant({ salePrice: 0, wholesalePrice: null })]), mxn)).toMatchObject({ priceRangeFormatted: '—', wholesalePriceRangeFormatted: '—' });
  });

  it('sin precio de mayoreo la variante dice N/A', () => {
    expect(toProductVM(product([variant({ wholesalePrice: null })]), mxn).variants[0]?.wholesalePriceFormatted).toBe('N/A');
  });

  it('otra moneda cambia los textos pero no los datos', () => {
    const vm = toProductVM(product([variant()]), eur);
    expect(vm.variants[0]?.salePrice).toBe(100);
    expect(vm.priceRangeFormatted).toContain('€');
    expect(vm.priceRangeFormatted).not.toContain('$');
  });
});
