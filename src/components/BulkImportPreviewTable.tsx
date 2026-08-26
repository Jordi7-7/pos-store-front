import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface PreviewTableItem {
  sku: string;
  name?: string;
  barcode?: string;
  purchasePrice?: number;
  salePrice?: number;
  quantity?: number;
}

interface BulkImportPreviewTableProps {
  items: PreviewTableItem[];
  errors: Record<string, string>;
  names?: Record<string, string>;
  type: 'products' | 'purchases';
}

export const BulkImportPreviewTable: React.FC<BulkImportPreviewTableProps> = ({
  items,
  errors,
  names = {},
  type,
}) => {
  return (
    <div className="border border-border rounded-xl overflow-hidden shadow-inner max-h-[350px] overflow-y-auto overflow-x-auto bg-muted/10 w-full">
      <table className="w-full min-w-[750px] text-left border-collapse text-xs">
        <thead className="bg-muted/80 sticky top-0 border-b border-border text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
          <tr>
            <th className="px-4 py-2.5">Estado</th>
            <th className="px-4 py-2.5 font-mono">SKU</th>
            {type === 'products' ? (
              <>
                <th className="px-4 py-2.5">Nombre</th>
                <th className="px-4 py-2.5 font-mono">Código</th>
                <th className="px-4 py-2.5 text-right">P. Compra</th>
                <th className="px-4 py-2.5 text-right">P. Venta</th>
                <th className="px-4 py-2.5 text-right">Cant. Inicial</th>
              </>
            ) : (
              <>
                <th className="px-4 py-2.5">Producto</th>
                <th className="px-4 py-2.5 text-right">Cantidad a Ingresar</th>
              </>
            )}
            <th className="px-4 py-2.5 max-w-[200px]">Detalle / Error</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {items.map((item, idx) => {
            const errorMsg = errors[item.sku];
            const hasError = !!errorMsg;
            const productName = type === 'products' ? item.name : (names[item.sku] || 'Cargando...');

            return (
              <tr 
                key={`${item.sku}-${idx}`}
                className={`transition-colors ${
                  hasError 
                    ? 'bg-rose-500/5 hover:bg-rose-500/10 border-l-2 border-l-rose-500' 
                    : 'hover:bg-muted/30'
                }`}
              >
                <td className="px-4 py-2.5">
                  {hasError ? (
                    <span className="flex items-center gap-1 text-rose-400 font-medium">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      Error
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-emerald-500 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      Listo
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 font-mono font-bold text-foreground/90">{item.sku}</td>
                {type === 'products' ? (
                  <>
                    <td className="px-4 py-2.5 font-medium truncate max-w-[150px]">{productName || 'S/N'}</td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-muted-foreground">{item.barcode || 'S/Barra'}</td>
                    <td className="px-4 py-2.5 text-right font-mono">${Number(item.purchasePrice || 0).toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right font-mono">${Number(item.salePrice || 0).toFixed(2)}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold">{item.quantity || 0}</td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2.5 font-semibold text-secondary truncate max-w-[200px]">
                      {hasError ? (
                        <span className="text-muted-foreground italic text-[11px]">{errorMsg === 'Este SKU no existe en el catálogo de productos.' ? 'Desconocido' : productName}</span>
                      ) : (
                        productName
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-primary">{item.quantity || 0}</td>
                  </>
                )}
                <td className="px-4 py-2.5 max-w-[200px]">
                  {hasError ? (
                    <span className="text-[11px] text-rose-400 leading-tight font-medium block">
                      {errorMsg}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground italic">Datos correctos</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
