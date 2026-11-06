import { DiscountType } from '@/modules/sales/domain/enums';
import { act, renderHook } from '@testing-library/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePOSCart } from './usePOSCart';
import { useAuthStore } from '@/modules/auth/presentation/stores/useAuthStore';

const toast = vi.hoisted(() => ({
  success: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
}));
vi.mock('sonner', () => ({ toast }));

const product = (overrides: Record<string, unknown> = {}) => ({ id: 'p1', name: 'Camisa', type: 'SIMPLE', ...overrides });
const variant = (overrides: Record<string, unknown> = {}) => ({
  id: 'v1',
  sku: 'CAM-1',
  salePrice: 20,
  wholesalePrice: 15,
  attributes: [],
  ...overrides,
});

// Los mensajes del carrito formatean importes con la moneda de la tienda: la sesión debe tener una.
beforeAll(() => {
  useAuthStore.setState({
    tenant: {
      id: 't1',
      name: 'Tienda',
      slug: 'tienda',
      logoUrl: null,
      country: 'MX',
      currencyCode: 'MXN',
      currencySymbol: '$',
      timezone: 'America/Mexico_City',
    },
  });
});

function setup() {
  return renderHook(() => usePOSCart());
}

/** Devuelve la línea del carrito en `index` o falla el test si no existe (sin usar `!`). */
function lineAt(result: ReturnType<typeof setup>['result'], index: number) {
  const line = result.current.cart[index];
  if (!line) throw new Error(`No existe la línea ${index} del carrito`);
  return line;
}

/** Añade una variante y devuelve el id de la línea creada. */
function addLine(result: ReturnType<typeof setup>['result'], v = variant(), p = product(), stock = 10): string {
  act(() => result.current.addVariantToCart(p, v, stock));
  return lineAt(result, result.current.cart.length - 1).cartItemId;
}

