import React from 'react';
import { 
  ShoppingCart, User, Trash2, Minus, Plus, Banknote, 
  CreditCard, ArrowRightLeft, Loader2, Package 
} from 'lucide-react';
import { PaymentMethod } from '../../services/sales.service';

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
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
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
  paymentMethod,
  setPaymentMethod,
  cartTotal,
  onUpdateQty,
  onRemove,
  onCheckout,
  isProcessing,
  activeSession
}) => {
  return (
    <div className="p-5 bg-bg-card border border-border-card rounded-2xl space-y-4 shadow-sm flex flex-col justify-between min-h-[500px]">
      <div>
        <h3 className="text-xs font-bold text-secondary uppercase tracking-wider border-b border-border-card pb-2 flex items-center gap-1.5">
          <ShoppingCart className="w-4 h-4 text-primary" />
          <span>Carrito de Compra</span>
        </h3>
        
        {/* SELECT CLIENT */}
        <div className="space-y-1 pt-3">
          <label className="text-[10px] font-bold text-neutral uppercase tracking-wider flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            <span>Cliente de la Venta</span>
          </label>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none"
          >
            <option value="">Consumidor Final (General)</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.identityNumber})
              </option>
            ))}
          </select>
        </div>
        
        {cart.length === 0 ? (
          <div className="h-40 border-2 border-dashed border-border-card rounded-xl flex flex-col items-center justify-center gap-1.5 text-center p-4 mt-3">
            <ShoppingCart className="w-8 h-8 opacity-25 text-neutral" />
            <span className="text-[10px] text-neutral">Tu carrito está vacío. Haz click en un artículo para agregarlo.</span>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 mt-3">
            {cart.map((item) => (
              <div key={item.variantId} className="flex gap-2.5 bg-bg-dark/40 p-2.5 rounded-xl border border-border-card/60 text-secondary">
                <div className="w-10 h-10 bg-bg-card border border-border-card rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} className="w-full h-full object-cover" alt="mini" />
                  ) : (
                    <Package className="w-5 h-5 text-neutral opacity-40" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-1">
                    <h5 className="text-[10px] font-bold truncate leading-tight">{item.productName}</h5>
                    <button 
                      onClick={() => onRemove(item.variantId)}
                      className="text-neutral hover:text-rose-500 p-0.5 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[9px] text-neutral truncate mt-0.5">{item.combinationText}</p>
                  
                  <div className="flex justify-between items-center mt-1.5">
                    <span className="text-[10px] font-bold text-primary">${(item.price * item.quantity).toFixed(2)}</span>
                    
                    <div className="flex items-center gap-1.5 bg-bg-card border border-border-card rounded-lg p-0.5">
                      <button
                        onClick={() => onUpdateQty(item.variantId, -1)}
                        className="p-1 hover:bg-bg-dark text-neutral hover:text-secondary rounded"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="text-[10px] font-bold px-1 min-w-[12px] text-center">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQty(item.variantId, 1)}
                        className="p-1 hover:bg-bg-dark text-neutral hover:text-secondary rounded"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Cart Controls (Payment Methods & Totals) */}
      <div className="border-t border-border-card pt-4 space-y-4">
        
        {/* PAYMENT METHODS SELECTOR */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-neutral uppercase tracking-wider block">Método de Pago</span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setPaymentMethod(PaymentMethod.EFECTIVO)}
              className={`py-2 px-2 border rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                paymentMethod === PaymentMethod.EFECTIVO
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 font-bold'
                  : 'bg-bg-dark border-border-card text-neutral hover:text-secondary'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span className="text-[9px]">Efectivo</span>
            </button>
            
            <button
              onClick={() => setPaymentMethod(PaymentMethod.TARJETA)}
              className={`py-2 px-2 border rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                paymentMethod === PaymentMethod.TARJETA
                  ? 'bg-blue-500/10 border-blue-500 text-blue-500 font-bold'
                  : 'bg-bg-dark border-border-card text-neutral hover:text-secondary'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span className="text-[9px]">Tarjeta</span>
            </button>

            <button
              onClick={() => setPaymentMethod(PaymentMethod.TRANSFERENCIA)}
              className={`py-2 px-2 border rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                paymentMethod === PaymentMethod.TRANSFERENCIA
                  ? 'bg-purple-500/10 border-purple-500 text-purple-500 font-bold'
                  : 'bg-bg-dark border-border-card text-neutral hover:text-secondary'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span className="text-[9px]">Transf.</span>
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center text-xs font-bold text-secondary">
          <span>Total a Pagar:</span>
          <span className="text-base text-primary">${cartTotal.toFixed(2)}</span>
        </div>

        <button 
          onClick={onCheckout}
          disabled={!activeSession || cart.length === 0 || isProcessing}
          className="w-full py-3 bg-primary hover:bg-primary-hover disabled:bg-neutral/20 disabled:text-neutral/60 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5"
        >
          {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          <span>Procesar Venta</span>
        </button>
      </div>
    </div>
  );
};
export default CartSummary;
