import React, { useState, useMemo, useEffect } from 'react';
import { useProducts } from '../../products/hooks/useProducts';
import { useBranches } from '../../branches/hooks/useBranches';
import { 
  useOpenCashSession, 
  useCloseCashSession, 
  useRegisterExpense, 
  useProcessSale,
  useSales
} from '../hooks/useSales';
import { useCustomers } from '../hooks/useCustomers';
import { PaymentMethod } from '../services/sales.service';
import { 
  Search, MoreVertical, Wallet, ArrowRightLeft, Receipt, X, ShoppingBag, 
  ShoppingCart, Trash2, Minus, Plus, CreditCard, Loader2, Package, 
  Percent, DollarSign, Check, Banknote, User 
} from 'lucide-react';
import { toast } from 'sonner';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

// Subcomponents import
import { ThermalTicketModal } from './pos/ThermalTicketModal';
import { AperturaModal } from './pos/AperturaModal';
import { EgresoModal } from './pos/EgresoModal';
import { CierreModal } from './pos/CierreModal';
import { HistorialModal } from './pos/HistorialModal';


interface POSViewProps {
  selectedBranchId: string;
  activeSession: any;
  setActiveSession: (session: any) => void;
  localExpenses: any[];
  setLocalExpenses: React.Dispatch<React.SetStateAction<any[]>>;
}

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
  discountType?: 'PERCENTAGE' | 'AMOUNT';
  discountRate?: number;
  discountAmount?: number;
}

