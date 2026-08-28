import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAdjustStock } from '../hooks/useProducts';
import type { Product } from '../services/products.service';
import { ArrowDownToLine, ArrowUpToLine, Loader2 } from 'lucide-react';

interface StockAdjustmentFormProps {
  product: Product;
  selectedBranchId: string;
}

export const StockAdjustmentForm: React.FC<StockAdjustmentFormProps> = ({ product, selectedBranchId }) => {
  const { adjustStock, isAdjusting } = useAdjustStock();
  const variantId = product.variants[0]?.id || '';
  const [type, setType] = useState<'IN' | 'OUT'>('IN');
  const [quantity, setQuantity] = useState('1');
  const [comment, setComment] = useState('');
  const variant = useMemo(() => product.variants.find((item) => item.id === variantId), [product.variants, variantId]);
  const stock = Number(variant?.stocks?.find((item) => item.branchId === selectedBranchId)?.quantity || 0);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsedQuantity = Number(quantity);
    if (!variantId || !selectedBranchId) return toast.warning('Selecciona una variante y sucursal válidas.');
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) return toast.warning('La cantidad debe ser un entero mayor a 0.');
    if (type === 'OUT' && parsedQuantity > stock) return toast.warning(`Stock insuficiente. Disponible: ${stock}`);

    try {
      await adjustStock({ branchId: selectedBranchId, variantId, quantity: parsedQuantity, type, comment: comment.trim() || undefined });
      toast.success('Ajuste de inventario registrado.');
      setQuantity('1');
      setComment('');
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo registrar el ajuste.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5">
      <div>
        <h3 className="text-sm font-bold text-foreground">Ajustar inventario</h3>
        <p className="mt-1 text-xs text-muted-foreground">Registra una entrada o salida manual para la sucursal seleccionada.</p>
      </div>
      <div className="rounded-xl border border-border bg-muted/30 p-4 text-xs">
        <strong className="block text-sm">{product.name}</strong>
        <span className="font-mono text-primary">{variant?.sku || 'Sin SKU'}</span>
        <span className="ml-3 text-muted-foreground">Stock actual: {stock}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => setType('IN')} className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-xs font-semibold ${type === 'IN' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600' : 'border-border text-muted-foreground'}`}><ArrowUpToLine className="h-4 w-4" />Entrada</button>
        <button type="button" onClick={() => setType('OUT')} className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-xs font-semibold ${type === 'OUT' ? 'border-rose-500 bg-rose-500/10 text-rose-600' : 'border-border text-muted-foreground'}`}><ArrowDownToLine className="h-4 w-4" />Salida</button>
      </div>
      <label className="block text-[11px] font-bold uppercase tracking-wider">Cantidad
        <input type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-xs" />
      </label>
      <label className="block text-[11px] font-bold uppercase tracking-wider">Comentario
        <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Motivo del ajuste (opcional)" className="mt-1 min-h-24 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-xs" />
      </label>
      <button type="submit" disabled={isAdjusting} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-xs font-semibold text-primary-foreground disabled:opacity-50">{isAdjusting && <Loader2 className="h-4 w-4 animate-spin" />}Registrar ajuste</button>
    </form>
  );
};

export default StockAdjustmentForm;
