import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import type { CartItem } from '../types/pos.types';

export function usePOSCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isGlobalWholesale, setIsGlobalWholesale] = useState<boolean>(false);
  const [globalDiscountType] = useState<'PERCENTAGE' | 'AMOUNT'>('PERCENTAGE');
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

    const combText =
      variant.attributeValues && variant.attributeValues.length > 0
        ? variant.attributeValues
            .map((av: any) => `${av.attribute?.name || 'Attr'}: ${av.value}`)
            .join(' / ')
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
        discountType: 'PERCENTAGE',
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

  const updateItemDiscount = (
    cartItemId: string,
    type: 'PERCENTAGE' | 'AMOUNT',
    inputVal: number,
  ) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.cartItemId !== cartItemId) return item;

        let val = Number(inputVal.toFixed(2));
        if (isNaN(val) || val < 0) {
          val = 0;
        }

        let calculatedAmount = 0;
        let displayRate = val;

        if (type === 'PERCENTAGE') {
          if (val > 100) {
            val = 100;
            displayRate = 100;
            toast.warning('El descuento por producto no puede superar el 100%');
          }
          calculatedAmount = Number(((item.price * val) / 100).toFixed(2));
        } else {
          if (val > item.price) {
            val = item.price;
            displayRate = item.price;
            toast.warning(
              `El precio de venta no puede superar el precio original del producto ($${item.price.toFixed(2)})`,
            );
          }
          calculatedAmount = Number((item.price - val).toFixed(2));
        }
        calculatedAmount = Math.max(0, Math.min(item.price, calculatedAmount));

        return {
          ...item,
          discountType: type,
          discountRate: displayRate,
          discountAmount: calculatedAmount,
        };
      }),
    );
  };

  const toggleGlobalWholesale = () => {
    const nextMode = !isGlobalWholesale;
    setIsGlobalWholesale(nextMode);

    setCart((prevCart) =>
      prevCart.map((item) => {
        const hasWholesale =
          item.wholesalePrice !== null &&
          item.wholesalePrice !== undefined &&
          Number(item.wholesalePrice) > 0;
        const shouldUseWholesale = nextMode && hasWholesale;
        const newPrice = shouldUseWholesale ? Number(item.wholesalePrice) : item.unitSalePrice;

        let newDiscountAmount = 0;
        if (item.discountType === 'PERCENTAGE') {
          newDiscountAmount = Number(((newPrice * (item.discountRate || 0)) / 100).toFixed(2));
        } else if (item.discountType === 'AMOUNT' && (item.discountAmount || 0) > 0) {
          newDiscountAmount = Math.max(0, Number((newPrice - (item.discountRate || 0)).toFixed(2)));
        }

        return {
          ...item,
          isWholesale: shouldUseWholesale,
          price: newPrice,
          discountAmount: newDiscountAmount,
        };
      }),
    );

    if (nextMode) {
      toast.success('Precio mayoreo aplicado al carrito.');
    } else {
      toast.info('Precio regular por unidad restaurado en el carrito.');
    }
  };

  const toggleItemWholesale = (cartItemId: string) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.cartItemId !== cartItemId) return item;

        const hasWholesale =
          item.wholesalePrice !== null &&
          item.wholesalePrice !== undefined &&
          Number(item.wholesalePrice) > 0;
        if (!hasWholesale) {
          toast.warning('Este producto no tiene precio mayoreo configurado.');
          return item;
        }

        const nextWholesale = !item.isWholesale;
        const newPrice = nextWholesale ? Number(item.wholesalePrice) : item.unitSalePrice;

        let newDiscountAmount = 0;
        if (item.discountType === 'PERCENTAGE') {
          newDiscountAmount = Number(((newPrice * (item.discountRate || 0)) / 100).toFixed(2));
        } else if (item.discountType === 'AMOUNT' && (item.discountAmount || 0) > 0) {
          newDiscountAmount = Math.max(0, Number((newPrice - (item.discountRate || 0)).toFixed(2)));
        }

        return {
          ...item,
          isWholesale: nextWholesale,
          price: newPrice,
          discountAmount: newDiscountAmount,
        };
      }),
    );
  };

  const grossSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const totalItemDiscounts = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.discountAmount || 0) * item.quantity, 0);
  }, [cart]);

  const netSubtotal = useMemo(() => {
    return Number((grossSubtotal - totalItemDiscounts).toFixed(2));
  }, [grossSubtotal, totalItemDiscounts]);

  const setGlobalDiscountRateSafe = (rate: number) => {
    let finalRate = Number(rate.toFixed(2));
    if (isNaN(finalRate) || finalRate < 0) {
      finalRate = 0;
    }

    if (globalDiscountType === 'PERCENTAGE') {
      if (finalRate > 100) {
        finalRate = 100;
        toast.warning('El descuento global no puede superar el 100%');
      }
    } else {
      if (finalRate > netSubtotal) {
        finalRate = netSubtotal;
        toast.warning(`El descuento global no puede superar el subtotal neto ($${netSubtotal.toFixed(2)})`);
      }
    }
    setGlobalDiscountRate(finalRate);
  };

  const globalDiscountAmount = useMemo(() => {
    let amount = 0;
    if (globalDiscountType === 'PERCENTAGE') {
      amount = Number(((netSubtotal * globalDiscountRate) / 100).toFixed(2));
    } else {
      amount = globalDiscountRate;
    }
    return Math.min(netSubtotal, amount);
  }, [netSubtotal, globalDiscountType, globalDiscountRate]);

  const cartTotal = useMemo(() => {
    return Number((netSubtotal - globalDiscountAmount).toFixed(2));
  }, [netSubtotal, globalDiscountAmount]);

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
