import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useProducts } from '../../products/hooks/useProducts';
import { useCategories } from '../../products/hooks/useCategories';
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
import { Search, MoreVertical, Wallet, ArrowRightLeft, Receipt, X, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

// Subcomponents import
import { CatalogGrid } from './pos/CatalogGrid';
import { CartSummary } from './pos/CartSummary';
import { ThermalTicketModal } from './pos/ThermalTicketModal';
import { CashSessionModals } from './pos/CashSessionModals';
import { PaymentModal } from './pos/PaymentModal';


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
}

export const POSView: React.FC<POSViewProps> = ({
  selectedBranchId,
  activeSession,
  setActiveSession,
  localExpenses,
  setLocalExpenses
}) => {
  const { branches } = useBranches();
  const { categories } = useCategories();
  const { customers } = useCustomers();
  const { sales } = useSales();

  // Search & Categories selection
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const { products, isLoading: isLoadingProducts, refetch: refetchProducts } = useProducts({ 
    page: 1, 
    limit: 100, 
    search: searchTerm.trim() 
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
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isAperturaModalOpen, setIsAperturaModalOpen] = useState(false);
  const [isEgresoModalOpen, setIsEgresoModalOpen] = useState(false);
  const [isCierreModalOpen, setIsCierreModalOpen] = useState(false);
  const [isHistorialModalOpen, setIsHistorialModalOpen] = useState(false);

  // Cart States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  // Ticket Printing State
  // Ticket Printing State
  const [lastCompletedSale, setLastCompletedSale] = useState<any | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);


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

  const optionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setIsOptionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!selectedCategoryId) return products;
    return products.filter((p: any) => p.categoryId === selectedCategoryId);
  }, [products, selectedCategoryId]);

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

  const handleProductCardClick = (product: any) => {
    if (!activeSession) {
      toast.warning('Debes abrir la caja registradora para poder vender.');
      setIsAperturaModalOpen(true);
      return;
    }

    const branch = selectedBranchId || (branches[0] && branches[0].id);
    const variants = product.variants || [];

    if (variants.length > 0) {
      const v = variants[0];
      const stockQty = v.stocks?.find((s: any) => s.branchId === branch)?.quantity || 0;
      if (stockQty <= 0) {
        toast.warning(`El producto "${product.name}" no tiene existencias en esta sucursal.`);
        return;
      }
      addVariantToCart(product, v, stockQty);
    } else {
      toast.warning(`El producto "${product.name}" no tiene variantes configuradas.`);
    }
  };


  const addVariantToCart = (product: any, variant: any, maxStock: number) => {
    const existing = cart.find(item => item.variantId === variant.id);
    
    if (existing) {
      if (existing.quantity >= maxStock) {
        toast.warning(`No puedes agregar más unidades. El stock máximo disponible es de ${maxStock} pzs.`);
        return;
      }
      setCart(cart.map(item => 
        item.variantId === variant.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      const combText = variant.attributeValues && variant.attributeValues.length > 0
        ? variant.attributeValues.map((av: any) => `${av.attribute?.name || 'Attr'}: ${av.value}`).join(' / ')
        : 'Estándar';

      const imageUrl = (variant.images && variant.images.length > 0)
        ? variant.images[0].url
        : (product.images && product.images.length > 0) ? product.images[0].url : undefined;

      setCart([...cart, {
        variantId: variant.id,
        productId: product.id,
        productName: product.name,
        variantSku: variant.sku,
        combinationText: combText,
        price: variant.salePrice || 0,
        quantity: 1,
        imageUrl,
        maxStock
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

    if (newQty > item.maxStock) {
      toast.warning(`Existencias insuficientes. El stock máximo es de ${item.maxStock} pzs.`);
      return;
    }

    setCart(cart.map(i => i.variantId === variantId ? { ...i, quantity: newQty } : i));
  };

  const handleRemoveFromCart = (variantId: string) => {
    setCart(cart.filter(i => i.variantId !== variantId));
    toast.info('Item removido del carrito.');
  };

  const handleCheckoutClick = () => {
    const branch = selectedBranchId || (branches[0] && branches[0].id);
    if (!branch || !activeSession || cart.length === 0) return;
    setIsPaymentModalOpen(true);
  };

  const handleCompletePayment = async (payments: { paymentMethod: PaymentMethod; amount: number }[]) => {
    const branch = selectedBranchId || (branches[0] && branches[0].id);
    if (!branch || !activeSession || cart.length === 0) return;

    const branchName = branches.find((b: any) => b.id === branch)?.name || 'Sucursal General';
    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    try {
      const res = await processSale({
        branchId: branch,
        cashSessionId: activeSession.id,
        customerId: selectedCustomerId || undefined,
        items: cart.map(i => ({
          variantId: i.variantId,
          quantity: i.quantity,
          price: i.price
        })),
        payments: payments
      });

      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const change = totalPaid - totalAmount;
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
        items: cart,
        paymentMethod: payments[0]?.paymentMethod || PaymentMethod.EFECTIVO,
        total: totalAmount
      };

      setLastCompletedSale(saleDataForTicket);
      setCart([]);
      setSelectedCustomerId('');
      refetchProducts(); // refrescar stock

      setIsPaymentModalOpen(false);
      setIsTicketModalOpen(true);
      toast.success('¡Venta procesada con éxito y cargada en Kardex!');
    } catch (err: any) {
      toast.error(err.message || 'Error al procesar la venta.');
      throw err;
    }
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

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
              <span className="bg-primary/10 border border-primary/20 text-[9px] font-bold text-primary px-1.5 py-0.5 rounded-full">v1.6.1</span>
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
          {/* Signal Indicator */}
          <div className="p-2 bg-bg-dark border border-border-card rounded-lg text-neutral hover:text-secondary transition-all" title="Internet Connected">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h.01M12 12h.01M19 12h.01M8 12a4 4 0 0 1 8 0m-11-3a7 7 0 0 1 14 0m-17-3a10 10 0 0 1 20 0"/></svg>
          </div>
          {/* Database Connected */}
          <div className="p-2 bg-bg-dark border border-border-card rounded-lg text-neutral hover:text-emerald-500 transition-all" title="Database Sync OK">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 2v9M8 5l4-3 4 3"/></svg>
          </div>
          {/* Printer status */}
          <div className="p-2 bg-bg-dark border border-border-card rounded-lg text-neutral hover:text-secondary transition-all" title="Printer Online">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6zM6 2h12v4H6z"/></svg>
          </div>
          {/* Reload / Sync */}
          <button onClick={() => refetchProducts()} className="p-2 bg-bg-dark border border-border-card rounded-lg text-neutral hover:text-secondary transition-all" title="Force Reload Catalog">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
          </button>
          
          <div className="w-9 h-9 rounded-full bg-primary text-white border border-primary/30 flex items-center justify-center font-bold text-xs" title="User Initials">
            US
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 relative">
      
      {/* Product Catalog/Grid Selection */}
      <div className="xl:col-span-2 space-y-6">
        
        {/* Catalog View Header with 3 dots and category filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-bg-card border border-border-card rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 w-full md:w-auto flex-1">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral" />
              <input 
                type="text" 
                placeholder="Buscar por nombre o SKU..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-bg-dark border border-border-card rounded-xl py-2.5 pl-10 pr-4 text-xs text-secondary focus:outline-none focus:border-primary transition-all placeholder-neutral"
              />
            </div>

            {/* Menu Options Button */}
            <div className="relative" ref={optionsRef}>
              <button
                onClick={() => setIsOptionsOpen(!isOptionsOpen)}
                className="p-2.5 bg-bg-dark border border-border-card rounded-xl text-neutral hover:text-secondary hover:border-primary/50 transition-all flex items-center justify-center"
                title="Administración de Caja Chica"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isOptionsOpen && (
                <div className="absolute left-0 mt-2 w-52 bg-bg-card border border-border-card rounded-xl shadow-2xl z-20 py-2 animate-fade-in">
                  <div className="px-3 pb-1 mb-1 border-b border-border-card text-[9px] uppercase tracking-wider font-bold text-neutral">Caja Chica</div>
                  
                  {!activeSession ? (
                    <button
                      onClick={() => {
                        setIsAperturaModalOpen(true);
                        setIsOptionsOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-emerald-500 hover:bg-bg-dark font-semibold transition-colors flex items-center gap-2"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span>Apertura de Caja</span>
                    </button>
                  ) : (
                    <>
                      <div className="px-4 py-1.5 text-[10px] text-emerald-500 font-bold bg-emerald-500/5 mx-2 rounded mb-2 border border-emerald-500/10 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Caja Abierta</span>
                      </div>
                      
                      <button
                        onClick={() => {
                          setIsEgresoModalOpen(true);
                          setIsOptionsOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-secondary hover:bg-bg-dark font-medium transition-colors flex items-center gap-2"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 text-amber-500" />
                        <span>Registrar Egreso (Gasto)</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsHistorialModalOpen(true);
                          setIsOptionsOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-secondary hover:bg-bg-dark font-medium transition-colors flex items-center gap-2"
                      >
                        <Receipt className="w-3.5 h-3.5 text-primary" />
                        <span>Historial de la Sesión</span>
                      </button>

                      <div className="border-t border-border-card my-1.5" />
                      
                      <button
                        onClick={() => {
                          setIsCierreModalOpen(true);
                          setIsOptionsOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-rose-500 hover:bg-bg-dark font-semibold transition-colors flex items-center gap-2"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Cierre de Caja y Sesión</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button 
              onClick={() => setSelectedCategoryId(null)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                !selectedCategoryId 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'bg-bg-dark border border-border-card text-neutral hover:text-secondary'
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button 
                key={cat.id} 
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategoryId === cat.id
                    ? 'bg-primary text-white shadow-sm' 
                    : 'bg-bg-dark border border-border-card text-neutral hover:text-secondary'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <CatalogGrid 
          products={filteredProducts}
          isLoading={isLoadingProducts}
          selectedBranchId={selectedBranchId}
          branches={branches}
          onProductClick={handleProductCardClick}
        />
      </div>

      {/* Cart Summary Side panel */}
      <CartSummary 
        cart={cart}
        customers={customers}
        selectedCustomerId={selectedCustomerId}
        setSelectedCustomerId={setSelectedCustomerId}
        cartTotal={cartTotal}
        onUpdateQty={handleUpdateCartQty}
        onRemove={handleRemoveFromCart}
        onCheckout={handleCheckoutClick}
        isProcessing={isProcessing}
        activeSession={activeSession}
      />

      {/* Modal for completing payment */}
      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        totalAmount={cartTotal}
        onCompletePayment={handleCompletePayment}
        isProcessing={isProcessing}
      />



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
      <CashSessionModals 
        isAperturaOpen={isAperturaModalOpen}
        onCloseApertura={() => setIsAperturaModalOpen(false)}
        openingBalance={openingBalance}
        setOpeningBalance={setOpeningBalance}
        onOpenSession={handleOpenSession}
        isOpening={isOpening}

        isEgresoOpen={isEgresoModalOpen}
        onCloseEgreso={() => setIsEgresoModalOpen(false)}
        expenseDesc={expenseDesc}
        setExpenseDesc={setExpenseDesc}
        expenseAmount={expenseAmount}
        setExpenseAmount={setExpenseAmount}
        onAddExpense={handleAddExpense}
        isRegistering={isRegistering}

        isCierreOpen={isCierreModalOpen}
        onCloseCierre={() => setIsCierreModalOpen(false)}
        closingBalance={closingBalance}
        setClosingBalance={setClosingBalance}
        onCloseSession={handleCloseSession}
        isClosing={isClosing}

        isHistorialOpen={isHistorialModalOpen}
        onCloseHistorial={() => setIsHistorialModalOpen(false)}
        activeSessionSales={activeSessionSales}
        activeSessionExpenses={activeSessionExpenses}
      />

    </div>
  </div>
  );
};
export default POSView;
