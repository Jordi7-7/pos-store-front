import { describe, expect, it } from 'vitest';
import { suggestNewVariant } from './variant-suggestion';

describe('propuesta de la variante nueva', () => {
  it('sigue el prefijo y el número de serie de las existentes', () => {
    expect(suggestNewVariant({ skus: ['CAM-AZU-1', 'CAM-AZU-2'], productName: 'Camisa' }).sku).toBe('CAM-AZU-3');
  });

  it('usa el mayor número existente aunque haya huecos', () => {
    expect(suggestNewVariant({ skus: ['CAM-1', 'CAM-7'], productName: 'Camisa' }).sku).toBe('CAM-8');
  });

  it('sin números en el sufijo cuenta las variantes (E2EV-S, E2EV-M → E2EV-3)', () => {
    expect(suggestNewVariant({ skus: ['E2EV-S', 'E2EV-M'], productName: 'x' }).sku).toBe('E2EV-3');
  });

  it('sin guion deriva el prefijo del nombre del producto, o VAR si no hay letras', () => {
    expect(suggestNewVariant({ skus: ['ABC'], productName: 'Playera Oversize Negra' }).sku).toBe('PLAYERA-2');
    expect(suggestNewVariant({ skus: [], productName: '***' }).sku).toBe('VAR-1');
  });

  it('copia los precios de la primera variante; sin ella, ceros y mayoreo vacío', () => {
    expect(suggestNewVariant({ skus: ['A-1'], productName: 'x', firstPrices: { purchasePrice: 50, salePrice: '100', wholesalePrice: 80 } })).toMatchObject({ purchasePrice: '50', salePrice: '100', wholesalePrice: '80' });
    expect(suggestNewVariant({ skus: [], productName: 'x' })).toMatchObject({ purchasePrice: '0', salePrice: '0', wholesalePrice: '' });
    expect(suggestNewVariant({ skus: ['A-1'], productName: 'x', firstPrices: { purchasePrice: 1, salePrice: 2, wholesalePrice: null } }).wholesalePrice).toBe('');
  });
});
