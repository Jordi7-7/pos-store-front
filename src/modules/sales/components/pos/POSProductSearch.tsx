import React, { useState } from 'react';
import { Search, CornerDownLeft, X, Package, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';
import { productsService } from '@/modules/products/services/products.service';

interface POSProductSearchProps {
  branchId: string;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  onAddVariantToCart: (product: any, variant: any, maxStock: number) => void;
  onOpenImageZoom?: (url: string) => void;
}

export const POSProductSearch: React.FC<POSProductSearchProps> = ({
  branchId,
  searchInputRef,
  onAddVariantToCart,
  onOpenImageZoom,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const executeSearch = async () => {
    const code = searchTerm.trim();
    if (!code) return;

    try {
      setIsSearching(true);
      const res = await productsService.getPosVariantBySku(code, branchId);
      if (res && res.length > 0) {
        if (res.length === 1) {
          const singleRes = res[0];
          const fakeProduct = {
            id: singleRes.id,
            name: singleRes.productName,
          };
          const fakeVariant = {
            id: singleRes.id,
            sku: singleRes.sku,
            salePrice: Number(singleRes.salePrice || 0),
            wholesalePrice:
              singleRes.wholesalePrice !== undefined && singleRes.wholesalePrice !== null
                ? Number(singleRes.wholesalePrice)
                : null,
            attributeValues: singleRes.attributeValues || [],
            imageUrl: singleRes.imageUrl,
          };
          const stockQty = Number(singleRes.stock || 0);
          if (stockQty <= 0) {
            toast.warning(
              `Aviso: El stock del producto "${singleRes.productName}" quedará en negativo (Stock disponible: ${stockQty} pzs.)`,
            );
          }
          onAddVariantToCart(fakeProduct, fakeVariant, stockQty);
          setSearchTerm('');
        } else {
          setSearchResults(res);
          setShowSearchModal(true);
        }
      } else {
        toast.error(`No se encontró ningún producto con el código: "${code}"`);
      }
    } catch {
      toast.error(`No se encontró ningún producto con el código: "${code}"`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await executeSearch();
    }
  };

  return (
    <>
      {/* Barcode Search Header */}
      <div className="flex gap-2 items-center justify-between border-b border-border-card pb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-neutral" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Escanea código de barras o busca por SKU/Nombre y presiona Enter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyPress}
            disabled={isSearching}
            className="w-full bg-bg-dark border border-border-card rounded-xl py-2 pl-10 pr-4 text-xs text-secondary focus:outline-none focus:border-primary transition-all placeholder-neutral"
            autoFocus
          />
        </div>

        <button
          type="button"
          onClick={executeSearch}
          disabled={!searchTerm.trim() || isSearching}
          title="Buscar código / Confirmar (Enter)"
          className="flex items-center gap-1 px-3 py-2 bg-primary hover:bg-primary/90 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer shrink-0"
        >
          <CornerDownLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Multiple Matches Selection Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-bg-card border border-border-card rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="p-4 border-b border-border-card flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-secondary">
                  Múltiples coincidencias encontradas
                </h3>
                <p className="text-[10px] text-neutral mt-0.5">
                  Selecciona el producto que deseas agregar al carrito
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSearchModal(false);
                  setSearchResults([]);
                }}
                className="p-1.5 hover:bg-bg-dark rounded-xl text-neutral hover:text-secondary transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="p-3 overflow-y-auto space-y-2 flex-1">
              {searchResults.map((variant) => {
                const stockQty = Number(variant.stock || 0);
                const hasAttributes =
                  variant.attributeValues && variant.attributeValues.length > 0;

                return (
                  <div
                    key={variant.id}
                    onClick={() => {
                      const fakeProduct = {
                        id: variant.id,
                        name: variant.productName,
                      };
                      const fakeVariant = {
                        id: variant.id,
                        sku: variant.sku,
                        salePrice: Number(variant.salePrice || 0),
                        wholesalePrice:
                          variant.wholesalePrice !== undefined &&
                          variant.wholesalePrice !== null
                            ? Number(variant.wholesalePrice)
                            : null,
                        attributeValues: variant.attributeValues || [],
                        imageUrl: variant.imageUrl,
                      };
                      if (stockQty <= 0) {
                        toast.warning(
                          `Aviso: El stock del producto "${variant.productName}" quedará en negativo (Stock disponible: ${stockQty} pzs.)`,
                        );
                      }
                      onAddVariantToCart(fakeProduct, fakeVariant, stockQty);
                      setShowSearchModal(false);
                      setSearchResults([]);
                      setSearchTerm('');
                      searchInputRef.current?.focus();
                    }}
                    className="p-3 bg-bg-dark/50 border border-border-card/60 hover:border-primary/50 hover:bg-bg-dark rounded-xl cursor-pointer transition-all flex items-center justify-between gap-4 group"
                  >
                    {/* Thumbnail Image */}
                    <div
                      onClick={(e) => {
                        if (variant.imageUrl && onOpenImageZoom) {
                          e.stopPropagation();
                          onOpenImageZoom(variant.imageUrl);
                        }
                      }}
                      className={`w-10 h-10 rounded-lg border border-border-card bg-bg-dark shrink-0 overflow-hidden flex items-center justify-center relative group/thumb transition-all ${
                        variant.imageUrl ? 'cursor-pointer hover:border-primary/50' : ''
                      }`}
                    >
                      {variant.imageUrl ? (
                        <>
                          <img
                            src={variant.imageUrl}
                            className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-200"
                            alt={variant.productName}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-all duration-200">
                            <Maximize2 className="w-3.5 h-3.5 text-white" />
                          </div>
                        </>
                      ) : (
                        <Package className="w-5 h-5 text-neutral/40" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-extrabold text-xs text-secondary group-hover:text-primary transition-colors truncate">
                          {variant.productName}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[10px] text-neutral font-mono">
                        <span>SKU: {variant.sku}</span>
                        {variant.barcode && (
                          <>
                            <span className="text-border-card">•</span>
                            <span>Código: {variant.barcode}</span>
                          </>
                        )}
                        {hasAttributes && (
                          <>
                            <span className="text-border-card">•</span>
                            <span className="text-neutral font-semibold">
                              {variant.attributeValues
                                .map((av: any) => `${av.attribute.name}: ${av.value}`)
                                .join(', ')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-xs text-secondary block font-mono">
                        ${Number(variant.salePrice || 0).toFixed(2)}
                      </span>
                      <span
                        className={`text-[9px] font-bold mt-0.5 block ${
                          stockQty > 0 ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {stockQty > 0 ? `${stockQty} disponibles` : 'Sin stock'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
