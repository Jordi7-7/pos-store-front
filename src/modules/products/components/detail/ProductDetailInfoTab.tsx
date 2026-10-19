import React from 'react';
import { ProductType } from '../../enums';
import type { ProductDTO, ProductVariantDTO } from '../../types';
import type { ProductEntity } from '../../entities/product.entity';
import { Badge } from '@/components/ui/badge';
import { Barcode } from 'lucide-react';

interface ProductDetailInfoTabProps {
  detailProduct: ProductDTO | ProductEntity;
  variants: ProductVariantDTO[];
  activeVariantId: string;
  categoryName: string;
  totalStockSucursal: number;
  selectedBranchId: string;
  canPrintBarcodes: boolean;
  onSelectVariant: (variantId: string) => void;
  onPrintBarcode: (item: { sku: string; name: string; price: number; quantity: number }) => void;
}

export const ProductDetailInfoTab: React.FC<ProductDetailInfoTabProps> = ({
  detailProduct,
  variants,
  activeVariantId,
  categoryName,
  totalStockSucursal,
  selectedBranchId,
  canPrintBarcodes,
  onSelectVariant,
  onPrintBarcode,
}) => {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">
            Categoría
          </span>
          <strong className="text-sm mt-0.5 block truncate" title={categoryName}>
            {categoryName}
          </strong>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">
            Variantes
          </span>
          <strong className="text-sm mt-0.5 block">{variants.length}</strong>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">
            Stock sucursal
          </span>
          <strong className="text-sm mt-0.5 block text-primary">{totalStockSucursal} pzs</strong>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">
            SKU principal
          </span>
          <strong className="text-sm font-mono mt-0.5 block">
            {detailProduct.type === ProductType.VARIABLE
              ? detailProduct.baseSku || variants[0]?.sku || 'N/A'
              : variants[0]?.sku || detailProduct.baseSku || 'N/A'}
          </strong>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-2xs">
        <div className="px-4 py-3 bg-muted/30 border-b border-border text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Variantes y Precios
        </div>
        <div className="divide-y divide-border">
          {variants.map((variant: ProductVariantDTO) => {
            const isSelected = variant.id === activeVariantId;

            return (
              <div
                key={variant.id || variant.sku}
                onClick={() => {
                  if (variant.id) {
                    onSelectVariant(variant.id);
                  }
                }}
                className={`grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-4 py-3 text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-primary/10 border-l-4 border-l-primary font-medium shadow-2xs'
                    : 'hover:bg-muted/30 border-l-4 border-l-transparent'
                }`}
                title="Haz clic para seleccionar esta variante"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-bold block ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                      {variant.sku}
                    </span>
                    {detailProduct?.type === ProductType.VARIABLE && variant.attributeValues && variant.attributeValues.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {variant.attributeValues.map((av: any, idx: number) => (
                          <span
                            key={av.id || idx}
                            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              isSelected ? 'bg-primary text-white font-bold' : 'bg-primary/10 text-primary'
                            }`}
                          >
                            {av.value || av.attributeValueId}
                          </span>
                        ))}
                      </div>
                    )}
                    {isSelected && (
                      <span className="text-[9.5px] uppercase font-bold text-primary bg-primary/15 px-1.5 py-0.5 rounded">
                        Seleccionada
                      </span>
                    )}
                  </div>
                  {variant.barcode && (
                    <span className="text-[10px] font-mono text-muted-foreground">
                      Cod: {variant.barcode}
                    </span>
                  )}
                </div>
                <span className="text-muted-foreground font-mono">
                  Costo: ${Number(variant.purchasePrice || 0).toFixed(2)}
                </span>
                <span className="font-bold font-mono text-foreground">
                  Venta: ${Number(variant.salePrice || 0).toFixed(2)}
                </span>
                <Badge variant={isSelected ? "default" : "secondary"} className="font-mono">
                  {variant.stocks?.find((stock) => stock.branchId === selectedBranchId)?.quantity || 0} pzs
                </Badge>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  {canPrintBarcodes && (
                    <button
                      type="button"
                      onClick={() => {
                        onPrintBarcode({
                          sku: variant.sku || 'SIN-SKU',
                          name: detailProduct.name,
                          price: Number(variant.salePrice || 0),
                          quantity: 1,
                        });
                      }}
                      className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-all cursor-pointer"
                      title="Imprimir Código de Barras Térmico"
                    >
                      <Barcode className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
