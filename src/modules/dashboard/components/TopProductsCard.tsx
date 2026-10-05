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
    <div className="bg-bg-card border border-border-card rounded-2xl p-4 shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-secondary">Productos más vendidos</h3>
        <span className="text-[10px] font-semibold text-neutral uppercase tracking-wider">Top 5</span>
      </div>

      <div className="flex-1 space-y-1.5 overflow-hidden">
        {products && products.length > 0 ? (
          products.slice(0, 5).map((item, index) => (
            <div
              key={item.variantId || index}
              className="flex items-center justify-between p-1.5 rounded-xl hover:bg-bg-dark/40 transition-colors border border-transparent hover:border-border-card/40"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Posición / Medalla */}
                <div className="w-5 text-center text-xs font-bold flex-shrink-0">
                  {index < 3 ? (
                    <span className="text-sm">{MEDAL_EMOJIS[index]}</span>
                  ) : (
                    <span className="text-[11px] text-neutral">{index + 1}</span>
                  )}
                </div>

                {/* Imagen / Placeholder */}
                <div className="w-8 h-8 rounded-lg bg-bg-dark border border-border-card flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-3.5 h-3.5 text-neutral" />
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-secondary truncate max-w-[130px] xl:max-w-[180px]">
                    {item.productName}
                  </p>
                  <p className="text-[9px] text-neutral font-mono truncate">{item.sku || 'Sin SKU'}</p>
                </div>
              </div>

              {/* Cantidad vendida */}
              <div className="text-right flex-shrink-0 pl-2">
                <span className="text-xs font-bold text-secondary">{item.quantitySold}</span>
                <span className="text-[9px] text-neutral ml-0.5">uds</span>
              </div>
            </div>
          ))
        ) : (
          <div className="h-32 flex flex-col items-center justify-center text-center p-4">
            <Package className="w-6 h-6 text-neutral/40 mb-1" />
            <p className="text-xs text-neutral">No hay ventas registradas aún hoy</p>
          </div>
        )}
      </div>
    </div>
  );
};
