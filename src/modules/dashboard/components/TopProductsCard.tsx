import React from 'react';
import { Package } from 'lucide-react';

interface TopProduct {
  variantId: string;
  productName: string;
  sku: string;
  imageUrl: string | null;
  quantitySold: number;
}

interface TopProductsCardProps {
  products: TopProduct[];
}

const MEDAL_EMOJIS = ['🥇', '🥈', '🥉'];

export const TopProductsCard: React.FC<TopProductsCardProps> = ({ products }) => {
  return (
    <div className="bg-bg-card border border-border-card rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-secondary">Productos más vendidos</h3>
        <span className="text-[11px] font-medium text-neutral">Top 5</span>
      </div>

      <div className="flex-1 space-y-2.5">
        {products && products.length > 0 ? (
          products.map((item, index) => (
            <div
              key={item.variantId || index}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-bg-dark/40 transition-colors border border-transparent hover:border-border-card/40"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Posición / Medalla */}
                <div className="w-6 text-center text-sm font-bold flex-shrink-0">
                  {index < 3 ? (
                    <span className="text-base">{MEDAL_EMOJIS[index]}</span>
                  ) : (
                    <span className="text-xs text-neutral">{index + 1}</span>
                  )}
                </div>

                {/* Imagen / Placeholder */}
                <div className="w-10 h-10 rounded-lg bg-bg-dark border border-border-card flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-4 h-4 text-neutral" />
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-secondary truncate max-w-[150px] sm:max-w-[200px]">
                    {item.productName}
                  </p>
                  <p className="text-[10px] text-neutral font-mono truncate">{item.sku || 'Sin SKU'}</p>
                </div>
              </div>

              {/* Cantidad vendida */}
              <div className="text-right flex-shrink-0 pl-2">
                <span className="text-xs font-bold text-secondary">{item.quantitySold}</span>
                <span className="text-[10px] text-neutral ml-1">uds</span>
              </div>
            </div>
          ))
        ) : (
          <div className="h-40 flex flex-col items-center justify-center text-center p-4">
            <Package className="w-8 h-8 text-neutral/40 mb-2" />
            <p className="text-xs text-neutral">No hay ventas registradas aún hoy</p>
          </div>
        )}
      </div>
    </div>
  );
};
