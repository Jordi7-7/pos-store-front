import React, { useState, useMemo } from 'react';
import { useSuppliers, useRegisterPurchase } from '../hooks/usePurchases';
import { useBranches } from '../../branches/hooks/useBranches';
import { useProducts } from '../../products/hooks/useProducts';
import { ClipboardList, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PurchaseItemInput {
  variantId: string;
  variantSku: string;
  productName: string;
  combinationText: string;
  quantity: number;
  unitCost: number;
}

interface PurchaseFormProps {
  onSuccess: () => void;
}

export const PurchaseForm: React.FC<PurchaseFormProps> = ({ onSuccess }) => {
  const { branches } = useBranches();
  const { products } = useProducts({ page: 1, limit: 100 });
  const { suppliers } = useSuppliers();
  const { registerPurchase, isRegistering } = useRegisterPurchase();

  // Local Purchase Order general inputs
  const [purSupplier, setPurSupplier] = useState('');
  const [purBranch, setPurBranch] = useState('');
  const [purInvoice, setPurInvoice] = useState('');

  // Local single item inputs to add to the table
  const [selectedProductId, setSelectedProductId] = useState('');
  const [purQty, setPurQty] = useState('10');
  const [purCost, setPurCost] = useState('10.00');

  // Purchase items table state
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItemInput[]>([]);

  const handleAddItemToPurchase = () => {
    if (!selectedProductId) {
      toast.warning('Selecciona un producto primero.');
      return;
    }

    const qty = parseInt(purQty);
    const cost = parseFloat(purCost);

    if (isNaN(qty) || qty <= 0) {
      toast.warning('La cantidad debe ser mayor a 0.');
      return;
    }
    if (isNaN(cost) || cost < 0) {
      toast.warning('El costo unitario no puede ser negativo.');
      return;
    }

    const prod = products?.find((p: any) => p.id === selectedProductId);
    if (!prod) {
      toast.warning('Producto no encontrado.');
      return;
    }
    const variant = prod.variants?.[0];
    if (!variant) {
      toast.warning('Este producto no tiene variantes registradas.');
      return;
    }

    const variantId = variant.id || '';

    // Check if variant already added to aggregate quantity
    const existingIndex = purchaseItems.findIndex(i => i.variantId === variantId);

    if (existingIndex > -1) {
      const updated = [...purchaseItems];
      updated[existingIndex].quantity += qty;
      updated[existingIndex].unitCost = cost; // update to latest cost
      setPurchaseItems(updated);
    } else {
      setPurchaseItems([...purchaseItems, {
        variantId,
        variantSku: variant.sku,
        productName: prod.name,
        combinationText: 'Estándar',
        quantity: qty,
        unitCost: cost
      }]);
    }

    toast.success(`Añadido: ${prod.name} (${variant.sku}) x ${qty}`);
  };


  const handleRemoveItem = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sup = purSupplier || (suppliers[0] && suppliers[0].id);
    const branch = purBranch || (branches[0] && branches[0].id);
    
    if (!sup) {
      toast.warning('Por favor selecciona un proveedor.');
      return;
    }
    if (!branch) {
      toast.warning('Por favor selecciona una sucursal de destino.');
      return;
    }
    if (!purInvoice.trim()) {
      toast.warning('Por favor introduce el número de factura de compra.');
      return;
    }
    if (purchaseItems.length === 0) {
      toast.warning('Debes añadir al menos un artículo a la compra.');
      return;
    }

    try {
      await registerPurchase({
        supplierId: sup,
        branchId: branch,
        invoiceNumber: purInvoice.trim(),
        items: purchaseItems.map(i => ({
          variantId: i.variantId,
          quantity: i.quantity,
          purchasePrice: i.unitCost
        }))
      });

      toast.success('¡Compra registrada en Kardex y stock incrementado!');
      setPurInvoice('');
      setPurchaseItems([]);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar la compra.');
    }
  };

  const totalCostOfPurchase = useMemo(() => {
    return purchaseItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  }, [purchaseItems]);

  return (
    <div className="bg-bg-card border border-border-card rounded-2xl p-6 space-y-5 shadow-sm animate-fade-in">
      <div className="border-b border-border-card pb-3">
        <h4 className="text-xs font-bold text-secondary uppercase tracking-wide flex items-center gap-1.5">
          <ClipboardList className="w-4 h-4 text-primary" />
          <span>Registrar Factura de Compra (Abastecimiento)</span>
        </h4>
        <p className="text-[10px] text-neutral mt-0.5">Ingresa mercadería al inventario. Afectará positivamente el Kardex de existencias.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] text-neutral uppercase tracking-wider font-bold mb-1">Proveedor *</label>
            <select 
              value={purSupplier}
              onChange={(e) => setPurSupplier(e.target.value)}
              className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none"
            >
              <option value="">Seleccione proveedor</option>
              {suppliers.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-neutral uppercase tracking-wider font-bold mb-1">Destino *</label>
            <select 
              value={purBranch}
              onChange={(e) => setPurBranch(e.target.value)}
              className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none"
            >
              <option value="">Seleccione sucursal</option>
              {branches.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-neutral uppercase tracking-wider font-bold mb-1">Número de Factura *</label>
            <input 
              type="text" 
              required
              value={purInvoice}
              onChange={(e) => setPurInvoice(e.target.value)}
              placeholder="FAC-001-002-12345" 
              className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3.5 text-xs text-secondary placeholder-neutral focus:outline-none" 
            />
          </div>
        </div>

        {/* Add item interface */}
        <div className="border border-border-card rounded-xl p-4 bg-bg-dark space-y-3.5">
          <span className="text-[10px] font-bold text-primary block uppercase tracking-wider">Añadir Artículo al Abastecimiento</span>
          
          <div className="grid grid-cols-1 gap-3.5">
            <div>
              <label className="text-[9px] text-neutral font-bold uppercase tracking-wider block mb-1">Producto</label>
              <select 
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-bg-card border border-border-card rounded-lg py-1.5 px-2.5 text-xs text-secondary focus:outline-none"
              >
                <option value="">Selecciona un producto</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.variants?.[0]?.sku || 'Sin SKU'})</option>
                ))}
              </select>
            </div>
          </div>


          <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 items-end">
            <div>
              <label className="text-[9px] text-neutral font-bold uppercase tracking-wider block mb-1">Cantidad a Comprar</label>
              <input 
                type="number" 
                value={purQty} 
                onChange={(e) => setPurQty(e.target.value)}
                className="w-full bg-bg-card border border-border-card rounded-lg py-1.5 px-2.5 text-xs text-secondary focus:outline-none" 
              />
            </div>
            <div>
              <label className="text-[9px] text-neutral font-bold uppercase tracking-wider block mb-1">Costo Unitario ($)</label>
              <input 
                type="number" 
                step="0.01"
                value={purCost} 
                onChange={(e) => setPurCost(e.target.value)}
                className="w-full bg-bg-card border border-border-card rounded-lg py-1.5 px-2.5 text-xs text-secondary focus:outline-none" 
              />
            </div>
            <button 
              type="button" 
              onClick={handleAddItemToPurchase}
              className="col-span-2 md:col-span-1 py-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary hover:text-primary-hover text-[11px] font-bold rounded-lg transition-all"
            >
              Agregar Fila
            </button>
          </div>
        </div>

        {/* Items Table Grid */}
        {purchaseItems.length > 0 ? (
          <div className="border border-border-card rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs text-secondary border-collapse">
              <thead>
                <tr className="bg-bg-dark border-b border-border-card text-[9px] font-bold uppercase tracking-wider text-neutral">
                  <th className="p-3">Artículo</th>
                  <th className="p-3 text-center">Cant.</th>
                  <th className="p-3 text-right">Costo U.</th>
                  <th className="p-3 text-right">Subtotal</th>
                  <th className="p-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {purchaseItems.map((item, index) => (
                  <tr key={item.variantId} className="border-b border-border-card/60 bg-bg-card/30">
                    <td className="p-3">
                      <span className="font-bold block">{item.productName}</span>
                      <span className="text-[10px] text-neutral font-mono">{item.variantSku} - {item.combinationText}</span>
                    </td>
                    <td className="p-3 text-center font-bold">{item.quantity}</td>
                    <td className="p-3 text-right font-mono">${item.unitCost.toFixed(2)}</td>
                    <td className="p-3 text-right font-bold text-primary font-mono">${(item.quantity * item.unitCost).toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-neutral hover:text-rose-500 p-1 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-3 bg-bg-dark/40 flex justify-between items-center text-xs font-bold text-secondary">
              <span>Total de Compra:</span>
              <span className="text-sm text-primary font-mono">${totalCostOfPurchase.toFixed(2)}</span>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-border-card rounded-xl p-6 text-center text-xs text-neutral">
            Agrega artículos arriba para comenzar a estructurar la orden de compra.
          </div>
        )}

        <button 
          type="submit" 
          disabled={isRegistering || purchaseItems.length === 0}
          className="w-full py-3 bg-primary hover:bg-primary-hover disabled:bg-neutral/20 disabled:text-neutral/60 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5"
        >
          {isRegistering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          <span>Cargar Abastecimiento (Kardex)</span>
        </button>
      </form>
    </div>
  );
};
export default PurchaseForm;
