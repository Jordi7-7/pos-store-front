import React, { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { useBranches } from '../../branches/hooks/useBranches';
import type { Branch } from '../../branches/services/branches.service';
import type { Product } from '../services/products.service';
import { toast } from 'sonner';
import { Loader2, Plus, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
  ComboboxItem,
} from '@/components/ui/combobox';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  products,
}) => {
  const { branches = [] } = useBranches();
  const queryClient = useQueryClient();

  // Form State
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedSku, setSelectedSku] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [type, setType] = useState<'IN' | 'OUT'>('OUT');
  const [quantity, setQuantity] = useState('1');
  const [comment, setComment] = useState('');

  // Default to first branch if available
  useEffect(() => {
    if (branches.length > 0 && !selectedBranchId) {
      setSelectedBranchId(branches[0].id);
    }
  }, [branches, selectedBranchId]);

  // Handle product variant selection
  const handleProductSelect = (skuVal: string | null) => {
    if (!skuVal) {
      setSelectedSku('');
      setSelectedProduct(null);
      setSelectedVariant(null);
      return;
    }

    const trimmed = skuVal.trim();
    let foundProduct: Product | null = null;
    let foundVariant: any = null;

    for (const p of products) {
      const variant = p.variants?.find(
        (v: any) => v.sku.toLowerCase() === trimmed.toLowerCase() || p.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (variant) {
        foundProduct = p;
        foundVariant = variant;
        break;
      }
    }

    if (foundProduct && foundVariant) {
      setSelectedSku(foundVariant.sku);
      setSelectedProduct(foundProduct);
      setSelectedVariant(foundVariant);
    } else {
      setSelectedSku(trimmed);
    }
  };

  // Get current stock for selected variant & branch
  const currentStock = useMemo(() => {
    if (!selectedVariant || !selectedBranchId) return 0;
    const stockObj = selectedVariant.stocks?.find((s: any) => s.branchId === selectedBranchId);
    return stockObj ? Number(stockObj.quantity) : 0;
  }, [selectedVariant, selectedBranchId]);

  // Mutation to call endpoint
  const adjustMutation = useMutation({
    mutationFn: async (data: {
      branchId: string;
      variantId: string;
      quantity: number;
      type: 'IN' | 'OUT';
      comment?: string;
    }) => {
      return apiClient.post('/products/stock-adjustments', data);
    },
    onSuccess: () => {
      toast.success('¡Ajuste de inventario registrado con éxito!');
      // Invalidate cache
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['variant-movements'] });
      
      // Reset & Close
      setSelectedSku('');
      setSelectedProduct(null);
      setSelectedVariant(null);
      setQuantity('1');
      setComment('');
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al procesar el ajuste de inventario.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId) {
      toast.warning('Por favor selecciona una sucursal.');
      return;
    }
    if (!selectedVariant) {
      toast.warning('Por favor selecciona un producto válido (SKU existente).');
      return;
    }
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.warning('La cantidad debe ser mayor a 0.');
      return;
    }
    if (type === 'OUT' && currentStock < qty) {
      toast.warning(`Stock insuficiente en sucursal. Stock disponible: ${currentStock}`);
      return;
    }

    adjustMutation.mutate({
      branchId: selectedBranchId,
      variantId: selectedVariant.id,
      quantity: qty,
      type,
      comment: comment.trim() || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md bg-card border border-border rounded-2xl shadow-xl p-6 text-foreground">
        <DialogHeader className="border-b border-border pb-3">
          <DialogTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            <span>Registrar Ajuste / Merma</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-3">
          {/* Sucursal */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-bold mb-1">Sucursal destino / origen</label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full bg-muted/40 border border-border rounded-xl py-2 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Seleccione sucursal</option>
              {branches.map((b: Branch) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Producto SKU */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-bold mb-1">Buscar Producto (SKU o Nombre)</label>
            <Combobox
              value={selectedSku}
              onValueChange={handleProductSelect}
              items={products}
            >
              <ComboboxInput
                placeholder="Escriba SKU o nombre..."
                className="text-xs h-9 w-full bg-card border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
              <ComboboxContent className="bg-popover border border-border rounded-xl shadow-2xl z-50 w-full max-h-48 overflow-y-auto">
                <ComboboxEmpty className="p-3 text-center text-xs text-muted-foreground">
                  No se encontraron productos.
                </ComboboxEmpty>
                <ComboboxList className="p-1">
                  {(p: Product) => {
                    const sku = p.variants?.[0]?.sku || '';
                    return (
                      <ComboboxItem
                        key={p.id}
                        value={sku || p.name}
                        className="px-3 py-1.5 hover:bg-accent hover:text-accent-foreground text-xs text-secondary rounded-lg transition-colors cursor-pointer flex justify-between gap-2"
                      >
                        <span className="font-mono text-primary font-bold text-[10px]">{sku || 'S/SKU'}</span>
                        <span className="truncate max-w-[180px]">{p.name}</span>
                      </ComboboxItem>
                    );
                  }}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>

          {/* Product Preview Info Card */}
          {selectedProduct && selectedVariant && (
            <div className="bg-muted/30 border border-border rounded-xl p-3 flex gap-3 text-xs">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Articulo</span>
                  <span className="font-bold">{selectedProduct.name}</span>
                </div>
                <div className="flex gap-4">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">SKU</span>
                    <span className="font-mono font-semibold text-primary">{selectedVariant.sku}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Stock Disponible</span>
                    <span className={`font-mono font-bold ${currentStock <= 0 ? 'text-destructive' : 'text-emerald-500'}`}>
                      {currentStock} pzs
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tipo de Ajuste */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-bold mb-1">Tipo de Ajuste</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full bg-muted/40 border border-border rounded-xl py-2 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="OUT">Salida (Egreso/Merma)</option>
              <option value="IN">Entrada (Ingreso manual)</option>
            </select>
          </div>

          {/* Cantidad */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-bold mb-1">Cantidad a Ajustar</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-muted/40 border border-border rounded-xl py-2 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Comentarios */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-bold mb-1">Nota / Explicación (Opcional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ej: Playera rota por transporte, inventario anual..."
              rows={2}
              className="w-full bg-muted/40 border border-border rounded-xl py-2 px-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={adjustMutation.isPending}
            className="w-full py-2.5 bg-primary hover:bg-primary/95 text-white disabled:bg-muted disabled:text-muted-foreground text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
          >
            {adjustMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>Aplicar Ajuste de Stock</span>
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
export default StockAdjustmentModal;
