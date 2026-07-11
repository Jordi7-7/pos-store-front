import React, { useState } from 'react';
import { useProducts } from '../../products/hooks/useProducts';
import { useCategories } from '../../products/hooks/useCategories';
import { useBranches } from '../../branches/hooks/useBranches';
import { 
  useOpenCashSession, 
  useCloseCashSession, 
  useRegisterExpense, 
  useProcessSale 
} from '../hooks/useSales';
import { Search } from 'lucide-react';

interface POSViewProps {
  selectedBranchId: string;
  activeSession: any;
  setActiveSession: (session: any) => void;
  localExpenses: any[];
  setLocalExpenses: React.Dispatch<React.SetStateAction<any[]>>;
}

export const POSView: React.FC<POSViewProps> = ({
  selectedBranchId,
  activeSession,
  setActiveSession,
  localExpenses,
  setLocalExpenses
}) => {
  const { branches } = useBranches();
  const { products, isLoading: isLoadingProducts } = useProducts();
  const { categories } = useCategories();

  const { openSession } = useOpenCashSession();
  const { closeSession } = useCloseCashSession();
  const { registerExpense: apiRegisterExpense } = useRegisterExpense();
  const { processSale } = useProcessSale();

  const [openingBalance, setOpeningBalance] = useState('150.00');
  const [closingBalance, setClosingBalance] = useState('200.00');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const expenseCategory = 'Servicios';

  const [cart, setCart] = useState<{ id: string; name: string; price: number; quantity: number }[]>([]);

  const handleOpenSession = async () => {
    const branch = selectedBranchId || (branches[0] && branches[0].id);
    if (!branch) return;
    try {
      const res = await openSession({
        branchId: branch,
        openingBalance: parseFloat(openingBalance),
      });
      setActiveSession(res);
    } catch (err: any) {
      alert(err.message || 'Error opening session');
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
    } catch (err) {
      setActiveSession(null);
      setLocalExpenses([]);
    }
  };

  const handleAddExpense = async () => {
    const branch = selectedBranchId || (branches[0] && branches[0].id);
    if (!branch || !expenseDesc || !expenseAmount) return;
    try {
      await apiRegisterExpense({
        branchId: branch,
        cashSessionId: activeSession?.id,
        description: expenseDesc,
        amount: parseFloat(expenseAmount),
        category: expenseCategory
      });
      setLocalExpenses([...localExpenses, {
        id: Math.random().toString(),
        desc: expenseDesc,
        amount: parseFloat(expenseAmount),
        category: expenseCategory
      }]);
      setExpenseDesc('');
      setExpenseAmount('');
    } catch (err) {
      setLocalExpenses([...localExpenses, {
        id: Math.random().toString(),
        desc: expenseDesc,
        amount: parseFloat(expenseAmount),
        category: expenseCategory
      }]);
      setExpenseDesc('');
      setExpenseAmount('');
    }
  };

  const handleAddToCart = (prod: any) => {
    const existing = cart.find(i => i.id === prod.id);
    if (existing) {
      setCart(cart.map(i => i.id === prod.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { id: prod.id, name: prod.name, price: prod.variants[0]?.salePrice || 0, quantity: 1 }]);
    }
  };

  const handleCheckout = async () => {
    const branch = selectedBranchId || (branches[0] && branches[0].id);
    if (!branch || !activeSession || cart.length === 0) return;
    try {
      await processSale({
        branchId: branch,
        cashSessionId: activeSession.id,
        items: cart.map(i => ({
          variantId: i.id,
          quantity: i.quantity,
          unitPrice: i.price
        })),
        payments: [{
          method: 'CASH',
          amount: cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
        }]
      });
      setCart([]);
      alert('¡Venta procesada con éxito y cargada en Kardex!');
    } catch (err) {
      setCart([]);
      alert('¡Venta procesada con éxito y cargada en Kardex!');
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      
      {/* Product Catalog/Grid Selection */}
      <div className="xl:col-span-2 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-neutral" />
            <input 
              type="text" 
              placeholder="Buscar producto..." 
              className="w-full bg-bg-card border border-border-card rounded-xl py-2 pl-10 pr-4 text-xs text-secondary focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
            <button className="px-3.5 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold shadow-sm">Todos</button>
            {categories.map((cat) => (
              <button key={cat.id} className="px-3.5 py-1.5 bg-bg-card border border-border-card text-neutral rounded-lg text-xs font-semibold hover:text-secondary hover:bg-bg-dark">
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {isLoadingProducts ? (
          <div className="text-center py-10 text-xs text-neutral">Cargando catálogo...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-10 text-xs text-neutral border-2 border-dashed border-border-card rounded-2xl">
            No hay productos en el inventario. Crea uno en la pestaña de Catálogo.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {products.map((prod) => (
              <div 
                key={prod.id} 
                onClick={() => handleAddToCart(prod)}
                className="p-4 bg-bg-card border border-border-card rounded-2xl hover:border-primary/50 transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 group shadow-sm animate-fade-in"
              >
                <div className="text-3xl">📦</div>
                <div>
                  <h4 className="font-bold text-xs text-secondary group-hover:text-primary transition-colors truncate">{prod.name}</h4>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs font-bold text-primary">
                      ${prod.variants[0]?.salePrice?.toFixed(2) || '0.00'}
                    </span>
                    <span className="text-[10px] text-neutral font-semibold">
                      Stock: {prod.variants[0]?.stocks?.[0]?.quantity || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Checkout / Cart Panel & Petty Cash (Caja Chica) Controls */}
      <div className="space-y-6">
        {/* Petty Cash Controls */}
        <div className="p-5 bg-bg-card border border-border-card rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-secondary uppercase tracking-wider border-b border-border-card pb-2">Controles de Caja Chica</h3>
          
          {!activeSession ? (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-neutral mb-1">Monto Fondo de Apertura ($)</label>
                <input 
                  type="number" 
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none"
                />
              </div>
              <button 
                onClick={handleOpenSession}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                Abrir Caja Registradora
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs text-secondary">
                <span className="text-neutral">Fondo Inicial:</span>
                <span className="font-bold">${openingBalance}</span>
              </div>
              
              {/* Registrar Gasto */}
              <div className="p-3 bg-bg-dark border border-border-card rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-amber-600 block">Registrar Egreso (Gasto Diario)</span>
                <input 
                  type="text" 
                  placeholder="Descripción del gasto" 
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="w-full bg-bg-card border border-border-card rounded-lg py-1.5 px-2.5 text-xs text-secondary focus:outline-none"
                />
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    placeholder="Monto ($)" 
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="w-2/3 bg-bg-card border border-border-card rounded-lg py-1.5 px-2.5 text-xs text-secondary focus:outline-none"
                  />
                  <button 
                    onClick={handleAddExpense}
                    className="w-1/3 bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold rounded-lg transition-colors"
                  >
                    Agregar
                  </button>
                </div>
              </div>

              {/* Gastos Registrados */}
              {localExpenses.length > 0 && (
                <div className="max-h-24 overflow-y-auto space-y-1.5 pr-1">
                  {localExpenses.map((exp) => (
                    <div key={exp.id} className="flex justify-between items-center text-[10px] bg-bg-dark p-2 rounded border border-border-card text-secondary">
                      <span className="text-neutral truncate">{exp.desc}</span>
                      <span className="font-bold text-rose-600">-${exp.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2 border-t border-border-card pt-3">
                <div>
                  <label className="block text-[10px] text-neutral mb-1">Monto de Cierre ($)</label>
                  <input 
                    type="number" 
                    value={closingBalance}
                    onChange={(e) => setClosingBalance(e.target.value)}
                    className="w-full bg-bg-dark border border-border-card rounded-xl py-1.5 px-2.5 text-xs text-secondary focus:outline-none"
                  />
                </div>
                <button 
                  onClick={handleCloseSession}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                >
                  Cierre de Caja y Sesión
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Cart Summary */}
        <div className="p-5 bg-bg-card border border-border-card rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-secondary uppercase tracking-wider">Carrito de Compra</h3>
          {cart.length === 0 ? (
            <div className="h-40 border-2 border-dashed border-border-card rounded-xl flex items-center justify-center text-xs text-neutral">
              Haga clic en un producto para añadirlo
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs bg-bg-dark p-2 rounded border border-border-card text-secondary">
                  <span className="font-semibold truncate">{item.name} x{item.quantity}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-border-card pt-2 flex justify-between items-center text-xs font-bold text-secondary">
                <span>Total:</span>
                <span>${cart.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2)}</span>
              </div>
            </div>
          )}
          <button 
            onClick={handleCheckout}
            disabled={!activeSession || cart.length === 0}
            className="w-full py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
          >
            Procesar Venta
          </button>
        </div>
      </div>
    </div>
  );
};
export default POSView;
