import React, { useState, useMemo, useEffect } from 'react';
import { useRegisterPurchase } from '../hooks/usePurchases';
import { useBranches } from '../../branches/hooks/useBranches';
import { useProducts } from '../../products/hooks/useProducts';
import { ClipboardList, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { 
  Combobox, 
  ComboboxInput, 
  ComboboxContent, 
  ComboboxEmpty, 
  ComboboxList, 
  ComboboxItem 
} from '@/components/ui/combobox';

interface PurchaseItemInput {
  variantId: string;
  variantSku: string;
  productName: string;
  combinationText: string;
  quantity: number;
  unitCost: number;
}

interface PurchaseFormProps {
  selectedBranchId?: string;
  onSuccess: () => void;
}

export const PurchaseForm: React.FC<PurchaseFormProps> = ({ selectedBranchId, onSuccess }) => {
  const { branches } = useBranches();
  const { products = [] } = useProducts({ page: 1, limit: 100 });
  const { registerPurchase, isRegistering } = useRegisterPurchase();

  // Local Purchase Order general inputs
  const [purBranch, setPurBranch] = useState(selectedBranchId || '');
  const [purInvoice, setPurInvoice] = useState('');

  // Local single item inputs to add to the table
  const [selectedProductId, setSelectedProductId] = useState('');
  const [purQty, setPurQty] = useState('10');
  const [purCost, setPurCost] = useState('0.00');

  // Purchase items table state
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItemInput[]>([]);

  // Sync with parent selected branch ID
  useEffect(() => {
    if (selectedBranchId) {
      setPurBranch(selectedBranchId);
    }
  }, [selectedBranchId]);

  const handleProductSelect = (prodId: string | null) => {
    const idVal = prodId || '';
    setSelectedProductId(idVal);
    if (!idVal) {
      setPurCost('0.00');
      return;
    }
    const prod = products?.find((p: any) => p.id === idVal);
    if (prod) {
      const price = prod.variants?.[0]?.purchasePrice || 0;
      setPurCost(Number(price).toFixed(2));
    }
  };

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
  };  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const branch = purBranch || (branches[0] && branches[0].id);
    
    if (!branch) {
      toast.warning('Por favor selecciona una sucursal de destino.');
      return;
    }
    if (purchaseItems.length === 0) {
      toast.warning('Debes añadir al menos un artículo.');
      return;
    }

    try {
      await registerPurchase({
        branchId: branch,
        invoiceNumber: purInvoice.trim() || undefined,
        items: purchaseItems.map(i => ({
          variantId: i.variantId,
          quantity: i.quantity,
          purchasePrice: i.unitCost
        }))
      });

      toast.success('¡Ingreso registrado en Kardex y stock incrementado!');
      setPurInvoice('');
      setPurchaseItems([]);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar el ingreso.');
    }
  };

  const totalCostOfPurchase = useMemo(() => {
    return purchaseItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  }, [purchaseItems]);

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-sm animate-fade-in text-secondary">
      <div className="border-b border-border pb-3">
        <h4 className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
          <ClipboardList className="w-4 h-4 text-primary" />
          <span>Registrar Ingreso de Mercancía</span>
        </h4>
        <p className="text-[10px] text-muted-foreground mt-0.5">Ingresa mercancía al inventario para incrementar el stock disponible.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-bold mb-1">Sucursal Destino *</label>
            <select 
              value={purBranch}
              onChange={(e) => setPurBranch(e.target.value)}
              className="w-full bg-muted/30 border border-border rounded-xl py-2 px-3 text-xs text-foreground focus:outline-none"
            >
              <option value="">Seleccione sucursal</option>
              {branches.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-bold mb-1">Referencia / Factura (Opcional)</label>
            <input 
              type="text" 
              value={purInvoice}
              onChange={(e) => setPurInvoice(e.target.value)}
              placeholder="Ej. Guía, Proveedor, FAC-123" 
              className="w-full bg-muted/30 border border-border rounded-xl py-2 px-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none" 
            />
          </div>
        </div>

        {/* Add item interface */}
        <div className="border border-border rounded-xl p-4 bg-muted/20 space-y-3.5">
          <span className="text-[10px] font-bold text-primary block uppercase tracking-wider">Añadir Artículo al Ingreso</span>
          
          <div className="grid grid-cols-1 gap-3.5">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider block mb-1">Producto</label>
              <Combobox 
                value={selectedProductId} 
                onValueChange={handleProductSelect}
                items={products || []}
              >
                <ComboboxInput
                  placeholder="Buscar y seleccionar producto..."
                  className="text-xs h-9 w-full bg-bg-card border border-border-card rounded-xl px-3 py-2 text-xs text-secondary font-medium"
                />
                <ComboboxContent className="bg-popover border border-border rounded-xl shadow-2xl z-30 w-full max-h-60 overflow-y-auto">
                  <ComboboxEmpty className="p-3 text-center text-xs text-neutral">
                    No se encontraron productos.
                  </ComboboxEmpty>
                  <ComboboxList className="p-1">
                    {(p: any) => (
                      <ComboboxItem 
                        key={p.id} 
                        value={p.name}
                        className="px-3 py-2 hover:bg-accent hover:text-accent-foreground text-xs text-secondary rounded-lg transition-colors cursor-pointer"
                      >
                        {p.name} ({p.variants?.[0]?.sku || 'Sin SKU'})
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 items-end">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider block mb-1">Cantidad a Ingresar</label>
              <input 
                type="number" 
                value={purQty} 
                onChange={(e) => setPurQty(e.target.value)}
                className="w-full bg-card border border-border rounded-lg py-1.5 px-2.5 text-xs text-foreground focus:outline-none" 
              />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider block mb-1">Costo Unitario ($)</label>
              <input 
                type="number" 
                step="0.01"
                value={purCost} 
                onChange={(e) => setPurCost(e.target.value)}
                className="w-full bg-card border border-border rounded-lg py-1.5 px-2.5 text-xs text-foreground focus:outline-none" 
              />
            </div>
            <button 
              type="button" 
              onClick={handleAddItemToPurchase}
              className="col-span-2 md:col-span-1 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-[11px] font-bold rounded-lg transition-all"
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
            <div className="p-3 bg-muted/20 flex justify-between items-center text-xs font-bold">
              <span>Total de Ingreso:</span>
              <span className="text-sm text-primary font-mono">${totalCostOfPurchase.toFixed(2)}</span>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center text-xs text-muted-foreground">
            Agrega artículos arriba para comenzar a estructurar el ingreso de mercancía.
          </div>
        )}

        <button 
          type="submit" 
          disabled={isRegistering || purchaseItems.length === 0}
          className="w-full py-3 bg-primary hover:bg-primary/95 disabled:bg-muted disabled:text-muted-foreground text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5"
        >
          {isRegistering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          <span>Registrar Ingreso (Kardex)</span>
        </button>
      </form>
    </div>
  );
};
export default PurchaseForm;
