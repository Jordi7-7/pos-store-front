import React from 'react';
import {
  ShoppingCart,
  Trash2,
  Package,
  Maximize2,
  Tag,
  Minus,
  Plus,
  Percent,
  DollarSign,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { CartItem } from '../../types/pos.types';

interface POSCartListProps {
  cart: CartItem[];
  isGlobalWholesale: boolean;
  onToggleGlobalWholesale: () => void;
  onToggleItemWholesale: (cartItemId: string) => void;
  onUpdateCartQty: (cartItemId: string, delta: number) => void;
  onUpdateItemDiscount: (
    cartItemId: string,
    type: 'PERCENTAGE' | 'AMOUNT',
    inputVal: number,
  ) => void;
  onRemoveFromCart: (cartItemId: string) => void;
  onClearCart: () => void;
  onOpenImageZoom?: (url: string) => void;
}

export const POSCartList: React.FC<POSCartListProps> = ({
  cart,
  isGlobalWholesale,
  onToggleGlobalWholesale,
  onToggleItemWholesale,
  onUpdateCartQty,
  onUpdateItemDiscount,
  onRemoveFromCart,
  onClearCart,
  onOpenImageZoom,
}) => {
  return (
    <>
      {/* Cart Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <ShoppingCart className="w-4 h-4 text-primary" />
            <span>Lista de Compra</span>
          </h3>

          {/* Toggle Mayorista Global */}
          <button
            type="button"
            onClick={onToggleGlobalWholesale}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer border ${
              isGlobalWholesale
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-xs shadow-amber-500/10'
                : 'bg-bg-dark border-border-card text-neutral hover:text-secondary hover:border-border-card/80'
            }`}
            title="Alternar entre venta por unidad y venta mayoreo para todo el carrito"
          >
            <Tag
              className={`w-3.5 h-3.5 ${
                isGlobalWholesale ? 'text-amber-400' : 'text-neutral'
              }`}
            />
            <span>{isGlobalWholesale ? 'Venta Mayoreo' : 'Venta Unidad'}</span>
            {isGlobalWholesale && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse ml-0.5" />
            )}
          </button>
        </div>

        {cart.length > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            className="text-[10px] text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpiar Carrito</span>
          </button>
        )}
      </div>

      {/* Cart Items List */}
      {cart.length === 0 ? (
        <div className="h-80 border-2 border-dashed border-border-card rounded-xl flex flex-col items-center justify-center gap-1.5 text-center p-4">
          <ShoppingCart className="w-8 h-8 opacity-25 text-neutral" />
          <span className="text-[10px] text-neutral">
            No hay artículos cargados. Escanea un código de barras o escribe su SKU/Nombre arriba.
          </span>
        </div>
      ) : (
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {cart.map((item) => {
            const currentItemDiscountType = item.discountType || 'PERCENTAGE';
            const currentItemDiscountRate = item.discountRate || 0;
            const currentItemDiscountAmount = item.discountAmount || 0;
            const lineTotal = (item.price - currentItemDiscountAmount) * item.quantity;

            return (
              <div
                key={item.cartItemId}
                className="bg-bg-dark/40 border border-border-card/60 rounded-xl p-2.5 flex items-center gap-3 hover:border-primary/30 transition-all duration-150 group animate-fade-in"
              >
                {/* Thumbnail */}
                <div
                  onClick={() => {
                    if (item.imageUrl && onOpenImageZoom) {
                      onOpenImageZoom(item.imageUrl);
                    }
                  }}
                  className={`w-14 h-14 bg-bg-card border border-border-card/50 rounded-lg overflow-hidden shrink-0 flex items-center justify-center relative group/thumb transition-all ${
                    item.imageUrl ? 'cursor-pointer hover:border-primary/50' : ''
                  }`}
                >
                  {item.imageUrl ? (
                    <>
                      <img
                        src={item.imageUrl}
                        className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-200"
                        alt="mini"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-all duration-200">
                        <Maximize2 className="w-4 h-4 text-white" />
                      </div>
                    </>
                  ) : (
                    <Package className="w-6 h-6 text-neutral opacity-30" />
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h5 className="text-[11.5px] font-extrabold text-secondary truncate leading-tight">
                    {item.productName}
                  </h5>
                  <div className="flex items-center gap-2 mt-1 text-[9.5px] text-neutral flex-wrap">
                    <span className="font-mono font-bold text-[10.5px] text-primary/95 bg-primary/10 border border-primary/25 px-1.5 py-0.5 rounded tracking-wide shadow-2xs truncate max-w-[130px]">
                      {item.variantSku || 'S/SKU'}
                    </span>
                    <span className="text-border-card font-bold">·</span>
                    <span className="font-bold text-foreground font-mono text-[10.5px]">
                      ${item.price.toFixed(2)}
                    </span>

                    {/* Selector Mayoreo / Unidad por producto */}
                    {(() => {
                      const hasWholesale =
                        item.wholesalePrice !== null &&
                        item.wholesalePrice !== undefined &&
                        Number(item.wholesalePrice) > 0;
                      if (hasWholesale) {
                        return (
                          <button
                            type="button"
                            onClick={() => onToggleItemWholesale(item.cartItemId)}
                            className={`text-[8.5px] h-4.5 px-2 rounded-md font-bold flex items-center gap-1 transition-all cursor-pointer border shadow-2xs ${
                              item.isWholesale
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 hover:bg-amber-500/30'
                                : 'bg-bg-card text-neutral hover:text-secondary border-border-card hover:border-amber-500/40'
                            }`}
                            title={
                              item.isWholesale
                                ? `Venta mayoreo activa ($${Number(item.wholesalePrice).toFixed(2)}). Clic para volver a precio normal ($${item.unitSalePrice.toFixed(2)})`
                                : `Precio mayoreo: $${Number(item.wholesalePrice).toFixed(2)}. Clic para activar`
                            }
                          >
                            <Tag
                              className={`w-2.5 h-2.5 ${
                                item.isWholesale ? 'text-amber-400' : 'text-neutral'
                              }`}
                            />
                            <span>{item.isWholesale ? 'Mayoreo' : 'Unidad'}</span>
                          </button>
                        );
                      }
                      return (
                        <span
                          className="text-[8px] h-4 px-1.5 rounded bg-neutral/10 border border-neutral/20 text-neutral/60 font-semibold flex items-center gap-1 cursor-not-allowed"
                          title="Este producto no tiene precio mayoreo registrado en su ficha"
                        >
                          <Tag className="w-2.5 h-2.5 opacity-40" />
                          <span>Sin P. Mayoreo</span>
                        </span>
                      );
                    })()}

                    {item.maxStock <= 0 ? (
                      <Badge
                        variant="destructive"
                        className="text-[8px] h-3.5 px-1 leading-none font-extrabold"
                      >
                        Stock: {item.maxStock}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[8px] h-3.5 px-1 leading-none font-extrabold text-neutral border-neutral/30 bg-neutral/10"
                      >
                        Stock: {item.maxStock}
                      </Badge>
                    )}
                    {currentItemDiscountAmount > 0 && (
                      <Badge
                        variant="secondary"
                        className="text-[8px] h-3.5 px-1 leading-none font-extrabold bg-emerald-500/10 text-emerald-500 border-none"
                      >
                        Desc. -${currentItemDiscountAmount.toFixed(2)}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Cashier Controls */}
                <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                  {/* Quantity Selector */}
                  <div className="flex items-center bg-bg-card border border-border-card/70 rounded-lg h-7 p-0.5 shadow-xs">
                    <button
                      type="button"
                      onClick={() => onUpdateCartQty(item.cartItemId, -1)}
                      className="w-5 h-5 flex items-center justify-center hover:bg-bg-dark text-neutral hover:text-secondary rounded transition-colors cursor-pointer"
                      title="Disminuir cantidad"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="text-[10.5px] font-mono font-bold px-1.5 min-w-[20px] text-center text-secondary">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateCartQty(item.cartItemId, 1)}
                      className="w-5 h-5 flex items-center justify-center hover:bg-bg-dark text-neutral hover:text-secondary rounded transition-colors cursor-pointer"
                      title="Aumentar cantidad"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  {/* Compact Discount Pill */}
                  <div
                    className="flex items-center bg-bg-card border border-border-card/70 rounded-lg h-7 px-1 shadow-xs"
                    title={
                      currentItemDiscountType === 'PERCENTAGE'
                        ? 'Descuento (%)'
                        : 'Precio Especial ($)'
                    }
                  >
                    <button
                      type="button"
                      onClick={() => {
                        const nextType =
                          currentItemDiscountType === 'PERCENTAGE' ? 'AMOUNT' : 'PERCENTAGE';
                        const nextValue = nextType === 'AMOUNT' ? item.price : 0;
                        onUpdateItemDiscount(item.cartItemId, nextType, nextValue);
                      }}
                      className="w-5 h-5 rounded flex items-center justify-center text-neutral hover:text-secondary hover:bg-bg-dark transition-colors cursor-pointer shrink-0"
                      title={
                        currentItemDiscountType === 'PERCENTAGE'
                          ? 'Cambiar a Precio Fijo ($)'
                          : 'Cambiar a Porcentaje (%)'
                      }
                    >
                      {currentItemDiscountType === 'PERCENTAGE' ? (
                        <Percent className="w-2.5 h-2.5 text-blue-400 font-bold" />
                      ) : (
                        <DollarSign className="w-2.5 h-2.5 text-emerald-400 font-bold" />
                      )}
                    </button>
                    <input
                      type="number"
                      placeholder="0"
                      min="0"
                      step={currentItemDiscountType === 'PERCENTAGE' ? '1' : '0.01'}
                      value={
                        currentItemDiscountRate === 0 ? '' : currentItemDiscountRate
                      }
                      onChange={(e) => {
                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                        onUpdateItemDiscount(
                          item.cartItemId,
                          currentItemDiscountType,
                          val,
                        );
                      }}
                      className="w-11 h-6 text-[10.5px] font-mono text-right bg-transparent text-secondary focus:outline-none pr-0.5"
                    />
                  </div>

                  {/* Total Price for line */}
                  <div className="text-right min-w-[65px]">
                    <span className="text-xs sm:text-[13px] font-extrabold text-foreground font-mono block leading-tight">
                      ${lineTotal.toFixed(2)}
                    </span>
                    {currentItemDiscountAmount > 0 && (
                      <span className="text-[8.5px] font-mono text-emerald-400 block leading-tight">
                        -${(currentItemDiscountAmount * item.quantity).toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Remove item button */}
                  <button
                    type="button"
                    onClick={() => onRemoveFromCart(item.cartItemId)}
                    className="w-6 h-6 flex items-center justify-center text-neutral hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer shrink-0"
                    title="Eliminar item"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};
