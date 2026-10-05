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
    <div className="bg-bg-card border border-border-card rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-secondary">Poco inventario</h3>
            <p className="text-[11px] text-neutral">Productos con stock menor o igual a 5</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        {products && products.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-card/60 text-[10px] uppercase font-bold text-neutral">
                <th className="py-2 px-2">SKU</th>
                <th className="py-2 px-2">Producto</th>
                <th className="py-2 px-2 text-right">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-card/30 text-xs">
              {products.map((item, index) => {
                const isCritical = item.stock <= 2;
                return (
                  <tr key={item.variantId || index} className="hover:bg-bg-dark/30 transition-colors">
                    <td className="py-2.5 px-2 font-mono text-[11px] text-neutral truncate max-w-[80px]">
                      {item.sku || 'N/A'}
                    </td>
                    <td className="py-2.5 px-2 font-medium text-secondary truncate max-w-[140px] sm:max-w-[200px]">
                      {item.productName}
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
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
          <div className="h-40 flex flex-col items-center justify-center text-center p-4">
            <PackageX className="w-8 h-8 text-neutral/40 mb-2" />
            <p className="text-xs text-neutral">Todo el inventario se encuentra en niveles saludables (&gt; 5)</p>
          </div>
        )}
      </div>
    </div>
  );
};
