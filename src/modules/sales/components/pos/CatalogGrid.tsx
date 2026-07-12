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
                className={`p-4 bg-bg-card border border-border-card rounded-2xl hover:border-primary/50 transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 group shadow-sm animate-fade-in relative ${
                  isOutOfStock ? 'opacity-60' : ''
                }`}
              >
                <div className="aspect-square w-full rounded-xl bg-bg-dark border border-border-card overflow-hidden flex items-center justify-center relative">
                  {imgUrl ? (
                    <img src={imgUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" alt={prod.name} />
                  ) : (
                    <Package className="w-8 h-8 text-neutral opacity-45" />
                  )}
                  {hasMultipleVars && (
                    <div className="absolute bottom-2 right-2 bg-primary/95 text-white text-[9px] font-bold px-2 py-0.5 rounded-lg border border-primary/20 shadow">
                      Variantes
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-xs text-secondary group-hover:text-primary transition-colors truncate">{prod.name}</h4>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs font-bold text-primary">
                      {hasMultipleVars 
                        ? `$${Math.min(...prod.variants.map((v: any) => v.salePrice)).toFixed(2)}`
                        : `$${(prod.variants?.[0]?.salePrice || 0).toFixed(2)}`
                      }
                    </span>
                    <span className={`text-[10px] font-bold ${isOutOfStock ? 'text-rose-500' : 'text-neutral'}`}>
                      {isOutOfStock ? 'Agotado' : `Stock: ${totalStock}`}
                    </span>
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