describe('usePOSCart (caracterización de la lógica de dinero del POS)', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('agregar al carrito', () => {
    it('crea una línea con cantidad 1, precio de venta y sin descuentos', () => {
      const { result } = setup();

      addLine(result);

      expect(result.current.cart).toHaveLength(1);
      expect(result.current.cart[0]).toMatchObject({
        variantId: 'v1',
        price: 20,
        unitSalePrice: 20,
        quantity: 1,
        discountAmount: 0,
        isWholesale: false,
        combinationText: 'Estándar',
      });
    });

    it('agregar la misma variante dos veces crea DOS líneas (el POS no las fusiona)', () => {
      const { result } = setup();

      addLine(result);
      addLine(result);

      expect(result.current.cart).toHaveLength(2);
      expect(lineAt(result, 0).cartItemId).not.toBe(lineAt(result, 1).cartItemId);
      expect(result.current.totalItemsCount).toBe(2);
    });

    it('avisa (sin bloquear) cuando el stock quedará en negativo', () => {
      const { result } = setup();

      act(() => result.current.addVariantToCart(product(), variant(), 0));

      expect(toast.warning).toHaveBeenCalledWith(expect.stringContaining('negativo'));
      expect(result.current.cart).toHaveLength(1);
    });

    it('describe la combinación de atributos en productos variables', () => {
      const { result } = setup();

      addLine(
        result,
        variant({ attributes: [{ name: 'Talla', value: 'M' }, { name: 'Color', value: 'Rojo' }] }),
        product({ type: 'VARIABLE' }),
      );

      expect(lineAt(result, 0).combinationText).toBe('Talla: M / Color: Rojo');
    });
  });

  describe('cantidades', () => {
    it('suma y resta cantidad; al llegar a 0 elimina la línea', () => {
      const { result } = setup();
      const id = addLine(result);

      act(() => result.current.updateCartQty(id, 2));
      expect(lineAt(result, 0).quantity).toBe(3);

      act(() => result.current.updateCartQty(id, -3));
      expect(result.current.cart).toHaveLength(0);
    });

    it('clearCart vacía el carrito y reinicia el descuento global', () => {
      const { result } = setup();
      addLine(result);
      act(() => result.current.setGlobalDiscountRate(10));

      act(() => result.current.clearCart());

      expect(result.current.cart).toHaveLength(0);
      expect(result.current.globalDiscountRate).toBe(0);
    });
  });

  describe('descuento por producto (el importe es POR UNIDAD)', () => {
    it('porcentaje: 10% sobre 20 → 2 por unidad', () => {
      const { result } = setup();
      const id = addLine(result);

      act(() => result.current.updateItemDiscount(id, DiscountType.PERCENTAGE, 10));

      expect(result.current.cart[0]).toMatchObject({ discountType: DiscountType.PERCENTAGE, discountRate: 10, discountAmount: 2 });
    });

    it('porcentaje: se limita a 100% y avisa', () => {
      const { result } = setup();
      const id = addLine(result);

      act(() => result.current.updateItemDiscount(id, DiscountType.PERCENTAGE, 150));

      expect(result.current.cart[0]).toMatchObject({ discountRate: 100, discountAmount: 20 });
      expect(toast.warning).toHaveBeenCalledWith(expect.stringContaining('100%'));
    });

    it('importe: el valor es el PRECIO FINAL; el descuento es precio − valor (20 → 15 = 5)', () => {
      const { result } = setup();
      const id = addLine(result);

      act(() => result.current.updateItemDiscount(id, DiscountType.AMOUNT, 15));

      expect(result.current.cart[0]).toMatchObject({ discountType: DiscountType.AMOUNT, discountRate: 15, discountAmount: 5 });
    });

    it('importe: el precio final no puede superar el original (se limita a 20 → descuento 0)', () => {
      const { result } = setup();
      const id = addLine(result);

      act(() => result.current.updateItemDiscount(id, DiscountType.AMOUNT, 99));

      expect(result.current.cart[0]).toMatchObject({ discountRate: 20, discountAmount: 0 });
      expect(toast.warning).toHaveBeenCalled();
    });

    it('un valor negativo se trata como 0', () => {
      const { result } = setup();
      const id = addLine(result);

      act(() => result.current.updateItemDiscount(id, DiscountType.PERCENTAGE, -5));

      expect(lineAt(result, 0).discountAmount).toBe(0);
    });
  });

  describe('mayoreo', () => {
    it('el modo mayoreo global usa el precio mayorista solo en productos que lo tienen', () => {
      const { result } = setup();
      addLine(result, variant({ id: 'v1', wholesalePrice: 15 }));
      addLine(result, variant({ id: 'v2', sku: 'B', wholesalePrice: null }));

      act(() => result.current.toggleGlobalWholesale());

      expect(result.current.isGlobalWholesale).toBe(true);
      expect(result.current.cart[0]).toMatchObject({ price: 15, isWholesale: true });
      expect(result.current.cart[1]).toMatchObject({ price: 20, isWholesale: false });

      act(() => result.current.toggleGlobalWholesale());
      expect(result.current.cart[0]).toMatchObject({ price: 20, isWholesale: false });
    });

    it('cambiar a mayoreo recalcula el descuento porcentual sobre el nuevo precio', () => {
      const { result } = setup();
      const id = addLine(result);
      act(() => result.current.updateItemDiscount(id, DiscountType.PERCENTAGE, 10)); // 2 sobre 20

      act(() => result.current.toggleItemWholesale(id));

      expect(result.current.cart[0]).toMatchObject({ price: 15, discountAmount: 1.5 });
    });

    it('un producto sin precio mayorista no cambia y avisa', () => {
      const { result } = setup();
      const id = addLine(result, variant({ wholesalePrice: null }));

      act(() => result.current.toggleItemWholesale(id));

      expect(result.current.cart[0]).toMatchObject({ price: 20, isWholesale: false });
      expect(toast.warning).toHaveBeenCalledWith(expect.stringContaining('mayoreo'));
    });
  });

  describe('totales', () => {
    /** Línea A: 2 uds × 20 con 10% (2 por unidad). Línea B: 1 ud × 10. */
    function cartWithTwoLines() {
      const hook = setup();
      const a = addLine(hook.result, variant({ id: 'v1', salePrice: 20 }));
      addLine(hook.result, variant({ id: 'v2', sku: 'B', salePrice: 10 }));
      act(() => hook.result.current.updateCartQty(a, 1));
      act(() => hook.result.current.updateItemDiscount(a, DiscountType.PERCENTAGE, 10));
      return hook;
    }

    it('bruto = Σ precio×cantidad; descuentos de ítems = Σ descuentoUnitario×cantidad; neto = bruto − descuentos', () => {
      const { result } = cartWithTwoLines();

      expect(result.current.grossSubtotal).toBe(50); // 2×20 + 1×10
      expect(result.current.totalItemDiscounts).toBe(4); // 2 por unidad × 2 unidades
      expect(result.current.netSubtotal).toBe(46);
      expect(result.current.cartTotal).toBe(46); // sin descuento global
      expect(result.current.totalItemsCount).toBe(3);
    });

    it('el descuento global (%) se aplica sobre el neto y reduce el total', () => {
      const { result } = cartWithTwoLines();

      act(() => result.current.setGlobalDiscountRate(10));

      expect(result.current.globalDiscountAmount).toBe(4.6);
      expect(result.current.cartTotal).toBe(41.4);
    });

    it('el descuento global se limita a 100% y avisa; el total nunca es negativo', () => {
      const { result } = cartWithTwoLines();

      act(() => result.current.setGlobalDiscountRate(250));

      expect(result.current.globalDiscountRate).toBe(100);
      expect(result.current.globalDiscountAmount).toBe(46);
      expect(result.current.cartTotal).toBe(0);
      expect(toast.warning).toHaveBeenCalledWith(expect.stringContaining('100%'));
    });

    it('un descuento global negativo se trata como 0', () => {
      const { result } = cartWithTwoLines();

      act(() => result.current.setGlobalDiscountRate(-10));

      expect(result.current.globalDiscountRate).toBe(0);
      expect(result.current.cartTotal).toBe(46);
    });

    it('un carrito vacío tiene todos los totales en 0', () => {
      const { result } = setup();

      expect(result.current).toMatchObject({ grossSubtotal: 0, totalItemDiscounts: 0, netSubtotal: 0, cartTotal: 0, totalItemsCount: 0 });
    });
  });
});
