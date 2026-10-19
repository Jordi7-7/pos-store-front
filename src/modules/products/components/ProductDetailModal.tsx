import React, { useEffect, useState, useMemo } from 'react';
import type {
  ProductDTO,
  ProductVariantDTO,
} from '../types';
import { useProductDetail } from '../hooks';
import { StockAdjustmentForm } from './StockAdjustmentForm';
import {
  ProductDetailInfoTab,
  ProductDetailBatchesTab,
  ProductDetailSalesTab,
  ProductDetailPurchasesTab,
  ProductDetailMovementsTab,
} from './detail';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  ShoppingCart, 
  Truck, 
  ClipboardList, 
  SlidersHorizontal, 
  Boxes,
} from 'lucide-react';
import { BarcodePrintModal, type BarcodeLabelItem } from './barcode-printer/BarcodePrintModal';
import { usePermissions } from '@/hooks/usePermissions';
import { APP_PERMISSIONS } from '@/constants/permissions';

import type { ProductEntity } from '../entities/product.entity';

type TabName = 'details' | 'sales' | 'purchases' | 'batches' | 'movements' | 'adjustment';

interface TabConfig {
  id: TabName;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DETAIL_TABS: readonly TabConfig[] = [
  { id: 'details', label: 'Detalles', icon: Package },
  { id: 'batches', label: 'Lotes', icon: Boxes },
  { id: 'sales', label: 'Ventas', icon: ShoppingCart },
  { id: 'purchases', label: 'Compras', icon: Truck },
  { id: 'movements', label: 'Movimientos', icon: ClipboardList },
];

export interface ProductDetailModalProps {
  product: ProductDTO | ProductEntity | null;
  isOpen: boolean;
  onClose: () => void;
  categories?: any[];
  uploadedImages?: any[];
  selectedBranchId: string;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  categories = [],
  uploadedImages = [],
  selectedBranchId,
}) => {
  const { can } = usePermissions();
  const canAdjustStock = can(APP_PERMISSIONS.PRODUCTS_ADJUST_STOCK);
  const canPrintBarcodes = can(APP_PERMISSIONS.PRODUCTS_PRINT_BARCODES);

  const [tab, setTab] = useState<TabName>('details');
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');

  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [barcodeQueue, setBarcodeQueue] = useState<BarcodeLabelItem[]>([]);

  const productId = product?.id || '';
  const { product: fullProduct } = useProductDetail(productId, isOpen && Boolean(productId));
  const detailProduct = fullProduct || product;

  const variants = useMemo(() => {
    return detailProduct?.variants || [];
  }, [detailProduct]);

  useEffect(() => {
    if (variants.length > 0) {
      const exists = variants.some((v: any) => v.id === selectedVariantId);
      if (!exists && variants[0]?.id) {
        setSelectedVariantId(variants[0].id);
      }
    } else {
      setSelectedVariantId('');
    }
  }, [variants, selectedVariantId]);

  useEffect(() => {
    if (isOpen) {
      setTab('details');
    }
  }, [isOpen, productId]);

  const activeVariantId = selectedVariantId || variants[0]?.id || '';
  const activeVariant = variants.find((v: any) => v.id === activeVariantId) || variants[0];
  const effectiveBranchId = selectedBranchId || undefined;

  const allImages = useMemo(() => {
    if (!detailProduct) return [];
    const map = new Map<string, { id: string; url: string }>();

    if (activeVariant?.images && activeVariant.images.length > 0) {
      activeVariant.images.forEach((img: any) => {
        if (img?.id) map.set(img.id, { id: img.id, url: img.url || '' });
      });
    }

    if ((detailProduct as any).images) {
      (detailProduct as any).images.forEach((img: any) => {
        if (img?.id && !map.has(img.id)) map.set(img.id, { id: img.id, url: img.url || '' });
      });
    }

    if (uploadedImages && uploadedImages.length > 0) {
      if ((detailProduct as any).imageIds) {
        (detailProduct as any).imageIds.forEach((id: string) => {
          if (!map.has(id)) {
            const found = uploadedImages.find((item: any) => item.id === id);
            if (found) map.set(id, { id, url: found.url });
          }
        });
      }
      variants.forEach((variant: any) => {
        if (variant.imageIds) {
          variant.imageIds.forEach((id: string) => {
            if (!map.has(id)) {
              const found = uploadedImages.find((item: any) => item.id === id);
              if (found) map.set(id, { id, url: found.url });
            }
          });
        }
      });
    }

    return Array.from(map.values()).filter((img) => Boolean(img.url));
  }, [detailProduct, variants, activeVariant, uploadedImages]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [activeVariantId]);

  const totalStockSucursal = useMemo(() => {
    return variants.reduce(
      (total: number, variant: ProductVariantDTO) =>
        total + Number(variant.stocks?.find((stock) => stock.branchId === selectedBranchId)?.quantity || 0),
      0
    );
  }, [variants, selectedBranchId]);

  const categoryName = useMemo(() => {
    if (!detailProduct) return 'General';
    if (detailProduct.categoryName) return detailProduct.categoryName;
    if (detailProduct.categoryId && categories) {
      const found = categories.find((c: any) => c.id === detailProduct.categoryId);
      if (found) return found.name;
    }
    return 'General';
  }, [detailProduct, categories]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:max-w-7xl! h-[calc(100vh-2rem)] max-h-230 flex flex-col p-0 gap-0 overflow-hidden rounded-2xl shadow-2xl bg-card border border-border">
        {detailProduct && (
          <>
            <DialogHeader className="shrink-0 px-6 pr-14 py-4 border-b border-border bg-muted/25">
              <div className="flex flex-wrap items-center justify-between gap-3 min-w-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-lg font-bold truncate text-foreground">
                      {detailProduct.name}
                    </DialogTitle>
                    <Badge variant="outline" className="text-[11px] font-mono shrink-0">
                      {activeVariant?.sku || variants[0]?.sku || 'S/SKU'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {detailProduct.description || 'Sin descripción adicional'}
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="flex min-h-0 flex-1 flex-col md:flex-row">
              <aside className="shrink-0 border-b border-border bg-muted/10 p-5 md:w-72 md:border-b-0 md:border-r flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Fotografía del Producto
                  </span>
                  {allImages.length > 1 && (
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      {activeImageIndex + 1} de {allImages.length}
                    </span>
                  )}
                </div>

                {allImages.length > 0 ? (
                  <div className="flex flex-col gap-2.5">
                    <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-border bg-background shadow-xs group">
                      <img
                        src={allImages[activeImageIndex]?.url || allImages[0]?.url}
                        alt={detailProduct.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>

                    {allImages.length > 1 && (
                      <div className="grid grid-cols-4 gap-2 overflow-x-auto py-1">
                        {allImages.map((image, idx) => (
                          <button
                            key={image.id}
                            type="button"
                            onClick={() => setActiveImageIndex(idx)}
                            className={`relative aspect-square rounded-xl overflow-hidden border transition-all cursor-pointer ${
                              activeImageIndex === idx
                                ? 'border-primary ring-2 ring-primary/30'
                                : 'border-border hover:border-primary/50 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img src={image.url} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center w-full aspect-square rounded-2xl border border-dashed border-border bg-background/50 text-muted-foreground/60 gap-2">
                    <Package className="w-12 h-12" />
                    <span className="text-xs font-medium">Sin imagen</span>
                  </div>
                )}

                <div className="mt-auto pt-3 border-t border-border space-y-2 text-xs">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Stock en Sucursal:</span>
                    <strong className="text-foreground font-semibold font-mono">{totalStockSucursal} pzs</strong>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Precio de Venta:</span>
                    <strong className="text-foreground font-bold font-mono text-sm text-primary">
                      ${Number(activeVariant?.salePrice || 0).toFixed(2)}
                    </strong>
                  </div>
                </div>
              </aside>

              <Tabs
                value={tab}
                onValueChange={(value) => setTab(value as TabName)}
                className="flex min-h-0 min-w-0 flex-1 flex-col"
              >
                <TabsList className="mx-6 mt-4 w-fit shrink-0 bg-muted/40 p-1">
                  {DETAIL_TABS.map(({ id, label, icon: Icon }) => (
                    <TabsTrigger key={id} value={id} className="gap-1.5 text-xs">
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </TabsTrigger>
                  ))}
                  {canAdjustStock && (
                    <TabsTrigger value="adjustment" className="gap-1.5 text-xs">
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      Ajuste
                    </TabsTrigger>
                  )}
                </TabsList>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                  <TabsContent value="details" className="mt-0 space-y-5">
                    <ProductDetailInfoTab
                      detailProduct={detailProduct}
                      variants={variants}
                      activeVariantId={activeVariantId}
                      categoryName={categoryName}
                      totalStockSucursal={totalStockSucursal}
                      selectedBranchId={selectedBranchId}
                      canPrintBarcodes={canPrintBarcodes}
                      onSelectVariant={(variantId) => {
                        setSelectedVariantId(variantId);
                      }}
                      onPrintBarcode={(item) => {
                        setBarcodeQueue([item]);
                        setBarcodeModalOpen(true);
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="batches" className="mt-0 space-y-4">
                    {tab === 'batches' && (
                      <ProductDetailBatchesTab
                        activeVariantId={activeVariantId}
                        selectedBranchId={effectiveBranchId}
                      />
                    )}
                  </TabsContent>

                  <TabsContent value="sales" className="mt-0 space-y-4">
                    {tab === 'sales' && (
                      <ProductDetailSalesTab
                        activeVariantId={activeVariantId}
                        selectedBranchId={effectiveBranchId}
                      />
                    )}
                  </TabsContent>

                  <TabsContent value="purchases" className="mt-0 space-y-4">
                    {tab === 'purchases' && (
                      <ProductDetailPurchasesTab
                        activeVariantId={activeVariantId}
                        selectedBranchId={effectiveBranchId}
                      />
                    )}
                  </TabsContent>

                  <TabsContent value="movements" className="mt-0 space-y-4">
                    {tab === 'movements' && (
                      <ProductDetailMovementsTab
                        activeVariantId={activeVariantId}
                        activeSku={activeVariant?.sku}
                        selectedBranchId={effectiveBranchId}
                      />
                    )}
                  </TabsContent>

                  {canAdjustStock && (
                    <TabsContent value="adjustment" className="mt-0">
                      {tab === 'adjustment' && (
                        <StockAdjustmentForm
                          product={detailProduct}
                          selectedBranchId={selectedBranchId}
                          selectedVariantId={activeVariantId}
                        />
                      )}
                    </TabsContent>
                  )}
                </div>
              </Tabs>
            </div>
          </>
        )}
      </DialogContent>

      <BarcodePrintModal
        isOpen={barcodeModalOpen}
        onClose={() => setBarcodeModalOpen(false)}
        items={barcodeQueue}
        onUpdateItems={setBarcodeQueue}
      />
    </Dialog>
  );
};

export default ProductDetailModal;
