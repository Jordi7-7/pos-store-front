import React from 'react';
import { X, Package } from 'lucide-react';
import { toast } from 'sonner';

interface VariantSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  selectedBranchId: string;
  branches: any[];
  onSelectVariant: (product: any, variant: any, maxStock: number) => void;
}

export const VariantSelectorModal: React.FC<VariantSelectorModalProps> = ({
  isOpen,
  onClose,
  product,
  selectedBranchId,
  branches,
  onSelectVariant
}) => {
  if (!isOpen || !product) return null;

  const currentBranch = selectedBranchId || (branches[0] && branches[0].id);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-bg-card border border-border-card rounded-2xl p-6 w-full max-w-lg shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral hover:text-secondary bg-bg-dark/40 hover:bg-bg-dark border border-border-card/60 rounded-xl transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="border-b border-border-card pb-3 mb-4">
          <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
            <span>Seleccionar Variante</span>
            <span className="text-[10px] bg-primary/20 text-primary font-bold px-2 py-0.5 rounded-lg border border-primary/20 tracking-normal normal-case">
              {product.name}
            </span>
          </h3>
        </div>

        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {(product.variants || []).map((v: any) => {
            const stockQty = v.stocks?.find((s: any) => s.branchId === currentBranch)?.quantity || 0;
            
            const combText = v.attributeValues && v.attributeValues.length > 0
              ? v.attributeValues.map((av: any) => `${av.attribute?.name || 'Attr'}: ${av.value}`).join(' / ')
              : 'Estándar';

            const varImageUrl = (v.images && v.images.length > 0)
              ? v.images[0].url
              : (product.images && product.images.length > 0) ? product.images[0].url : null;

            const isOutOfStock = stockQty <= 0;

            return (
              <div 
                key={v.id}
                onClick={() => {
                  if (isOutOfStock) {
                    toast.warning(`La variante "${v.sku}" está agotada.`);
                    return;
                  }
                  onSelectVariant(product, v, stockQty);
                  onClose();
                }}
                className={`flex gap-3 bg-bg-dark/40 p-3 rounded-xl border border-border-card/60 hover:border-primary/40 text-secondary cursor-pointer transition-all ${
                  isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className="w-12 h-12 bg-bg-card border border-border-card rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                  {varImageUrl ? (
                    <img src={varImageUrl} className="w-full h-full object-cover" alt="var" />
                  ) : (
                    <Package className="w-6 h-6 text-neutral opacity-40" />
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-1">
                      <h5 className="text-[10px] font-bold truncate leading-tight font-mono">{v.sku}</h5>
                      <span className="text-[10px] font-bold text-primary">${v.salePrice.toFixed(2)}</span>
                    </div>
                    <p className="text-[9.5px] text-neutral mt-0.5">{combText}</p>
                  </div>

                  <div className="flex justify-between items-center text-[9px] mt-1 pt-1 border-t border-border-card/30">
                    <span className="text-neutral font-mono">Barras: {v.barcode || 'N/A'}</span>
                    <span className={`font-bold ${isOutOfStock ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {isOutOfStock ? 'Agotado' : `Stock: ${stockQty} pzs`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default VariantSelectorModal;
