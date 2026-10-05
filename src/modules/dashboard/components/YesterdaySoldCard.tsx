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
    <div className="bg-bg-card border border-border-card rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
          <History className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-secondary">Vendidos el día anterior</h3>
          <p className="text-[11px] text-neutral">Productos con salida registrada ayer</p>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto">
        {products && products.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-card/60 text-[10px] uppercase font-bold text-neutral">
                <th className="py-2 px-2">SKU</th>
                <th className="py-2 px-2">Producto</th>
                <th className="py-2 px-2 text-right">Stock Actual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-card/30 text-xs">
              {products.map((item, index) => (
                <tr key={item.variantId || index} className="hover:bg-bg-dark/30 transition-colors">
                  <td className="py-2.5 px-2 font-mono text-[11px] text-neutral truncate max-w-[80px]">
                    {item.sku || 'N/A'}
                  </td>
                  <td className="py-2.5 px-2 font-medium text-secondary truncate max-w-[140px] sm:max-w-[200px]">
                    {item.productName}
                  </td>
                  <td className="py-2.5 px-2 text-right font-medium text-secondary">
                    {item.currentStock} uds
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="h-32 flex flex-col items-center justify-center text-center p-4">
            <PackageCheck className="w-8 h-8 text-neutral/40 mb-2" />
            <p className="text-xs text-neutral">No se registraron ventas en el día de ayer</p>
          </div>
        )}
      </div>

      {/* Notice / Callout */}
      <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
          Verifica tu almacén y repón estos artículos para evitar quiebres de inventario durante el día.
        </p>
      </div>
    </div>
  );
};
