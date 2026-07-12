import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { useBranches } from '../../branches/hooks/useBranches';
import { 
  Package, Search, ArrowUpRight, ArrowDownLeft, Calendar, 
  MapPin, Loader2, X, ClipboardList 
} from 'lucide-react';

interface KardexTabProps {
  products: any[];
  isLoadingProducts: boolean;
}

interface InventoryMovement {
  id: string;
  quantity: number;
  type: string; // INPUT, OUTPUT
  reason: string; // SALE, PURCHASE, ADJUSTMENT, etc.
  createdAt: string;
  variant?: {
    sku: string;
    product?: {
      name: string;
    };
  };
  originBranch?: { name: string } | null;
  destinationBranch?: { name: string } | null;
}

export const KardexTab: React.FC<KardexTabProps> = ({ products, isLoadingProducts }) => {
  const { branches } = useBranches();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVariantForMovements, setSelectedVariantForMovements] = useState<any | null>(null);
  const [isMovementsModalOpen, setIsMovementsModalOpen] = useState(false);

  // Flatten products into product variant rows
  const variantRows = React.useMemo(() => {
    if (!products) return [];
    
    const rows: any[] = [];
    products.forEach((prod: any) => {
      (prod.variants || []).forEach((v: any) => {
        // Build combination text
        const combText = v.attributeValues && v.attributeValues.length > 0
          ? v.attributeValues.map((av: any) => `${av.attribute?.name || 'Attr'}: ${av.value}`).join(' / ')
          : 'Estándar';
          
        rows.push({
          productId: prod.id,
          productName: prod.name,
          variantId: v.id,
          sku: v.sku,
          barcode: v.barcode,
          combinationText: combText,
          stocks: v.stocks || [],
          rawVariant: v,
          rawProduct: prod
        });
      });
    });

    return rows;
  }, [products]);

  // Filter variant rows locally by search term
  const filteredVariantRows = React.useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return variantRows;
    return variantRows.filter(r => 
      r.productName.toLowerCase().includes(term) ||
      r.sku.toLowerCase().includes(term) ||
      (r.barcode && r.barcode.toLowerCase().includes(term))
    );
  }, [variantRows, searchTerm]);

  // Query to get movements of selected variant
  const { data: movements = [], isLoading: isLoadingMovements } = useQuery<InventoryMovement[]>({
    queryKey: ['variant-movements', selectedVariantForMovements?.variantId],
    queryFn: async () => {
      if (!selectedVariantForMovements?.variantId) return [];
      return apiClient.get<InventoryMovement[]>(`/products/inventory-movements?variantId=${selectedVariantForMovements.variantId}`);
    },
    enabled: !!selectedVariantForMovements?.variantId,
  });

  const handleRowClick = (row: any) => {
    setSelectedVariantForMovements(row);
    setIsMovementsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top filter bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-bg-card border border-border-card rounded-2xl p-4 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral" />
          <input 
            type="text" 
            placeholder="Filtrar por SKU o producto..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-bg-dark border border-border-card rounded-xl py-2.5 pl-10 pr-4 text-xs text-secondary focus:outline-none focus:border-primary transition-all placeholder-neutral"
          />
        </div>
        <div className="text-[10px] text-neutral bg-bg-dark border border-border-card rounded-xl px-4 py-2 font-semibold">
          Mostrando {filteredVariantRows.length} variante(s) en almacén
        </div>
      </div>

      {/* Existencias Table Grid */}
      {isLoadingProducts ? (
        <div className="bg-bg-card border border-border-card rounded-2xl p-16 text-center text-xs text-neutral flex flex-col items-center justify-center gap-2 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span>Cargando existencias de inventario...</span>
        </div>
      ) : filteredVariantRows.length === 0 ? (
        <div className="bg-bg-card border border-border-card rounded-2xl p-16 text-center text-xs text-neutral flex flex-col items-center justify-center gap-3 shadow-sm">
          <Package className="w-12 h-12 opacity-35" />
          <span>No se encontraron artículos o variaciones registradas.</span>
        </div>
      ) : (
        <div className="bg-bg-card border border-border-card rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-secondary border-collapse">
              <thead>
                <tr className="bg-bg-dark border-b border-border-card text-[9px] font-bold uppercase tracking-wider text-neutral">
                  <th className="p-4">SKU / Variante</th>
                  <th className="p-4">Producto</th>
                  {branches.map(b => (
                    <th key={b.id} className="p-4 text-center">{b.name}</th>
                  ))}
                  <th className="p-4 text-center">Stock Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredVariantRows.map((row) => {
                  const totalStock = row.stocks.reduce((sum: number, s: any) => sum + (Number(s.quantity) || 0), 0);
                  
                  return (
                    <tr 
                      key={row.variantId} 
                      onClick={() => handleRowClick(row)}
                      className="border-b border-border-card/60 hover:bg-primary/5 transition-all cursor-pointer"
                    >
                      <td className="p-4 font-mono font-bold text-primary">
                        {row.sku}
                        <span className="text-[10px] text-neutral font-sans block font-normal mt-0.5">{row.combinationText}</span>
                      </td>
                      <td className="p-4 font-semibold">{row.productName}</td>
                      {branches.map(b => {
                        const qty = row.stocks.find((s: any) => s.branchId === b.id)?.quantity || 0;
                        return (
                          <td key={b.id} className="p-4 text-center font-bold font-mono">
                            <span className={qty <= 0 ? 'text-rose-500' : 'text-secondary'}>
                              {qty}
                            </span>
                          </td>
                        );
                      })}
                      <td className="p-4 text-center font-bold font-mono">
                        <span className={`px-2.5 py-0.5 rounded-lg border font-mono text-[11px] ${
                          totalStock <= 0 
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' 
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                        }`}>
                          {totalStock}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INVENTORY MOVEMENTS MODAL (KARDEX DETAILED) */}
      {isMovementsModalOpen && selectedVariantForMovements && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-bg-card border border-border-card rounded-2xl p-6 w-full max-w-2xl shadow-2xl relative">
            <button
              onClick={() => {
                setIsMovementsModalOpen(false);
                setSelectedVariantForMovements(null);
              }}
              className="absolute top-4 right-4 p-1.5 text-neutral hover:text-secondary bg-bg-dark/40 hover:bg-bg-dark border border-border-card/60 rounded-xl transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="border-b border-border-card pb-4 mb-4">
              <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-primary" />
                <span>Kardex / Historial de Movimientos</span>
              </h3>
              <div className="mt-2 p-3 bg-bg-dark rounded-xl border border-border-card/50 flex flex-wrap gap-x-6 gap-y-1 text-xs">
                <div>
                  <span className="text-[10px] text-neutral uppercase font-bold block">Producto</span>
                  <span className="font-semibold text-secondary">{selectedVariantForMovements.productName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral uppercase font-bold block">SKU Variante</span>
                  <span className="font-semibold font-mono text-primary">{selectedVariantForMovements.sku}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral uppercase font-bold block">Combinación</span>
                  <span className="font-semibold text-secondary">{selectedVariantForMovements.combinationText}</span>
                </div>
              </div>
            </div>

            {/* List of movements */}
            {isLoadingMovements ? (
              <div className="py-16 text-center text-xs text-neutral flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span>Cargando movimientos de inventario...</span>
              </div>
            ) : movements.length === 0 ? (
              <div className="py-16 text-center text-xs text-neutral italic border-2 border-dashed border-border-card rounded-xl">
                No hay movimientos registrados para esta variante. Genera una venta o una compra.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {movements.map((mov) => {
                  const isInput = mov.type === 'INPUT';
                  
                  // Translate reason to readable spanish
                  let reasonText = mov.reason;
                  if (mov.reason === 'PURCHASE') reasonText = 'Compra (Abastecimiento)';
                  else if (mov.reason === 'SALE') reasonText = 'Venta (POS)';
                  else if (mov.reason === 'INITIAL_STOCK') reasonText = 'Stock de Apertura';
                  else if (mov.reason === 'ADJUSTMENT') reasonText = 'Ajuste de Stock';

                  return (
                    <div 
                      key={mov.id} 
                      className={`p-3 border rounded-xl flex items-center justify-between gap-3 shadow-sm bg-bg-dark/40 ${
                        isInput 
                          ? 'border-emerald-500/20 hover:border-emerald-500/40' 
                          : 'border-rose-500/20 hover:border-rose-500/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isInput 
                            ? 'bg-emerald-500/10 text-emerald-500' 
                            : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          {isInput ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-secondary flex items-center gap-1.5">
                            <span>{reasonText}</span>
                            <span className="text-[9px] text-neutral font-mono font-normal">ID: {mov.id.substring(0, 8)}</span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-neutral mt-0.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(mov.createdAt).toLocaleString()}
                            </span>
                            
                            {(mov.originBranch || mov.destinationBranch) && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {isInput 
                                  ? `Destino: ${mov.destinationBranch?.name || 'Matriz'}`
                                  : `Origen: ${mov.originBranch?.name || 'Matriz'}`
                                }
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono font-bold">
                        <span className={`text-xs ${isInput ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {isInput ? '+' : '-'}{Math.round(mov.quantity)}
                        </span>
                        <span className="text-[9px] text-neutral block font-normal font-sans">pzs</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
export default KardexTab;
