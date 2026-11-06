import React, { useState, useRef } from 'react';
import { Search, CornerDownLeft, X, Package, Maximize2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useVariantSearch } from '@/modules/products/presentation/hooks';
import { ProductType } from '@/modules/products/domain/enums';
import type { PosVariantEntity, PosVariableProductEntity } from '@/modules/products/domain/entities/catalog.entity';
import type { CartProductRef, CartVariantRef } from '../../../domain/entities/cart-item';
import { cartRefsFromPosVariant } from '../../../domain/rules/cart-rules';
import { PosVariableProductModal } from './PosVariableProductModal';
import { formatMoney } from '@/modules/auth/presentation/hooks/useSession';

interface POSProductSearchProps {
  branchId: string;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  onAddVariantToCart: (product: CartProductRef, variant: CartVariantRef, maxStock: number) => void;
  onOpenImageZoom?: (url: string) => void;
}

export const POSProductSearch: React.FC<POSProductSearchProps> = ({
  branchId,
  searchInputRef,
  onAddVariantToCart,
  onOpenImageZoom,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<PosVariantEntity[]>([]);
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const isSearchingRef = useRef<boolean>(false);
  const { searchPos } = useVariantSearch();

  // Variable product modal state
  const [variableProductData, setVariableProductData] = useState<PosVariableProductEntity | null>(null);
  const [showVariableModal, setShowVariableModal] = useState<boolean>(false);

  const focusInput = () => {
    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  };

  const executeSearch = async () => {
    const code = searchTerm.trim();
    if (!code || isSearchingRef.current) return;

    try {
      isSearchingRef.current = true;
      setIsSearching(true);
      const result = await searchPos(code, branchId);

      // Case 1: el código es el SKU base de un producto variable: se elige la variante
      if (result.kind === 'variable-product') {
        setVariableProductData(result.product);
        setShowVariableModal(true);
        setSearchTerm('');
        return;
      }

      // Case 2: variantes que coinciden (una sola o varias, p. ej. código de barras repetido)
      const res = result.variants;
      if (res.length > 0) {
        const singleRes = res[0];
        if (res.length === 1 && singleRes) {
          const { product, variant } = cartRefsFromPosVariant(singleRes);
          const stockQty = Number(singleRes.stock || 0);
          if (stockQty <= 0) {
            toast.warning(
              `Aviso: El stock del producto "${singleRes.productName}" quedará en negativo (Stock disponible: ${stockQty} pzs.)`,
            );
          }
          onAddVariantToCart(product, variant, stockQty);
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
      isSearchingRef.current = false;
      setIsSearching(false);
      focusInput();
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
          <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-neutral" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Escanea código o escribe SKU / nombre y pulsa Enter"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyPress}
            className="w-full h-11 bg-bg-dark border-2 border-border-card rounded-lg pl-11 pr-14 text-sm text-secondary focus:outline-none focus:border-primary transition-all placeholder-neutral"
            autoFocus
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-border-card bg-bg-card px-1.5 py-0.5 text-xs font-mono font-semibold text-neutral">
            F5
          </kbd>
        </div>

        <button
          type="button"
          onClick={executeSearch}
          disabled={!searchTerm.trim() || isSearching}
          title="Buscar código / Confirmar (Enter)"
          className="flex items-center justify-center gap-1 h-11 w-11 bg-primary hover:bg-primary/90 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer shrink-0"
        >
          {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <CornerDownLeft className="w-5 h-5" />}
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
                <p className="text-xs text-neutral mt-0.5">
                  Selecciona el producto que deseas agregar al carrito
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSearchModal(false);
                  setSearchResults([]);
                  focusInput();
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
                const isSimple = variant.productType === ProductType.SIMPLE;
                const hasAttributes =
                  !isSimple && variant.attributeValues && variant.attributeValues.length > 0;

                return (
                  <div
                    key={variant.id}
                    onClick={() => {
                      const { product, variant: cartVariant } = cartRefsFromPosVariant(variant);
                      if (stockQty <= 0) {
                        toast.warning(
                          `Aviso: El stock del producto "${variant.productName}" quedará en negativo (Stock disponible: ${stockQty} pzs.)`,
                        );
                      }
                      onAddVariantToCart(product, cartVariant, stockQty);
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

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-neutral font-mono">
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
                              {(variant.attributes || [])
                                .map((a) => `${a.name}: ${a.value}`)
                                .join(', ')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-xs text-secondary block font-mono">
                        {formatMoney(Number(variant.salePrice || 0))}
                      </span>
                      <span
                        className={`text-xs font-bold mt-0.5 block ${
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

      {/* Dynamic Variable Product Attributes Modal (Base SKU match) */}
      <PosVariableProductModal
        isOpen={showVariableModal}
        onClose={() => {
          setShowVariableModal(false);
          setVariableProductData(null);
          searchInputRef.current?.focus();
        }}
        productData={variableProductData}
        onAddToCart={onAddVariantToCart}
      />
    </>
  );
};
