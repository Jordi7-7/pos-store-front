import { DiscountType } from '@/modules/sales/domain/enums';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import type { CartItem } from '../../domain/entities/cart-item';
import { ProductType } from '@/modules/products/enums';
import { formatMoney } from '@/modules/auth/presentation/hooks/useSession';
import {
  clampGlobalDiscount,
  computeCartTotals,
  computeLineDiscount,
  hasWholesalePrice,
  withWholesale,
} from '../../domain/rules/cart-rules';

export function usePOSCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isGlobalWholesale, setIsGlobalWholesale] = useState<boolean>(false);
  const [globalDiscountType] = useState<DiscountType>(DiscountType.PERCENTAGE);
  const [globalDiscountRate, setGlobalDiscountRate] = useState<number>(0);

  const addVariantToCart = (product: any, variant: any, maxStock: number) => {
    const totalQtyInCart = cart
      .filter((item) => item.variantId === variant.id)
      .reduce((sum, item) => sum + item.quantity, 0);

    if (totalQtyInCart + 1 > maxStock) {
      toast.warning(
        `Aviso: El stock del producto "${product.name}" quedará en negativo (Stock disponible: ${maxStock} pzs.)`,
      );
    }

    const isSimple = product.type === ProductType.SIMPLE;
    const combText =
      !isSimple && variant.attributes && variant.attributes.length > 0
        ? variant.attributes.map((a: { name: string; value: string }) => `${a.name}: ${a.value}`).join(' / ')
        : 'Estándar';

    const imageUrl = variant.imageUrl;
    const unitSalePrice = Number(variant.salePrice || 0);
    const rawWholesale =
      variant.wholesalePrice !== undefined && variant.wholesalePrice !== null
        ? Number(variant.wholesalePrice)
        : null;
    const hasWholesale = rawWholesale !== null && rawWholesale > 0;
    const shouldUseWholesale = isGlobalWholesale && hasWholesale;
    const effectivePrice = shouldUseWholesale ? rawWholesale : unitSalePrice;

    const uniqueCartItemId = `${variant.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    setCart((prevCart) => [
      ...prevCart,
      {
        cartItemId: uniqueCartItemId,
        variantId: variant.id,
        productId: product.id,
        productName: product.name,
        variantSku: variant.sku,
        combinationText: combText,
        price: effectivePrice,
        unitSalePrice,
        wholesalePrice: rawWholesale,
        isWholesale: shouldUseWholesale,
        quantity: 1,
        imageUrl,
        maxStock,
        discountType: DiscountType.PERCENTAGE,
        discountRate: 0,
        discountAmount: 0,
      },
    ]);

    toast.success(`Se agregó al carrito: ${product.name} ${variant.sku}`);
  };

  const updateCartQty = (cartItemId: string, delta: number) => {
    const item = cart.find((i) => i.cartItemId === cartItemId);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      setCart((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
      toast.info('Item removido del carrito.');
      return;
    }

    const totalQtyInCart =
      cart
        .filter((i) => i.variantId === item.variantId && i.cartItemId !== cartItemId)
        .reduce((sum, i) => sum + i.quantity, 0) + newQty;

    if (totalQtyInCart > item.maxStock && delta > 0) {
      toast.warning(
        `Aviso: El stock del producto "${item.productName}" quedará en negativo (Stock disponible: ${item.maxStock} pzs.)`,
      );
    }

    setCart((prev) =>
      prev.map((i) => (i.cartItemId === cartItemId ? { ...i, quantity: newQty } : i)),
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
    toast.info('Item removido del carrito.');
  };

  const clearCart = () => {
    setCart([]);
    setGlobalDiscountRate(0);
  };

  const updateItemDiscount = (cartItemId: string, type: DiscountType, inputVal: number) => {
    const target = cart.find((item) => item.cartItemId === cartItemId);
    if (!target) return;

    const result = computeLineDiscount(target.price, type, inputVal);
    if (result.clamped === 'MAX_PERCENT') toast.warning('El descuento por producto no puede superar el 100%');
    if (result.clamped === 'ABOVE_PRICE') {
      toast.warning(`El precio de venta no puede superar el precio original del producto (${formatMoney(target.price)})`);
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.cartItemId === cartItemId
          ? { ...item, discountType: result.discountType, discountRate: result.discountRate, discountAmount: result.discountAmount }
          : item,
      ),
    );
  };

  const toggleGlobalWholesale = () => {
    const nextMode = !isGlobalWholesale;
    setIsGlobalWholesale(nextMode);
    setCart((prevCart) => prevCart.map((item) => withWholesale(item, nextMode)));

    if (nextMode) {
      toast.success('Precio mayoreo aplicado al carrito.');
    } else {
      toast.info('Precio regular por unidad restaurado en el carrito.');
    }
  };

  const toggleItemWholesale = (cartItemId: string) => {
    const target = cart.find((item) => item.cartItemId === cartItemId);
    if (!target) return;
    if (!hasWholesalePrice(target)) {
      toast.warning('Este producto no tiene precio mayoreo configurado.');
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) => (item.cartItemId === cartItemId ? withWholesale(item, !item.isWholesale) : item)),
    );
  };

  const totals = useMemo(
    () => computeCartTotals(cart, globalDiscountType, globalDiscountRate),
    [cart, globalDiscountType, globalDiscountRate],
  );
  const { grossSubtotal, totalItemDiscounts, netSubtotal, globalDiscountAmount, total: cartTotal } = totals;

  const setGlobalDiscountRateSafe = (rate: number) => {
    const result = clampGlobalDiscount(globalDiscountType, rate, netSubtotal);
    if (result.clamped === 'MAX_PERCENT') toast.warning('El descuento global no puede superar el 100%');
    if (result.clamped === 'ABOVE_SUBTOTAL') {
      toast.warning(`El descuento global no puede superar el subtotal neto (${formatMoney(netSubtotal)})`);
    }
    setGlobalDiscountRate(result.rate);
  };

  const totalItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  return {
    cart,
    setCart,
    isGlobalWholesale,
    globalDiscountType,
    globalDiscountRate,
    setGlobalDiscountRate: setGlobalDiscountRateSafe,
    globalDiscountAmount,
    grossSubtotal,
    totalItemDiscounts,
    netSubtotal,
    cartTotal,
    totalItemsCount,
    addVariantToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    updateItemDiscount,
    toggleGlobalWholesale,
    toggleItemWholesale,
  };
}