export const POSView: React.FC<POSViewProps> = ({
  selectedBranchId,
  activeSession,
  setActiveSession,
  localExpenses,
  setLocalExpenses
}) => {
  const { branches } = useBranches();
  const { customers } = useCustomers();
  const { sales } = useSales();

  // Search input selection
  const [searchTerm, setSearchTerm] = useState('');

  const { products, refetch: refetchProducts } = useProducts({ 
    page: 1, 
    limit: 1000, 
    search: '' 
  });

  const { openSession, isOpening } = useOpenCashSession();
  const { closeSession, isClosing } = useCloseCashSession();
  const { registerExpense: apiRegisterExpense, isRegistering } = useRegisterExpense();
  const { processSale, isProcessing } = useProcessSale();

  // Session Balance & Expense Form fields
  const [openingBalance, setOpeningBalance] = useState('150.00');
  const [closingBalance, setClosingBalance] = useState('200.00');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const expenseCategory = 'Servicios';

  // Modal Visibility states
  const [isAperturaModalOpen, setIsAperturaModalOpen] = useState(false);
  const [isEgresoModalOpen, setIsEgresoModalOpen] = useState(false);
  const [isCierreModalOpen, setIsCierreModalOpen] = useState(false);
  const [isHistorialModalOpen, setIsHistorialModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Cart States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  // Global Discount States
  const [globalDiscountType, setGlobalDiscountType] = useState<'PERCENTAGE' | 'AMOUNT'>('PERCENTAGE');
  const [globalDiscountRate, setGlobalDiscountRate] = useState<number>(0);

  // Payment states (previously in PaymentModal)
  const [addedPayments, setAddedPayments] = useState<{ paymentMethod: PaymentMethod; amount: number }[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.EFECTIVO);
  const [customAmountText, setCustomAmountText] = useState('');

  // Ticket Printing State
  const [lastCompletedSale, setLastCompletedSale] = useState<any | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);


  // Clock & shift timer
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [shiftDuration, setShiftDuration] = useState('00h 00m 00s');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
      
      if (activeSession && activeSession.createdAt) {
        const diffMs = now.getTime() - new Date(activeSession.createdAt).getTime();
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffMins = Math.floor((diffMs % 3600000) / 60000);
        const diffSecs = Math.floor((diffMs % 60000) / 1000);
        setShiftDuration(`${diffHrs}h ${diffMins}m ${diffSecs}s`);
      } else {
        setShiftDuration('00h 00m 00s');
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [activeSession]);



  const activeSessionSales = useMemo(() => {
    if (!activeSession || !sales) return [];
    return sales.filter((s: any) => s.cashSessionId === activeSession.id);
  }, [sales, activeSession]);

  const activeSessionExpenses = useMemo(() => {
    if (!activeSession || !localExpenses) return [];
    return localExpenses.filter((e: any) => e.cashSessionId === activeSession.id);
  }, [localExpenses, activeSession]);

  const handleOpenSession = async () => {
    const branch = selectedBranchId || (branches[0] && branches[0].id);
    if (!branch) {
      toast.warning('Por favor selecciona una sucursal activa.');
      return;
    }
    try {
      const res = await openSession({
        branchId: branch,
        openingBalance: parseFloat(openingBalance),
      });
      setActiveSession(res);
      setIsAperturaModalOpen(false);
      toast.success('¡Caja registradora abierta con éxito!');
    } catch (err: any) {
      toast.error(err.message || 'Error al abrir la caja.');
    }
  };

  const handleCloseSession = async () => {
    if (!activeSession) return;
    try {
      await closeSession({
        id: activeSession.id,
        closingBalance: parseFloat(closingBalance),
      });
      setActiveSession(null);
      setLocalExpenses([]);
      setIsCierreModalOpen(false);
      toast.success('¡Sesión de caja cerrada con éxito!');
    } catch (err: any) {
      toast.error(err.message || 'Error al cerrar la caja.');
    }
  };

  const handleAddExpense = async () => {
    const branch = selectedBranchId || (branches[0] && branches[0].id);
    if (!branch) return;
    if (!expenseDesc.trim()) {
      toast.warning('Por favor ingresa una descripción para el egreso.');
      return;
    }
    if (!expenseAmount || parseFloat(expenseAmount) <= 0) {
      toast.warning('Por favor ingresa un monto válido.');
      return;
    }
    try {
      await apiRegisterExpense({
        branchId: branch,
        cashSessionId: activeSession?.id,
        description: expenseDesc.trim(),
        amount: parseFloat(expenseAmount),
        category: expenseCategory
      });
      setLocalExpenses([...localExpenses, {
        id: Math.random().toString(),
        desc: expenseDesc.trim(),
        amount: parseFloat(expenseAmount),
        category: expenseCategory
      }]);
      setExpenseDesc('');
      setExpenseAmount('');
      setIsEgresoModalOpen(false);
      toast.success('¡Egreso registrado con éxito!');
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar el egreso.');
    }
  };

  const handleUpdateItemDiscount = (variantId: string, type: 'PERCENTAGE' | 'AMOUNT', rate: number) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.variantId !== variantId) return item;
      
      let finalRate = Number(rate.toFixed(2));
      if (isNaN(finalRate) || finalRate < 0) {
        finalRate = 0;
      }

      if (type === 'PERCENTAGE') {
        if (finalRate > 100) {
          finalRate = 100;
          toast.warning('El descuento por producto no puede superar el 100%');
        }
      } else {
        if (finalRate > item.price) {
          finalRate = item.price;
          toast.warning(`El descuento no puede superar el precio del producto ($${item.price.toFixed(2)})`);
        }
      }

      let calculatedAmount = 0;
      if (type === 'PERCENTAGE') {
        calculatedAmount = Number(((item.price * finalRate) / 100).toFixed(2));
      } else {
        calculatedAmount = finalRate;
      }
      calculatedAmount = Math.min(item.price, calculatedAmount);

      return {
        ...item,
        discountType: type,
        discountRate: finalRate,
        discountAmount: calculatedAmount
      };
    }));
  };

  const handleSetGlobalDiscountRate = (rate: number) => {
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

  const addVariantToCart = (product: any, variant: any, maxStock: number) => {
    const existing = cart.find(item => item.variantId === variant.id);
    
    if (existing) {
      const newQty = existing.quantity + 1;
      if (newQty > maxStock) {
        toast.warning(`Aviso: El stock del producto "${product.name}" quedará en negativo (Stock disponible: ${maxStock} pzs.)`);
      }
      setCart(cart.map(item => 
        item.variantId === variant.id 
          ? { ...item, quantity: newQty } 
          : item
      ));
    } else {
      const combText = variant.attributeValues && variant.attributeValues.length > 0
        ? variant.attributeValues.map((av: any) => `${av.attribute?.name || 'Attr'}: ${av.value}`).join(' / ')
        : 'Estándar';

      const imageUrl = (variant.images && variant.images.length > 0)
        ? variant.images[0].url
        : (product.images && product.images.length > 0) ? product.images[0].url : undefined;

      if (1 > maxStock) {
        toast.warning(`Aviso: El stock del producto "${product.name}" quedará en negativo (Stock disponible: ${maxStock} pzs.)`);
      }

      setCart([...cart, {
        variantId: variant.id,
        productId: product.id,
        productName: product.name,
        variantSku: variant.sku,
        combinationText: combText,
        price: variant.salePrice || 0,
        quantity: 1,
        imageUrl,
        maxStock,
        discountType: 'PERCENTAGE',
        discountRate: 0,
        discountAmount: 0
      }]);
    }
    toast.success(`Se agregó al carrito: ${product.name} ${variant.sku}`);
  };

  const handleUpdateCartQty = (variantId: string, delta: number) => {
    const item = cart.find(i => i.variantId === variantId);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      setCart(cart.filter(i => i.variantId !== variantId));
      toast.info('Item removido del carrito.');
      return;
    }

    if (newQty > item.maxStock && delta > 0) {
      toast.warning(`Aviso: El stock del producto "${item.productName}" quedará en negativo (Stock disponible: ${item.maxStock} pzs.)`);
    }

    setCart(cart.map(i => i.variantId === variantId ? { ...i, quantity: newQty } : i));
  };

  const handleRemoveFromCart = (variantId: string) => {
    setCart(cart.filter(i => i.variantId !== variantId));
    toast.info('Item removido del carrito.');
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = searchTerm.trim();
      if (!code) return;

      let foundVariant: any = null;
      let foundProduct: any = null;

      for (const p of products) {
        const match = p.variants?.find((v: any) => v.sku === code || v.barcode === code);
        if (match) {
          foundVariant = match;
          foundProduct = p;
          break;
        }
      }

      if (foundVariant && foundProduct) {
        const branch = selectedBranchId || (branches[0] && branches[0].id);
        const stockQty = foundVariant.stocks?.find((s: any) => s.branchId === branch)?.quantity || 0;
        if (stockQty <= 0) {
          toast.warning(`Aviso: El stock del producto "${foundProduct.name}" quedará en negativo (Stock disponible: ${stockQty} pzs.)`);
        }
        addVariantToCart(foundProduct, foundVariant, stockQty);
        setSearchTerm('');
      } else {
        toast.error(`No se encontró ningún producto con el código: "${code}"`);
      }
    }
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

  const amountPaid = useMemo(() => {
    return Number(addedPayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2));
  }, [addedPayments]);

  const remaining = useMemo(() => {
    return Math.max(0, Number((cartTotal - amountPaid).toFixed(2)));
  }, [cartTotal, amountPaid]);

  const quickAmounts = useMemo(() => {
    if (remaining <= 0) return [];
    const base = [remaining, 5, 10, 20, 50, 100];
    const unique = Array.from(new Set(base.map(v => Number(v.toFixed(2)))));
    return unique.filter(v => v >= remaining).sort((a, b) => a - b).slice(0, 4);
  }, [remaining]);

  const handleAddPayment = (amount?: number) => {
    const targetAmt = amount !== undefined ? amount : parseFloat(customAmountText);
    if (isNaN(targetAmt) || targetAmt <= 0) {
      toast.warning('Ingresa un monto de pago válido.');
      return;
    }
    
    if (remaining <= 0) {
      toast.warning('La venta ya está totalmente pagada.');
      return;
    }

    setAddedPayments([...addedPayments, { paymentMethod: selectedMethod, amount: Number(targetAmt.toFixed(2)) }]);
    setCustomAmountText('');
  };

  const handleRemovePayment = (index: number) => {
    setAddedPayments(addedPayments.filter((_, idx) => idx !== index));
  };

  const getMethodDetails = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.EFECTIVO:
        return { label: 'Efectivo', sub: 'Cash', icon: Banknote, colorClass: 'text-emerald-500 bg-emerald-500/10' };
      case PaymentMethod.TARJETA:
        return { label: 'Tarjeta', sub: 'Card', icon: CreditCard, colorClass: 'text-blue-500 bg-blue-500/10' };
      default:
        return { label: method, sub: 'Payment', icon: Banknote, colorClass: 'text-neutral bg-neutral/10' };
    }
  };

  const handleCompletePayment = async () => {
    const branch = selectedBranchId || (branches[0] && branches[0].id);
    if (!branch || !activeSession || cart.length === 0) return;

    if (amountPaid < cartTotal) {
      toast.warning(`Falta cubrir $${remaining.toFixed(2)} del total para poder procesar la venta.`);
      return;
    }

    const branchName = branches.find((b: any) => b.id === branch)?.name || 'Sucursal General';

    try {
      const res = await processSale({
        branchId: branch,
        cashSessionId: activeSession.id,
        customerId: selectedCustomerId || undefined,
        discountType: globalDiscountType,
        discountRate: globalDiscountRate,
        discountAmount: globalDiscountAmount,
        items: cart.map(i => ({
          variantId: i.variantId,
          quantity: i.quantity,
          price: i.price,
          discountType: i.discountType,
          discountRate: i.discountRate,
          discountAmount: i.discountAmount
        })),
        payments: addedPayments
      });

      const change = amountPaid - cartTotal;
      if (change > 0) {
        toast.info(`Cambio a entregar al cliente: $${change.toFixed(2)}`, { duration: 8000 });
      }

      const clientName = customers.find((c: any) => c.id === selectedCustomerId)?.name || 'Consumidor Final';
      const clientIdentity = customers.find((c: any) => c.id === selectedCustomerId)?.identityNumber || '9999999999';

      const saleDataForTicket = {
        invoiceNumber: res.invoiceNumber || `FAC-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString(),
        branchName,
        clientName,
        clientIdentity,
        items: cart.map(i => ({
          variantId: i.variantId,
          productName: i.productName,
          combinationText: i.combinationText,
          quantity: i.quantity,
          price: i.price,
          discountAmount: i.discountAmount || 0
        })),
        paymentMethod: addedPayments[0]?.paymentMethod || PaymentMethod.EFECTIVO,
        discountAmount: globalDiscountAmount,
        total: cartTotal
      };

      setLastCompletedSale(saleDataForTicket);
      setCart([]);
      setAddedPayments([]);
      setSelectedCustomerId('');
      setGlobalDiscountRate(0);
      refetchProducts(); // refrescar stock

      setIsTicketModalOpen(true);
      toast.success('¡Venta procesada con éxito y cargada en Kardex!');
    } catch (err: any) {
      toast.error(err.message || 'Error al procesar la venta.');
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Premium POS Next Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-bg-card border border-border-card rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2.5 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-secondary tracking-tight">POS Next</span>
              <span className="bg-primary/10 border border-primary/20 text-[9px] font-bold text-primary px-1.5 py-0.5 rounded-full">v1.7.0</span>
            </div>
            <span className="text-[10px] text-neutral">Demo / Sucursal Activa</span>
          </div>
        </div>

        {/* Digital Clock & Shift Open Status */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-dark border border-border-card rounded-xl text-xs text-secondary font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span>{currentTime}</span>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl text-xs font-semibold ${
            activeSession 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
              : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${activeSession ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>
              {activeSession ? `Shift Open: ${shiftDuration}` : 'Shift Closed'}
            </span>
          </div>
        </div>

        {/* Status Indicators & User Profile initials */}
        <div className="flex items-center gap-3">
          {/* Reload / Sync */}
          <button onClick={() => refetchProducts()} className="p-2 bg-bg-dark border border-border-card rounded-lg text-neutral hover:text-secondary transition-all cursor-pointer" title="Force Reload Catalog">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
          </button>
          
          <div className="w-9 h-9 rounded-full bg-primary text-white border border-primary/30 flex items-center justify-center font-bold text-xs" title="User Initials">
            US
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 relative items-start">
        
        {/* LEFT COLUMN: Barcode scan input & cart products list (3/5 width) */}
        <div className="lg:col-span-3 space-y-4 bg-bg-card border border-border-card rounded-2xl p-5 shadow-sm min-h-[500px]">
          
          {/* Barcode Search Header with Shift menu */}
          <div className="flex gap-3 items-center justify-between border-b border-border-card pb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-neutral" />
              <input 
                type="text" 
                placeholder="Escanea código de barras o busca por SKU/Nombre y presiona Enter..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyPress}
                className="w-full bg-bg-dark border border-border-card rounded-xl py-2 pl-10 pr-4 text-xs text-secondary focus:outline-none focus:border-primary transition-all placeholder-neutral"
                autoFocus
              />
            </div>

            {/* Menu Options Button using shadcn Popover */}
            <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <PopoverTrigger
                render={
                  <button
                    className="p-2.5 bg-bg-dark border border-border-card rounded-xl text-neutral hover:text-secondary hover:border-primary/50 transition-all flex items-center justify-center cursor-pointer"
                    title="Administración de Caja Chica"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                }
              />
              <PopoverContent align="end" className="w-52 bg-bg-card border border-border-card rounded-xl shadow-2xl z-20 py-2">
                <div className="px-3 pb-1 mb-1 border-b border-border-card text-[9px] uppercase tracking-wider font-bold text-neutral">Caja Chica</div>
                
                {!activeSession ? (
                  <button
                    onClick={() => {
                      setIsAperturaModalOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-emerald-500 hover:bg-bg-dark font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Apertura de Caja</span>
                  </button>
                ) : (
                  <>
                    <div className="px-4 py-1.5 text-[10px] text-emerald-500 font-bold bg-emerald-500/5 mx-2 rounded mb-2 border border-emerald-500/10 flex items-center gap-1.5 select-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Caja Abierta</span>
                    </div>
                    
                    <button
                      onClick={() => {
                        setIsEgresoModalOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-secondary hover:bg-bg-dark font-medium transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 text-amber-500" />
                      <span>Registrar Egreso (Gasto)</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsHistorialModalOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-secondary hover:bg-bg-dark font-medium transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5 text-primary" />
                      <span>Historial de la Sesión</span>
                    </button>

                    <div className="border-t border-border-card my-1.5" />
                    
                    <button
                      onClick={() => {
                        setIsCierreModalOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-rose-500 hover:bg-bg-dark font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cierre de Caja y Sesión</span>
                    </button>
                  </>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {/* Cart Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4 text-primary" />
              <span>Lista de Compra</span>
            </h3>
            {cart.length > 0 && (
              <button 
                onClick={() => { setCart([]); setAddedPayments([]); toast.info('Carrito vaciado.'); }}
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
              <span className="text-[10px] text-neutral">No hay artículos cargados. Escanea un código de barras o escribe su SKU/Nombre arriba.</span>
            </div>
          ) : (
            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
              {cart.map((item) => {
                const currentItemDiscountType = item.discountType || 'PERCENTAGE';
                const currentItemDiscountRate = item.discountRate || 0;
                const currentItemDiscountAmount = item.discountAmount || 0;
                const lineTotal = (item.price - currentItemDiscountAmount) * item.quantity;

                return (
                  <div key={item.variantId} className="bg-bg-dark/40 border border-border-card/60 rounded-xl p-3 flex flex-col gap-2 relative hover:border-primary/30 transition-all duration-150 group animate-fade-in">
                    
                    {/* Remove button */}
                    <button 
                      onClick={() => handleRemoveFromCart(item.variantId)}
                      className="absolute top-2.5 right-2.5 text-neutral hover:text-rose-500 opacity-60 hover:opacity-100 transition-all cursor-pointer"
                      title="Eliminar item"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex gap-3">
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
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-neutral font-bold">${item.price.toFixed(2)}</span>
                          {item.maxStock <= 0 ? (
                            <Badge variant="destructive" className="text-[8.5px] h-4 px-1 leading-none font-extrabold">
                              Stock: {item.maxStock} pzs.
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[8.5px] h-4 px-1 leading-none font-extrabold text-neutral border-neutral/30 bg-neutral/10">
                              Stock: {item.maxStock} pzs.
                            </Badge>
                          )}
                          {currentItemDiscountAmount > 0 && (
                            <Badge variant="secondary" className="text-[8.5px] h-4 px-1 leading-none font-extrabold bg-emerald-500/10 text-emerald-500 border-none">
                              Desc. -${currentItemDiscountAmount.toFixed(2)}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          {/* Quantity controller */}
                          <div className="flex items-center gap-2 bg-bg-card border border-border-card/50 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateCartQty(item.variantId, -1)}
                              className="p-1 hover:bg-bg-dark text-neutral hover:text-secondary rounded transition-colors cursor-pointer"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="text-[10.5px] font-mono font-bold px-1.5 min-w-[14px] text-center text-secondary">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateCartQty(item.variantId, 1)}
                              className="p-1 hover:bg-bg-dark text-neutral hover:text-secondary rounded transition-colors cursor-pointer"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>

                          {/* Calculated Total for item */}
                          <span className="text-[11px] font-bold text-primary font-mono">${lineTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Inline Discount Control */}
                    <div className="flex items-center justify-between bg-bg-dark/20 border border-border-card/30 rounded-lg p-1.5 mt-1">
                      <span className="text-[8.5px] font-bold uppercase tracking-wider text-neutral">Descuento de Línea:</span>
                      <div className="flex items-center gap-1.5">
                        {/* Toggle button */}
                        <button
                          type="button"
                          onClick={() => {
                            const nextType = currentItemDiscountType === 'PERCENTAGE' ? 'AMOUNT' : 'PERCENTAGE';
                            handleUpdateItemDiscount(item.variantId, nextType, currentItemDiscountRate);
                          }}
                          className="p-1 rounded bg-bg-card border border-border-card text-[9px] hover:text-secondary transition-all flex items-center justify-center cursor-pointer"
                          title={currentItemDiscountType === 'PERCENTAGE' ? 'Cambiar a Cantidad ($)' : 'Cambiar a Porcentaje (%)'}
                        >
                          {currentItemDiscountType === 'PERCENTAGE' ? (
                            <Percent className="w-2.5 h-2.5 text-blue-400" />
                          ) : (
                            <DollarSign className="w-2.5 h-2.5 text-emerald-400" />
                          )}
                        </button>
                        {/* Discount rate input */}
                        <input
                          type="number"
                          placeholder="0"
                          min="0"
                          value={currentItemDiscountRate || ''}
                          onChange={(e) => {
                            const val = Math.max(0, parseFloat(e.target.value) || 0);
                            handleUpdateItemDiscount(item.variantId, currentItemDiscountType, val);
                          }}
                          className="w-14 bg-bg-card border border-border-card rounded px-1.5 py-0.5 text-[10px] text-secondary text-right focus:outline-none focus:border-primary/50"
                        />
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Payments details, client selector, total breakdown (2/5 width) */}
        <div className="lg:col-span-2 space-y-4 bg-bg-card border border-border-card rounded-2xl p-5 shadow-sm">
          
          <h3 className="text-xs font-bold text-secondary uppercase tracking-wider border-b border-border-card pb-3">
            Detalles de Pago y Cierre
          </h3>

          {/* Customer selector card */}
          <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-xl relative">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="text-xs font-bold">
                {selectedCustomerId ? customers.find(c => c.id === selectedCustomerId)?.name : 'Walk-In Customer / Consumidor Final'}
              </span>
            </div>
            {selectedCustomerId ? (
              <button 
                onClick={() => setSelectedCustomerId('')}
                className="p-1 hover:bg-rose-500/10 hover:text-rose-500 rounded-lg transition-all cursor-pointer z-10"
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

          {/* Global Discount Block */}
          {cart.length > 0 && (
            <div className="bg-bg-dark/40 border border-border-card rounded-xl p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-neutral uppercase tracking-wider">Descuento Global Venta</span>
                {globalDiscountAmount > 0 && (
                  <span className="text-[10px] font-bold text-emerald-500">-${globalDiscountAmount.toFixed(2)}</span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const nextType = globalDiscountType === 'PERCENTAGE' ? 'AMOUNT' : 'PERCENTAGE';
                    setGlobalDiscountType(nextType);
                  }}
                  className="px-3 bg-bg-card border border-border-card rounded-xl text-neutral hover:text-secondary text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  {globalDiscountType === 'PERCENTAGE' ? (
                    <>
                      <Percent className="w-3 h-3 text-blue-400" />
                      <span>%</span>
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-3 h-3 text-emerald-400" />
                      <span>$</span>
                    </>
                  )}
                </button>
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  value={globalDiscountRate || ''}
                  onChange={(e) => {
                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                    handleSetGlobalDiscountRate(val);
                  }}
                  className="flex-1 bg-bg-card border border-border-card rounded-xl py-1.5 px-3 text-xs text-secondary text-right focus:outline-none focus:border-primary font-mono"
                />
              </div>
            </div>
          )}

          {/* Calculation Rows */}
          <div className="space-y-1.5 text-xs text-neutral border-t border-border-card/50 pt-3">
            <div className="flex justify-between items-center">
              <span>Cantidad de Artículos</span>
              <span className="font-bold text-secondary font-mono">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Subtotal Bruto</span>
              <span className="font-bold text-secondary font-mono">${grossSubtotal.toFixed(2)}</span>
            </div>
            {totalItemDiscounts > 0 && (
              <div className="flex justify-between items-center text-emerald-500">
                <span>Descuento por Ítem</span>
                <span className="font-bold font-mono">-${totalItemDiscounts.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span>Subtotal Neto</span>
              <span className="font-bold text-secondary font-mono">${netSubtotal.toFixed(2)}</span>
            </div>
            {globalDiscountAmount > 0 && (
              <div className="flex justify-between items-center text-emerald-500 font-semibold">
                <span>Descuento Global Venta</span>
                <span className="font-bold font-mono">-${globalDiscountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm font-extrabold text-secondary pt-2 border-t border-border-card/30">
              <span>Monto Total a Cobrar</span>
              <span className="text-lg text-primary font-mono">${cartTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Section */}
          {cart.length > 0 && (
            <div className="border-t border-border-card/50 pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-neutral uppercase tracking-wider">Cargar Pagos</span>
                <div className="text-right">
                  <span className="text-[10px] text-amber-500 uppercase font-bold block">Por Pagar</span>
                  <span className="text-sm font-extrabold text-amber-500 font-mono">${remaining.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Methods selector grid */}
              <div className="grid grid-cols-2 gap-2">
                {Object.values(PaymentMethod).map((method) => {
                  const details = getMethodDetails(method);
                  const Icon = details.icon;
                  const isSelected = selectedMethod === method;
                  return (
                    <div 
                      key={method}
                      onClick={() => setSelectedMethod(method)}
                      className={`p-2.5 border rounded-xl cursor-pointer flex items-center gap-2.5 transition-all ${
                        isSelected
                          ? 'bg-primary/5 border-primary text-secondary'
                          : 'bg-bg-dark border-border-card text-neutral hover:text-secondary hover:border-neutral/30'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg ${isSelected ? details.colorClass : 'bg-bg-card text-neutral'}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold block leading-none">{details.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Payment Input custom amount */}
              <div className="bg-bg-dark/30 border border-border-card/50 rounded-2xl p-3 space-y-3">
                {/* Cash suggestions for quick click */}
                {quickAmounts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {quickAmounts.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleAddPayment(amt)}
                        className="px-2 py-1 bg-bg-card border border-border-card hover:border-primary/40 hover:text-primary rounded-lg text-[10px] font-bold font-mono text-secondary transition-all cursor-pointer"
                      >
                        ${amt.toFixed(2)}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="0.00"
                    min="0"
                    value={customAmountText}
                    onChange={(e) => setCustomAmountText(e.target.value)}
                    className="flex-1 bg-bg-dark border border-border-card rounded-xl py-1.5 px-3 text-xs text-secondary font-mono focus:outline-none focus:border-primary placeholder-neutral"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddPayment()}
                    className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer"
                  >
                    Agregar
                  </button>
                </div>
              </div>

              {/* Added Payments List */}
              {addedPayments.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-neutral uppercase tracking-wider block">Pagos Registrados</span>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {addedPayments.map((p, idx) => {
                      const details = getMethodDetails(p.paymentMethod);
                      const Icon = details.icon;
                      return (
                        <div key={idx} className="flex items-center justify-between p-2 bg-bg-dark/40 border border-border-card/50 rounded-lg text-xs">
                          <div className="flex items-center gap-2">
                            <div className={`p-1 rounded ${details.colorClass}`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-bold text-secondary">{details.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-secondary font-mono">${p.amount.toFixed(2)}</span>
                            <button
                              type="button"
                              onClick={() => handleRemovePayment(idx)}
                              className="p-0.5 text-neutral hover:text-rose-500 hover:bg-rose-500/10 rounded transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Cash change helper */}
              {amountPaid > cartTotal && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-xl flex justify-between items-center animate-fade-in shadow-sm">
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-wider block opacity-90">Vuelto / Cambio a entregar</span>
                  </div>
                  <span className="text-xl font-mono font-extrabold">${(amountPaid - cartTotal).toFixed(2)}</span>
                </div>
              )}

            </div>
          )}

          {/* ACTION SUBMIT BUTTON */}
          <div className="pt-2">
            <button 
              onClick={handleCompletePayment}
              disabled={!activeSession || cart.length === 0 || isProcessing || amountPaid < cartTotal}
              className="w-full py-3 bg-primary hover:bg-primary-hover disabled:bg-neutral/20 disabled:text-neutral/60 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>Completar Venta</span>
            </button>
          </div>

        </div>

      </div>

      {/* Thermal Ticket Printer simulation */}
      <ThermalTicketModal 
        isOpen={isTicketModalOpen}
        onClose={() => {
          setIsTicketModalOpen(false);
          setLastCompletedSale(null);
        }}
        saleData={lastCompletedSale}
      />

      {/* Caja Chica Control modals */}
      <AperturaModal 
        isOpen={isAperturaModalOpen}
        onClose={() => setIsAperturaModalOpen(false)}
        openingBalance={openingBalance}
        setOpeningBalance={setOpeningBalance}
        onOpenSession={handleOpenSession}
        isOpening={isOpening}
      />

      <EgresoModal 
        isOpen={isEgresoModalOpen}
        onClose={() => setIsEgresoModalOpen(false)}
        expenseDesc={expenseDesc}
        setExpenseDesc={setExpenseDesc}
        expenseAmount={expenseAmount}
        setExpenseAmount={setExpenseAmount}
        onAddExpense={handleAddExpense}
        isRegistering={isRegistering}
      />

      <CierreModal 
        isOpen={isCierreModalOpen}
        onClose={() => setIsCierreModalOpen(false)}
        closingBalance={closingBalance}
        setClosingBalance={setClosingBalance}
        onCloseSession={handleCloseSession}
        isClosing={isClosing}
      />

      <HistorialModal 
        isOpen={isHistorialModalOpen}
        onClose={() => setIsHistorialModalOpen(false)}
        activeSessionSales={activeSessionSales}
        activeSessionExpenses={activeSessionExpenses}
      />

    </div>
  );
};
export default POSView;
