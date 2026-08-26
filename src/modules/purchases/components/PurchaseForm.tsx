import React, { useState, useMemo, useEffect } from 'react';
import { useRegisterPurchase } from '../hooks/usePurchases';
import { useBranches } from '../../branches/hooks/useBranches';
import { useProducts } from '../../products/hooks/useProducts';
import type { Product } from '../../products/services/products.service';
import type { Branch } from '../../branches/services/branches.service';
import { ClipboardList, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableFooter
} from "@/components/ui/table";
import { PurchaseFormRow } from './PurchaseFormRow';

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

  // Purchase items table state, initialized with one empty row
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItemInput[]>([
    {
      variantId: '',
      variantSku: '',
      productName: '',
      combinationText: '',
      quantity: 1,
      unitCost: 0
    }
  ]);

  // Sync with parent selected branch ID
  useEffect(() => {
    if (selectedBranchId) {
      setPurBranch(selectedBranchId);
    }
  }, [selectedBranchId]);

  const updateRow = (index: number, fields: Partial<PurchaseItemInput>) => {
    const updated = [...purchaseItems];
    updated[index] = { ...updated[index], ...fields };
    setPurchaseItems(updated);
  };

  const handleRowProductSelect = (index: number, skuVal: string | null) => {
    if (!skuVal) {
      updateRow(index, {
        variantId: '',
        variantSku: '',
        productName: '',
        combinationText: '',
        unitCost: 0,
      });
      return;
    }

    const trimmed = skuVal.trim();
    // Search for the variant with this SKU or matching product name
    let foundProduct: Product | undefined;
    let foundVariant: any | undefined;

    for (const p of products) {
      const variant = p.variants?.find(
        v => v.sku.toLowerCase() === trimmed.toLowerCase() || p.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (variant) {
        foundProduct = p;
        foundVariant = variant;
        break;
      }
    }

    if (foundProduct && foundVariant) {
      updateRow(index, {
        variantId: foundVariant.id,
        variantSku: foundVariant.sku,
        productName: foundProduct.name,
        combinationText: 'Estándar',
        unitCost: Number(foundVariant.purchasePrice || 0),
      });
      // Move focus to quantity
      setTimeout(() => {
        const qtyInput = document.querySelector(`[data-row="${index}"][data-col="quantity"]`) as HTMLInputElement | null;
        qtyInput?.focus();
        qtyInput?.select();
      }, 50);
    } else {
      // Fallback/typing state
      updateRow(index, {
        variantSku: trimmed,
      });
    }
  };

  const handleAddRow = () => {
    setPurchaseItems([
      ...purchaseItems,
      {
        variantId: '',
        variantSku: '',
        productName: '',
        combinationText: '',
        quantity: 1,
        unitCost: 0,
      }
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (purchaseItems.length === 1) {
      // Reset the single row instead of deleting it
      setPurchaseItems([
        {
          variantId: '',
          variantSku: '',
          productName: '',
          combinationText: '',
          quantity: 1,
          unitCost: 0,
        }
      ]);
    } else {
      setPurchaseItems(purchaseItems.filter((_, idx) => idx !== index));
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>, 
    rowIndex: number, 
    field: 'sku' | 'quantity' | 'unitCost'
  ) => {
    if (field === 'sku') {
      const isComboboxOpen = e.currentTarget.getAttribute('aria-expanded') === 'true';
      if (isComboboxOpen) {
        // Let the combobox library handle list navigation and selection natively
        return;
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextInput = document.querySelector(`[data-row="${rowIndex + 1}"][data-col="${field}"]`) as HTMLInputElement | null;
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      } else if (rowIndex === purchaseItems.length - 1) {
        handleAddRow();
        setTimeout(() => {
          const newInput = document.querySelector(`[data-row="${rowIndex + 1}"][data-col="sku"]`) as HTMLInputElement | null;
          newInput?.focus();
        }, 50);
      }
    } else if (e.key === 'ArrowUp' && rowIndex > 0) {
      e.preventDefault();
      const prevInput = document.querySelector(`[data-row="${rowIndex - 1}"][data-col="${field}"]`) as HTMLInputElement | null;
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'sku') {
        handleRowProductSelect(rowIndex, purchaseItems[rowIndex].variantSku);
      } else if (field === 'quantity') {
        const costInput = document.querySelector(`[data-row="${rowIndex}"][data-col="unitCost"]`) as HTMLInputElement | null;
        costInput?.focus();
        costInput?.select();
      } else if (field === 'unitCost') {
        if (rowIndex === purchaseItems.length - 1) {
          handleAddRow();
          setTimeout(() => {
            const newInput = document.querySelector(`[data-row="${rowIndex + 1}"][data-col="sku"]`) as HTMLInputElement | null;
            newInput?.focus();
          }, 50);
        } else {
          const nextSkuInput = document.querySelector(`[data-row="${rowIndex + 1}"][data-col="sku"]`) as HTMLInputElement | null;
          nextSkuInput?.focus();
        }
      }
    }
  };

  const preventEnterSubmit = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT') {
        e.preventDefault();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const branch = purBranch || (branches[0] && branches[0].id);
    
    if (!branch) {
      toast.warning('Por favor selecciona una sucursal de destino.');
      return;
    }
    
    const validItems = purchaseItems.filter(i => i.variantId !== '');
    if (validItems.length === 0) {
      toast.warning('Debes añadir al menos un artículo válido (selecciona un producto de la lista).');
      return;
    }

    try {
      await registerPurchase({
        branchId: branch,
        invoiceNumber: purInvoice.trim() || undefined,
        items: validItems.map(i => ({
          variantId: i.variantId,
          quantity: i.quantity,
          purchasePrice: i.unitCost
        }))
      });

      toast.success('¡Ingreso registrado en Kardex y stock incrementado!');
      setPurInvoice('');
      setPurchaseItems([
        {
          variantId: '',
          variantSku: '',
          productName: '',
          combinationText: '',
          quantity: 1,
          unitCost: 0
        }
      ]);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar el ingreso.');
    }
  };

  const totalCostOfPurchase = useMemo(() => {
    return purchaseItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitCost || 0), 0);
  }, [purchaseItems]);

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-sm animate-fade-in text-secondary">
      <div className="border-b border-border pb-3">
        <h4 className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
          <ClipboardList className="w-4 h-4 text-primary" />
          <span>Registrar Ingreso de Mercancía</span>
        </h4>
        <p className="text-[10px] text-muted-foreground mt-0.5">Ingresa mercancía al inventario indicando el SKU del producto. El sistema te mostrará sugerencias a medida que escribes.</p>
      </div>
      
      <form onSubmit={handleSubmit} onKeyDown={preventEnterSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-bold mb-1">Sucursal Destino *</label>
            <select 
              value={purBranch}
              onChange={(e) => setPurBranch(e.target.value)}
              className="w-full bg-muted/30 border border-border rounded-xl py-2 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Seleccione sucursal</option>
              {branches.map((b: Branch) => (
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
              className="w-full bg-muted/30 border border-border rounded-xl py-2 px-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" 
            />
          </div>
        </div>

        {/* Tabular Input Area */}
        <div className="border border-border rounded-xl overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-1/4">SKU / Código</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-1/3">Nombre del Producto</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right w-24">Cant.</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right w-28">Costo U.</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right w-28">Subtotal</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center w-12">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseItems.map((item, index) => (
                <PurchaseFormRow
                  key={index}
                  index={index}
                  item={item}
                  products={products}
                  onUpdateRow={updateRow}
                  onRemoveRow={handleRemoveRow}
                  onProductSelect={handleRowProductSelect}
                  onKeyDown={handleKeyDown}
                />
              ))}
            </TableBody>
            <TableFooter className="bg-muted/20 border-t border-border">
              <TableRow>
                <TableCell colSpan={4} className="text-right text-xs font-bold text-muted-foreground">Total de Ingreso:</TableCell>
                <TableCell className="text-right text-sm font-extrabold text-primary font-mono">${totalCostOfPurchase.toFixed(2)}</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </div>

        {/* Add row manually button */}
        <div className="flex justify-start">
          <button
            type="button"
            onClick={handleAddRow}
            className="flex items-center gap-1 px-3 py-1.5 border border-dashed border-border hover:border-primary/50 text-xs font-semibold rounded-lg text-muted-foreground hover:text-primary transition-all bg-card/50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar Fila</span>
          </button>
        </div>

        <button 
          type="submit" 
          disabled={isRegistering || purchaseItems.every(i => i.variantId === '')}
          className="w-full py-3 bg-primary hover:bg-primary/95 disabled:bg-muted disabled:text-muted-foreground text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {isRegistering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          <span>Registrar Ingreso (Kardex)</span>
        </button>
      </form>
    </div>
  );
};
export default PurchaseForm;
