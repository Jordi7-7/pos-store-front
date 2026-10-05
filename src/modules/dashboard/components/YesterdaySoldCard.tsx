import React from 'react';
import { History, Info, PackageCheck } from 'lucide-react';

interface YesterdaySoldProduct {
  variantId: string;
  productName: string;
  sku: string;
  currentStock: number;
}

interface YesterdaySoldCardProps {
  products: YesterdaySoldProduct[];
}

export const YesterdaySoldCard: React.FC<YesterdaySoldCardProps> = ({ products }) => {
  return (
    <div className="bg-bg-card border border-border-card rounded-2xl p-4 shadow-sm flex flex-col justify-between h-full space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
          <History className="w-3.5 h-3.5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-secondary">Vendidos el día anterior</h3>
          <p className="text-[10px] text-neutral">Productos con salida registrada ayer</p>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden">
        {products && products.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-card/60 text-[9px] uppercase font-bold text-neutral">
                <th className="py-1 px-1.5">SKU</th>
                <th className="py-1 px-1.5">Producto</th>
                <th className="py-1 px-1.5 text-right">Stock Actual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-card/30 text-xs">
              {products.slice(0, 5).map((item, index) => (
                <tr key={item.variantId || index} className="hover:bg-bg-dark/30 transition-colors">
                  <td className="py-1.5 px-1.5 font-mono text-[10px] text-neutral truncate max-w-[70px]">
                    {item.sku || 'N/A'}
                  </td>
                  <td className="py-1.5 px-1.5 font-medium text-secondary truncate max-w-[120px] sm:max-w-[160px]">
                    {item.productName}
                  </td>
                  <td className="py-1.5 px-1.5 text-right font-semibold text-secondary text-[11px]">
                    {item.currentStock} uds
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="h-28 flex flex-col items-center justify-center text-center p-3">
            <PackageCheck className="w-6 h-6 text-neutral/40 mb-1" />
            <p className="text-xs text-neutral">No se registraron ventas en el día de ayer</p>
          </div>
        )}
      </div>

      {/* Notice / Callout */}
      <div className="p-2 rounded-xl bg-blue-500/5 border border-blue-500/20 flex items-center gap-2">
        <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
        <p className="text-[11px] text-blue-700 dark:text-blue-300 truncate">
          Repón estos artículos para evitar quiebres de inventario durante el día.
        </p>
      </div>
    </div>
  );
};
