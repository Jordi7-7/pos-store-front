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
import { Search, MoreVertical, Wallet, ArrowRightLeft, Receipt, X } from 'lucide-react';
import { toast } from 'sonner';

// Subcomponents import
import { CatalogGrid } from './pos/CatalogGrid';
import { CartSummary } from './pos/CartSummary';
import { VariantSelectorModal } from './pos/VariantSelectorModal';
import { ThermalTicketModal } from './pos/ThermalTicketModal';
import { CashSessionModals } from './pos/CashSessionModals';

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.EFECTIVO);

  // Ticket Printing State
  const [lastCompletedSale, setLastCompletedSale] = useState<any | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  // Variant selector states
  const [selectedProductForModal, setSelectedProductForModal] = useState<any | null>(null);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);

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
    const isSimpleProduct = variants.length === 1 && (!variants[0].attributeValues || variants[0].attributeValues.length === 0);

    if (isSimpleProduct) {
      const v = variants[0];
      const stockQty = v.stocks?.find((s: any) => s.branchId === branch)?.quantity || 0;
      if (stockQty <= 0) {
        toast.warning(`El producto "${product.name}" no tiene existencias en esta sucursal.`);
        return;
      }
      addVariantToCart(product, v, stockQty);
    } else {
      setSelectedProductForModal(product);
      setIsVariantModalOpen(true);
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

  const handleCheckout = async () => {
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
        payments: [{
          paymentMethod: paymentMethod,
          amount: totalAmount
        }]
      });

      const clientName = customers.find((c: any) => c.id === selectedCustomerId)?.name || 'Consumidor Final';
      const clientIdentity = customers.find((c: any) => c.id === selectedCustomerId)?.identityNumber || '9999999999';

      const saleDataForTicket = {
        invoiceNumber: res.invoiceNumber || `FAC-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString(),
        branchName,
        clientName,
        clientIdentity,
        items: cart,
        paymentMethod,
        total: totalAmount
      };

      setLastCompletedSale(saleDataForTicket);
      setCart([]);
      setSelectedCustomerId('');
      setPaymentMethod(PaymentMethod.EFECTIVO);
      refetchProducts(); // refrescar stock

      setIsTicketModalOpen(true);
      toast.success('¡Venta procesada con éxito y cargada en Kardex!');
    } catch (err: any) {
      toast.error(err.message || 'Error al procesar la venta.');
    }
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  return (
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
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        cartTotal={cartTotal}
        onUpdateQty={handleUpdateCartQty}
        onRemove={handleRemoveFromCart}
        onCheckout={handleCheckout}
        isProcessing={isProcessing}
        activeSession={activeSession}
      />

      {/* Modal for selecting variants */}
      <VariantSelectorModal 
        isOpen={isVariantModalOpen}
        onClose={() => {
          setIsVariantModalOpen(false);
          setSelectedProductForModal(null);
        }}
        product={selectedProductForModal}
        selectedBranchId={selectedBranchId}
        branches={branches}
        onSelectVariant={addVariantToCart}
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
      />

    </div>
  );
};
export default POSView;
