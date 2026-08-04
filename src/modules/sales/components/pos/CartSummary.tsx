import React from 'react';
import { 
  ShoppingCart, User, Trash2, Minus, Plus, 
  CreditCard, Loader2, Package, X 
} from 'lucide-react';

interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  variantSku: string;
  combinationText: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  maxStock: number;
}

interface CartSummaryProps {
  cart: CartItem[];
  customers: any[];
  selectedCustomerId: string;
  setSelectedCustomerId: (id: string) => void;
  cartTotal: number;
  onUpdateQty: (variantId: string, delta: number) => void;
  onRemove: (variantId: string) => void;
  onCheckout: () => void;
  isProcessing: boolean;
  activeSession: any;
}

export const CartSummary: React.FC<CartSummaryProps> = ({
  cart,
  customers,
  selectedCustomerId,
  setSelectedCustomerId,
  cartTotal,
  onUpdateQty,
  onRemove,
  onCheckout,
  isProcessing,
  activeSession
}) => {
  const handleClearCart = () => {
    cart.forEach(item => onRemove(item.variantId));
  };

  return (
    <div className="p-5 bg-bg-card border border-border-card rounded-2xl space-y-4 shadow-sm flex flex-col justify-between min-h-125">
      <div>
        
        {/* WALK-IN CUSTOMER CARD HEADER */}
        <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-xl mb-4 relative animate-fade-in">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="text-xs font-bold">
              {selectedCustomerId ? customers.find(c => c.id === selectedCustomerId)?.name : 'Walk-In Customer'}
            </span>
          </div>
          {selectedCustomerId ? (
            <button 
              onClick={() => setSelectedCustomerId('')}
              className="p-1 hover:bg-rose-500/10 hover:text-rose-500 rounded-lg transition-all"
              title="Quitar Cliente"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            >
              <option value="">Consumidor Final (General)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.identityNumber})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* CART HEADER ROW */}
        <div className="flex items-center justify-between border-b border-border-card pb-2 mb-3">
          <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <ShoppingCart className="w-4 h-4 text-primary" />
            <span>Item Cart</span>
          </h3>
          {cart.length > 0 && (
            <button 
              onClick={handleClearCart}
              className="text-[10px] text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Cart</span>
            </button>
          )}
        </div>

        {/* ITEMS LIST */}
        {cart.length === 0 ? (
          <div className="h-40 border-2 border-dashed border-border-card rounded-xl flex flex-col items-center justify-center gap-1.5 text-center p-4 mt-3">
            <ShoppingCart className="w-8 h-8 opacity-25 text-neutral" />
            <span className="text-[10px] text-neutral">Tu carrito está vacío. Haz click en un artículo para agregarlo.</span>
          </div>
        ) : (
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 mt-3">
            {cart.map((item) => (
              <div key={item.variantId} className="bg-bg-dark/40 border border-border-card/60 rounded-xl p-3 flex gap-3 relative hover:border-primary/30 transition-all duration-150 group">
                
                {/* Remove button */}
                <button 
                  onClick={() => onRemove(item.variantId)}
                  className="absolute top-2.5 right-2.5 text-neutral hover:text-rose-500 opacity-60 hover:opacity-100 transition-all"
                  title="Eliminar del carrito"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Thumbnail */}
                <div className="w-12 h-12 bg-bg-card border border-border-card/50 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} className="w-full h-full object-cover" alt="mini" />
                  ) : (
                    <Package className="w-6 h-6 text-neutral opacity-30" />
                  )}
                </div>

                {/* Info & Quantity controls */}
                <div className="flex-1 min-w-0">
                  <h5 className="text-[11px] font-extrabold text-secondary truncate pr-6 leading-tight">{item.productName}</h5>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[10px] text-neutral font-bold">${item.price.toFixed(2)}</span>
                    <span className="text-[9px] text-neutral">/ Nos</span>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    {/* Quantity controller */}
                    <div className="flex items-center gap-2 bg-bg-card border border-border-card/50 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.variantId, -1)}
                        className="p-1 hover:bg-bg-dark text-neutral hover:text-secondary rounded transition-colors"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="text-[10.5px] font-mono font-bold px-1.5 min-w-[14px] text-center text-secondary">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => onUpdateQty(item.variantId, 1)}
                        className="p-1 hover:bg-bg-dark text-neutral hover:text-secondary rounded transition-colors"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    {/* Unit Selector */}
                    <div className="bg-bg-card border border-border-card/50 rounded-lg px-2.5 py-1 text-[9px] text-neutral font-semibold select-none">
                      Nos
                    </div>

                    {/* Calculated Total for item */}
                    <span className="text-[11px] font-bold text-primary font-mono">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-2">


        {/* Calculation Rows */}
        <div className="space-y-1.5 text-xs text-neutral border-t border-border-card/50 pt-3">
          <div className="flex justify-between items-center">
            <span>Total Quantity</span>
            <span className="font-bold text-secondary font-mono">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Subtotal</span>
            <span className="font-bold text-secondary font-mono">${cartTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Tax</span>
            <span className="font-bold text-secondary font-mono">$0.00</span>
          </div>
          <div className="flex justify-between items-center text-sm font-extrabold text-secondary pt-2 border-t border-border-card/30">
            <span>Grand Total</span>
            <span className="text-lg text-primary font-mono">${cartTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="mt-4 space-y-2">
          <button 
            onClick={onCheckout}
            disabled={!activeSession || cart.length === 0 || isProcessing}
            className="w-full py-3 bg-primary hover:bg-primary-hover disabled:bg-neutral/20 disabled:text-neutral/60 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5"
          >
            {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            <span>Checkout</span>
          </button>
        </div>

      </div>
    </div>
  );
};
export default CartSummary;
