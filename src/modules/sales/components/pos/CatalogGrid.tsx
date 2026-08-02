import React from 'react';
import { Package } from 'lucide-react';

interface CatalogGridProps {
  products: any[];
  isLoading: boolean;
  selectedBranchId: string;
  branches: any[];
  onProductClick: (product: any) => void;
}

export const CatalogGrid: React.FC<CatalogGridProps> = ({
  products,
  isLoading,
  selectedBranchId,
  branches,
  onProductClick
}) => {
  const currentBranch = selectedBranchId || (branches[0] && branches[0].id);

  return (
    <div className="space-y-6">
      {/* Catalog Grid */}
      {isLoading ? (
        <div className="bg-bg-card border border-border-card rounded-2xl p-12 text-center text-neutral text-xs flex flex-col items-center justify-center gap-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Cargando catálogo del POS...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-bg-card border border-border-card rounded-2xl p-12 text-center text-neutral text-xs flex flex-col items-center justify-center gap-3">
          <Package className="w-10 h-10 opacity-30" />
          <span>No se encontraron productos en esta categoría o búsqueda.</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {products.map((prod) => {
            const imgUrl = prod.images && prod.images.length > 0 ? prod.images[0].url : null;
            
            const totalStock = prod.variants?.reduce(
              (sum: number, v: any) => sum + (v.stocks?.find((s: any) => s.branchId === currentBranch)?.quantity || 0), 
              0
            ) || 0;

            const isOutOfStock = totalStock <= 0;
            const hasMultipleVars = prod.variants && prod.variants.length > 1;

            return (
              <div 
                key={prod.id} 
                onClick={() => onProductClick(prod)}
                className={`bg-bg-card border border-border-card rounded-2xl hover:border-primary/50 transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2.5 group shadow-sm hover:shadow-md animate-fade-in relative overflow-hidden p-3 ${
                  isOutOfStock ? 'opacity-65' : ''
                }`}
              >
                {/* Image Container with Stock Badge */}
                <div className="aspect-square w-full rounded-xl bg-bg-dark/40 border border-border-card/50 overflow-hidden flex items-center justify-center relative">
                  {imgUrl ? (
                    <img src={imgUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" alt={prod.name} />
                  ) : (
                    <Package className="w-10 h-10 text-neutral opacity-40" />
                  )}
                  
                  {/* Stock Badge matching screenshot */}
                  {!isOutOfStock && (
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                      {totalStock}
                    </div>
                  )}
                  {isOutOfStock && (
                    <div className="absolute top-2 right-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                      0
                    </div>
                  )}

                  {hasMultipleVars && (
                    <div className="absolute bottom-2 left-2 bg-primary/90 text-white text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-primary/20 shadow">
                      Variantes
                    </div>
                  )}
                </div>

                {/* Info Area */}
                <div className="px-1 pb-1">
                  <h4 className="font-bold text-xs text-secondary group-hover:text-primary transition-colors truncate leading-tight">{prod.name}</h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[11px] font-bold text-primary">
                      {hasMultipleVars 
                        ? `$${Math.min(...prod.variants.map((v: any) => v.salePrice)).toFixed(2)}`
                        : `$${(prod.variants?.[0]?.salePrice || 0).toFixed(2)}`
                      }
                    </span>
                    <span className="text-[9px] text-neutral">/ Nos</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default CatalogGrid;
