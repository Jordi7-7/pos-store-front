import React from 'react';
import { AlertTriangle, PackageX } from 'lucide-react';

interface LowStockProduct {
  variantId: string;
  productName: string;
  sku: string;
  stock: number;
}

interface LowStockCardProps {
  products: LowStockProduct[];
}

export const LowStockCard: React.FC<LowStockCardProps> = ({ products }) => {
  return (
    <div className="bg-bg-card border border-border-card rounded-2xl p-4 shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-secondary">Poco inventario</h3>
            <p className="text-[10px] text-neutral">Stock menor o igual a 5</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {products && products.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-card/60 text-[9px] uppercase font-bold text-neutral">
                <th className="py-1 px-1.5">SKU</th>
                <th className="py-1 px-1.5">Producto</th>
                <th className="py-1 px-1.5 text-right">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-card/30 text-xs">
              {products.slice(0, 5).map((item, index) => {
                const isCritical = item.stock <= 2;
                return (
                  <tr key={item.variantId || index} className="hover:bg-bg-dark/30 transition-colors">
                    <td className="py-1.5 px-1.5 font-mono text-[10px] text-neutral truncate max-w-[70px]">
                      {item.sku || 'N/A'}
                    </td>
                    <td className="py-1.5 px-1.5 font-medium text-secondary truncate max-w-[120px] sm:max-w-[160px]">
                      {item.productName}
                    </td>
                    <td className="py-1.5 px-1.5 text-right">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isCritical
                            ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        }`}
                      >
                        {item.stock} {item.stock === 1 ? 'ud' : 'uds'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="h-28 flex flex-col items-center justify-center text-center p-3">
            <PackageX className="w-6 h-6 text-neutral/40 mb-1" />
            <p className="text-xs text-neutral">Niveles saludables (&gt; 5)</p>
          </div>
        )}
      </div>
    </div>
  );
};
