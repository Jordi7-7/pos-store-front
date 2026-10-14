import React, { useState, useMemo, useEffect } from 'react';
import { X, Package, Check, ShoppingCart, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export interface PosVariableProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productData: {
    productId: string;
    productName: string;
    baseSku: string | null;
    description?: string;
    imageUrl?: string | null;
    productType?: any;
    attributes: Array<{
      id: string;
      name: string;
      values: Array<{ id: string; value: string }>;
    }>;
    variants: Array<{
      id: string;
      sku: string;
      barcode: string;
      purchasePrice: number;
      salePrice: number;
      wholesalePrice: number | null;
      stock: number;
      imageUrl?: string | null;
      attributes?: Array<{
        name: string;
        value: string;
      }>;
      attributeValues: Array<{
        attributeId: string;
        attributeName: string;
        valueId: string;
        valueName: string;
      }>;
    }>;
  } | null;
  onAddToCart: (product: any, variant: any, maxStock: number) => void;
}

export const PosVariableProductModal: React.FC<PosVariableProductModalProps> = ({
  isOpen,
  onClose,
  productData,
  onAddToCart,
}) => {
  if (!isOpen || !productData) return null;

  const { productName, baseSku, imageUrl: productImageUrl, attributes = [], variants = [] } = productData;

  // Initialize selected values with the first variant's attributes
  const initialSelections = useMemo(() => {
    const defaults: Record<string, string> = {};
    const firstVar = variants[0];
    if (firstVar && firstVar.attributeValues) {
      firstVar.attributeValues.forEach((av) => {
        if (av.attributeId && av.valueId) {
          defaults[av.attributeId] = av.valueId;
        }
      });
    }
    return defaults;
  }, [variants]);

  const [selectedAttributeValues, setSelectedAttributeValues] = useState<Record<string, string>>(initialSelections);

  useEffect(() => {
    setSelectedAttributeValues(initialSelections);
  }, [initialSelections]);

  // Find exact matching variant based on current selections
  const activeVariant = useMemo(() => {
    return variants.find((variant) => {
      if (!variant.attributeValues || variant.attributeValues.length === 0) return false;
      return Object.entries(selectedAttributeValues).every(([attrId, valId]) => {
        return variant.attributeValues.some(
          (av) => av.attributeId === attrId && av.valueId === valId
        );
      });
    }) || variants[0];
  }, [variants, selectedAttributeValues]);

  const currentStock = Number(activeVariant?.stock || 0);
  const currentPrice = Number(activeVariant?.salePrice || 0);
  const currentImage = activeVariant?.imageUrl || productImageUrl;

  const handleSelectValue = (attributeId: string, valueId: string) => {
    setSelectedAttributeValues((prev) => ({
      ...prev,
      [attributeId]: valueId,
    }));
  };

  const handleConfirmAddToCart = () => {
    if (!activeVariant) {
      toast.warning('No se ha encontrado una variante válida con la combinación seleccionada.');
      return;
    }

    const fakeProduct = {
      id: productData.productId,
      name: productName,
      type: productData.productType,
    };

    const fakeVariant = {
      id: activeVariant.id,
      sku: activeVariant.sku,
      salePrice: currentPrice,
      wholesalePrice: activeVariant.wholesalePrice,
      attributes: activeVariant.attributes || [],
      attributeValues: activeVariant.attributeValues || [],
      imageUrl: currentImage,
    };

    if (currentStock <= 0) {
      toast.warning(
        `Aviso: El stock de la variante "${activeVariant.sku}" quedará en negativo (Stock disponible: ${currentStock} pzs.)`
      );
    }

    onAddToCart(fakeProduct, fakeVariant, currentStock);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-bg-card border border-border-card rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 px-5 border-b border-border-card flex items-center justify-between">
          <div className="min-w-0 pr-3">
            <h3 className="text-base font-extrabold text-secondary truncate">
              {productName}
            </h3>
            {baseSku && (
              <span className="text-[11px] font-mono text-neutral block mt-0.5">
                Base SKU: <strong className="text-primary">{baseSku}</strong>
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-bg-dark rounded-xl text-neutral hover:text-secondary transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Main Visual Image & SKU / Price Card */}
          <div className="flex gap-4 items-center bg-bg-dark/60 border border-border-card/60 p-3.5 rounded-2xl">
            <div className="w-20 h-20 rounded-xl border border-border-card bg-bg-card shrink-0 overflow-hidden flex items-center justify-center">
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={productName}
                  className="w-full h-full object-cover transition-transform duration-200"
                />
              ) : (
                <Package className="w-8 h-8 text-neutral/40" />
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <span className="font-mono text-xs font-bold text-primary block truncate">
                {activeVariant?.sku || 'S/SKU'}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black font-mono text-secondary">
                  ${currentPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    currentStock > 0
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {currentStock > 0 ? `${currentStock} disponibles` : 'Sin stock (0 pzs)'}
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Attribute Selectors */}
          <div className="space-y-4">
            {attributes.map((attr) => {
              const selectedValId = selectedAttributeValues[attr.id];

              return (
                <div key={attr.id} className="space-y-2">
                  <label className="text-xs font-bold text-secondary uppercase tracking-wider block">
                    {attr.name}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {attr.values.map((val) => {
                      const isSelected = selectedValId === val.id;
                      return (
                        <button
                          key={val.id}
                          type="button"
                          onClick={() => handleSelectValue(attr.id, val.id)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-primary border-primary text-white shadow-sm shadow-primary/30 font-bold scale-[1.02]'
                              : 'bg-bg-dark border-border-card text-neutral hover:border-neutral/50 hover:text-secondary'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0 stroke-[3]" />}
                          <span>{val.value}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 px-5 border-t border-border-card bg-bg-dark/30 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-neutral hover:text-secondary hover:bg-bg-dark transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmAddToCart}
            className="px-5 py-2.5 bg-primary hover:bg-primary/90 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-primary/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Agregar al Carrito</span>
          </button>
        </div>
      </div>
    </div>
  );
};
