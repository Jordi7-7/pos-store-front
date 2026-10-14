import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAdjustStock } from '../hooks/useProducts';
import type { Product } from '../services/products.service';
import { AlertCircle, ArrowDownToLine, ArrowUpToLine, Loader2 } from 'lucide-react';
import { ProductType, InventoryMovementType } from '../services/products.service';

interface StockAdjustmentFormProps {
  product: Product;
  selectedBranchId: string;
  selectedVariantId?: string;
}

export const StockAdjustmentForm: React.FC<StockAdjustmentFormProps> = ({
  product,
  selectedBranchId,
  selectedVariantId,
}) => {
  const { adjustStock, isAdjusting } = useAdjustStock();
  const isAllBranches = !selectedBranchId;
  const isSimple = product.type === ProductType.SIMPLE;

  // Si es simple toma por defecto la única variante; si es compuesto toma la variante seleccionada (o la primera como fallback)
  const variantId = isSimple
    ? product.variants[0]?.id || ''
    : selectedVariantId || '';

  const [type, setType] = useState<InventoryMovementType>(InventoryMovementType.IN);
  const [quantity, setQuantity] = useState('1');
  const [comment, setComment] = useState('');
  const variant = useMemo(() => product.variants.find((item) => item.id === variantId), [product.variants, variantId]);
  const stock = Number(variant?.stocks?.find((item) => item.branchId === selectedBranchId)?.quantity || 0);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isAllBranches) {
      return toast.warning('Selecciona una sucursal específica en la barra superior para ajustar el inventario.');
    }
    const parsedQuantity = Number(quantity);
    if (!variantId || !selectedBranchId) return toast.warning('Selecciona una variante y sucursal válidas.');
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) return toast.warning('La cantidad debe ser un entero mayor a 0.');
    if (type === InventoryMovementType.OUT && parsedQuantity > stock) return toast.warning(`Stock insuficiente. Disponible: ${stock}`);

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

      {isAllBranches && (
        <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <span>
            Estás en <strong>Todas las Sucursales</strong>. Para realizar un ajuste de inventario (entrada o salida), debes seleccionar una sucursal específica en la barra superior.
          </span>
        </div>
      )}

      <div className="rounded-xl border border-border bg-muted/30 p-4 text-xs">
        <strong className="block text-sm">{product.name}</strong>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span className="font-mono font-bold text-primary">{variant?.sku || 'Sin SKU'}</span>
          {!isSimple && variant?.attributeValues && variant.attributeValues.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {variant.attributeValues.map((av: any, idx: number) => (
                <span
                  key={av.id || idx}
                  className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-primary/10 text-primary border border-primary/20"
                >
                  {av.value || av.attributeValueId}
                </span>
              ))}
            </div>
          )}
          <span className="text-muted-foreground ml-auto font-mono">
            {isAllBranches ? 'Stock: Selecciona una sucursal' : `Stock actual: ${stock} pzs`}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={isAllBranches}
          onClick={() => setType(InventoryMovementType.IN)}
          className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-xs font-semibold transition-opacity disabled:opacity-50 ${
            type === InventoryMovementType.IN ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600' : 'border-border text-muted-foreground'
          }`}
        >
          <ArrowUpToLine className="h-4 w-4" />
          Entrada
        </button>
        <button
          type="button"
          disabled={isAllBranches}
          onClick={() => setType(InventoryMovementType.OUT)}
          className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-xs font-semibold transition-opacity disabled:opacity-50 ${
            type === InventoryMovementType.OUT ? 'border-rose-500 bg-rose-500/10 text-rose-600' : 'border-border text-muted-foreground'
          }`}
        >
          <ArrowDownToLine className="h-4 w-4" />
          Salida
        </button>
      </div>

      <label className="block text-[11px] font-bold uppercase tracking-wider">
        Cantidad
        <input
          type="number"
          min="1"
          step="1"
          disabled={isAllBranches}
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          className="mt-1 h-10 w-full rounded-lg border border-input bg-background px-3 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </label>

      <label className="block text-[11px] font-bold uppercase tracking-wider">
        Comentario
        <textarea
          disabled={isAllBranches}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Motivo del ajuste (opcional)"
          className="mt-1 min-h-24 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </label>

      <button
        type="submit"
        disabled={isAdjusting || isAllBranches}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-xs font-semibold text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isAdjusting && <Loader2 className="h-4 w-4 animate-spin" />}
        {isAllBranches ? 'Selecciona una sucursal específica para ajustar' : 'Registrar ajuste'}
      </button>
    </form>
  );
};

export default StockAdjustmentForm;
