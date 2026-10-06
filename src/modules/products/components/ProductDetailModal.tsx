import React, { useEffect, useState, useMemo } from 'react';
import type {
  Product,
  ProductVariant,
  ProductHistorySale,
  ProductHistoryPurchase,
  InventoryMovement,
  VariantBatchItem,
} from '../services/products.service';
import {
  useInventoryMovementsByVariant,
  useProductDetail,
  useVariantPurchases,
  useVariantSales,
  useVariantBatches,
} from '../hooks/useProducts';
import { ProductPagination } from './ProductPagination';
import { StockAdjustmentForm } from './StockAdjustmentForm';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  Package, 
  ShoppingCart, 
  Truck, 
  ClipboardList, 
  SlidersHorizontal, 
  Barcode, 
  Boxes,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Tag as TagIcon
} from 'lucide-react';
import { BarcodePrintModal, type BarcodeLabelItem } from './barcode-printer/BarcodePrintModal';
import { usePermissions } from '@/hooks/usePermissions';
import { APP_PERMISSIONS } from '@/constants/permissions';

type TabName = 'details' | 'sales' | 'purchases' | 'batches' | 'movements' | 'adjustment';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  categories?: any[];
  uploadedImages?: any[];
  selectedBranchId: string;
}

function LoadingRows() {
  return (
    <div className="py-16 flex flex-col items-center justify-center gap-2">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
      <span className="text-xs text-muted-foreground font-medium">Cargando información...</span>
    </div>
  );
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  categories = [],
  uploadedImages,
  selectedBranchId,
}) => {
  const { can } = usePermissions();
  const canAdjustStock = can(APP_PERMISSIONS.PRODUCTS_ADJUST_STOCK);
  const canPrintBarcodes = can(APP_PERMISSIONS.PRODUCTS_PRINT_BARCODES);

  const [tab, setTab] = useState<TabName>('details');
  const [pages, setPages] = useState({ sales: 1, purchases: 1, batches: 1, movements: 1 });
  const [pageSize, setPageSize] = useState(10);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');

  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [barcodeQueue, setBarcodeQueue] = useState<BarcodeLabelItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTab('details');
      setPages({ sales: 1, purchases: 1, batches: 1, movements: 1 });
      setPageSize(10);
    }
  }, [isOpen, product?.id]);

  const { product: fetchedProduct } = useProductDetail(product?.id, isOpen && tab === 'details');
  const detailProduct = fetchedProduct || product;
  const variants = detailProduct?.variants || [];

  const categoryName = useMemo(() => {
    if (!detailProduct) return 'Sin categoría';
    if (detailProduct.category?.name) return detailProduct.category.name;
    if (detailProduct.categoryId && categories.length > 0) {
      const match = categories.find((c: any) => c.id === detailProduct.categoryId);
      if (match?.name) return match.name;
    }
    return detailProduct.category?.name || 'Sin categoría';
  }, [detailProduct, categories]);

  // Variante activa por defecto (la primera si no hay seleccionada)
  useEffect(() => {
    if (variants.length > 0 && (!selectedVariantId || !variants.some((v: any) => v.id === selectedVariantId))) {
      setSelectedVariantId(variants[0].id || '');
    }
  }, [variants, selectedVariantId]);

  const activeVariantId = selectedVariantId || variants[0]?.id || '';
  const activeVariant = variants.find((v: any) => v.id === activeVariantId) || variants[0];

  // Queries basadas en variantId
  const { sales, meta: salesMeta, isLoading: isLoadingSales } = useVariantSales(
    activeVariantId,
    pages.sales,
    pageSize,
    isOpen && tab === 'sales' && Boolean(activeVariantId)
  );

  const { purchases, meta: purchasesMeta, isLoading: isLoadingPurchases } = useVariantPurchases(
    activeVariantId,
    pages.purchases,
    pageSize,
    isOpen && tab === 'purchases' && Boolean(activeVariantId)
  );

  const { batches, meta: batchesMeta, isLoading: isLoadingBatches } = useVariantBatches(
    activeVariantId,
    pages.batches,
    pageSize,
    undefined,
    isOpen && tab === 'batches' && Boolean(activeVariantId)
  );

  const { movements, meta: movementsMeta, isLoading: isLoadingMovements } = useInventoryMovementsByVariant(
    activeVariantId,
    pages.movements,
    pageSize
  );

  // Imágenes consolidadas
  const allImages = useMemo(() => {
    if (!detailProduct) return [];
    const map = new Map<string, { id: string; url: string }>();

    if ((detailProduct as any).images) {
      (detailProduct as any).images.forEach((img: any) => {
        if (img?.id) map.set(img.id, { id: img.id, url: img.url || '' });
      });
    }

    variants.forEach((variant: any) => {
      if (variant.images) {
        variant.images.forEach((img: any) => {
          if (img?.id) map.set(img.id, { id: img.id, url: img.url || '' });
        });
      }
    });

    if (uploadedImages && uploadedImages.length > 0) {
      if (detailProduct.imageIds) {
        detailProduct.imageIds.forEach((id: string) => {
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
  }, [detailProduct, variants, uploadedImages]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // KPIs calculados
  const totalStockSucursal = useMemo(() => {
    return variants.reduce(
      (total: number, variant: ProductVariant) =>
        total + Number(variant.stocks?.find((stock) => stock.branchId === selectedBranchId)?.quantity || 0),
      0
    );
  }, [variants, selectedBranchId]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:max-w-7xl! h-[calc(100vh-2rem)] max-h-230 flex flex-col p-0 gap-0 overflow-hidden rounded-2xl shadow-2xl bg-card border border-border">
        {detailProduct && (
          <>
            {/* Header */}
            <DialogHeader className="shrink-0 px-6 py-4 border-b border-border bg-muted/25">
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

                {variants.length > 1 && (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Variante:
                    </span>
                    <select
                      value={activeVariantId}
                      onChange={(e) => {
                        setSelectedVariantId(e.target.value);
                        setPages({ sales: 1, purchases: 1, batches: 1, movements: 1 });
                      }}
                      className="bg-background border border-border text-foreground text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {variants.map((v: any) => {
                        const attrs = (v.attributeValues || []).map((av: any) => av.value).join(' / ');
                        return (
                          <option key={v.id} value={v.id}>
                            {v.sku} {attrs ? `(${attrs})` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
              </div>
            </DialogHeader>

            {/* Main Container */}
            <div className="flex min-h-0 flex-1 flex-col md:flex-row">
              {/* Columna Lateral de Imágenes */}
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

                {/* Vista Principal de la Imagen */}
                {allImages.length > 0 ? (
                  <div className="flex flex-col gap-2.5">
                    {/* Imagen principal prominente */}
                    <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-border bg-background shadow-xs group">
                      <img
                        src={allImages[activeImageIndex]?.url || allImages[0]?.url}
                        alt={detailProduct.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>

                    {/* Galería de miniaturas solo si hay más de 1 imagen */}
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

                {/* Resumen rápido debajo de la imagen */}
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

              {/* Contenedor de Tabs y Vistas */}
              <Tabs
                value={tab}
                onValueChange={(value) => setTab(value as TabName)}
                className="flex min-h-0 min-w-0 flex-1 flex-col"
              >
                <TabsList className="mx-6 mt-4 w-fit shrink-0 bg-muted/40 p-1">
                  <TabsTrigger value="details" className="gap-1.5 text-xs">
                    <Package className="w-3.5 h-3.5" />
                    Detalles
                  </TabsTrigger>
                  <TabsTrigger value="batches" className="gap-1.5 text-xs">
                    <Boxes className="w-3.5 h-3.5" />
                    Lotes
                  </TabsTrigger>
                  <TabsTrigger value="sales" className="gap-1.5 text-xs">
                    <ShoppingCart className="w-3.5 h-3.5" />
                    Ventas
                  </TabsTrigger>
                  <TabsTrigger value="purchases" className="gap-1.5 text-xs">
                    <Truck className="w-3.5 h-3.5" />
                    Compras
                  </TabsTrigger>
                  <TabsTrigger value="movements" className="gap-1.5 text-xs">
                    <ClipboardList className="w-3.5 h-3.5" />
                    Movimientos
                  </TabsTrigger>
                  {canAdjustStock && (
                    <TabsTrigger value="adjustment" className="gap-1.5 text-xs">
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      Ajuste
                    </TabsTrigger>
                  )}
                </TabsList>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                  {/* TAB 1: DETALLES */}
                  <TabsContent value="details" className="mt-0 space-y-5">
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
                        <strong className="text-sm font-mono mt-0.5 block">{variants[0]?.sku || 'N/A'}</strong>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border overflow-hidden bg-card shadow-2xs">
                      <div className="px-4 py-3 bg-muted/30 border-b border-border text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Variantes y Precios
                      </div>
                      <div className="divide-y divide-border">
                        {variants.map((variant: ProductVariant) => (
                          <div
                            key={variant.id || variant.sku}
                            className={`grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-4 py-3 text-xs transition-colors ${
                              variant.id === activeVariantId ? 'bg-primary/5' : 'hover:bg-muted/20'
                            }`}
                          >
                            <div>
                              <span className="font-mono font-bold text-primary block">{variant.sku}</span>
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
                            <Badge variant="secondary" className="font-mono">
                              {variant.stocks?.find((stock) => stock.branchId === selectedBranchId)?.quantity || 0} pzs
                            </Badge>
                            {canPrintBarcodes && (
                              <button
                                type="button"
                                onClick={() => {
                                  setBarcodeQueue([
                                    {
                                      sku: variant.sku || 'SIN-SKU',
                                      name: detailProduct.name,
                                      price: Number(variant.salePrice || 0),
                                      quantity: 1,
                                    },
                                  ]);
                                  setBarcodeModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-all cursor-pointer"
                                title="Imprimir Código de Barras Térmico"
                              >
                                <Barcode className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* TAB 2: LOTES (BATCHES) */}
                  <TabsContent value="batches" className="mt-0 space-y-4">
                    <ProductPagination
                      meta={batchesMeta}
                      onPageChange={(page) => setPages((value) => ({ ...value, batches: page }))}
                      onLimitChange={(nextLimit) => {
                        setPageSize(nextLimit);
                        setPages((value) => ({ ...value, batches: 1 }));
                      }}
                    />

                    {isLoadingBatches ? (
                      <LoadingRows />
                    ) : batches.length === 0 ? (
                      <div className="py-16 text-center space-y-2 border border-dashed border-border rounded-xl">
                        <Boxes className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                        <p className="text-sm font-medium text-muted-foreground">
                          No hay lotes registrados para esta variante.
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                          Los lotes se generan automáticamente al realizar compras o aperturas de inventario.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-2xs">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead>
                              <tr className="border-b border-border bg-muted/40 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                <th className="px-4 py-3">Lote / Referencia</th>
                                <th className="px-4 py-3">Sucursal</th>
                                <th className="px-4 py-3">Fecha Ingreso</th>
                                <th className="px-4 py-3 text-right">Inicial</th>
                                <th className="px-4 py-3 text-right">Consumido</th>
                                <th className="px-4 py-3 text-right">Quedan</th>
                                <th className="px-4 py-3 text-right">Costo Unit.</th>
                                <th className="px-4 py-3 text-center">Estado</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {batches.map((batch: VariantBatchItem) => {
                                const percentRemaining =
                                  batch.initialQuantity > 0
                                    ? Math.round((batch.remainingQuantity / batch.initialQuantity) * 100)
                                    : 0;

                                return (
                                  <tr key={batch.id} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-3 font-medium">
                                      <div className="font-mono font-bold text-primary">{batch.batchCode}</div>
                                      <div className="text-[10.5px] text-muted-foreground">{batch.originLabel}</div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{batch.branchName}</td>
                                    <td className="px-4 py-3 text-muted-foreground font-mono">
                                      {new Date(batch.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-semibold">
                                      {batch.initialQuantity}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                                      {batch.consumedQuantity}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <div className="font-mono font-bold text-foreground">
                                        {batch.remainingQuantity} pzs
                                      </div>
                                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden ml-auto mt-1">
                                        <div
                                          className={`h-full rounded-full ${
                                            batch.remainingQuantity > 0 ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                                          }`}
                                          style={{ width: `${percentRemaining}%` }}
                                        />
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-semibold">
                                      ${Number(batch.unitCost).toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <Badge
                                        variant={batch.status === 'ACTIVE' ? 'default' : 'secondary'}
                                        className={
                                          batch.status === 'ACTIVE'
                                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                            : 'text-muted-foreground'
                                        }
                                      >
                                        {batch.status === 'ACTIVE' ? 'Activo' : 'Agotado'}
                                      </Badge>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* TAB 3: VENTAS */}
                  <TabsContent value="sales" className="mt-0 space-y-4">
                    <ProductPagination
                      meta={salesMeta}
                      onPageChange={(page) => setPages((value) => ({ ...value, sales: page }))}
                      onLimitChange={(nextLimit) => {
                        setPageSize(nextLimit);
                        setPages((value) => ({ ...value, sales: 1 }));
                      }}
                    />

                    {isLoadingSales ? (
                      <LoadingRows />
                    ) : sales.length === 0 ? (
                      <div className="py-16 text-center space-y-2 border border-dashed border-border rounded-xl">
                        <ShoppingCart className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                        <p className="text-sm font-medium text-muted-foreground">
                          No hay ventas registradas para esta variante.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-2xs">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead>
                              <tr className="border-b border-border bg-muted/40 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                <th className="px-4 py-3">Factura / Ticket</th>
                                <th className="px-4 py-3">Fecha y Hora</th>
                                <th className="px-4 py-3">Cliente</th>
                                <th className="px-4 py-3 text-right">Cant. Vendida</th>
                                <th className="px-4 py-3 text-right">Precio Venta</th>
                                <th className="px-4 py-3 text-right">Total Factura</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {sales.map((sale: ProductHistorySale) => {
                                const matchingItem = sale.items?.find(
                                  (it: any) => it.variant?.id === activeVariantId || it.variantId === activeVariantId
                                ) || sale.items?.[0];
                                const soldQty = matchingItem ? Number(matchingItem.quantity) : 1;
                                const soldPrice = matchingItem ? Number(matchingItem.price) : Number(sale.total);

                                return (
                                  <tr key={sale.id} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-3 font-mono font-bold text-primary">
                                      {sale.invoiceNumber || 'S/Ref'}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground font-mono">
                                      {new Date(sale.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-foreground font-medium">
                                      {sale.customer?.name || 'Consumidor Final'}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-bold">
                                      <Badge variant="outline" className="font-mono">
                                        {soldQty} pzs
                                      </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-semibold text-muted-foreground">
                                      ${soldPrice.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                                      ${Number(sale.total || 0).toFixed(2)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* TAB 4: COMPRAS */}
                  <TabsContent value="purchases" className="mt-0 space-y-4">
                    <ProductPagination
                      meta={purchasesMeta}
                      onPageChange={(page) => setPages((value) => ({ ...value, purchases: page }))}
                      onLimitChange={(nextLimit) => {
                        setPageSize(nextLimit);
                        setPages((value) => ({ ...value, purchases: 1 }));
                      }}
                    />

                    {isLoadingPurchases ? (
                      <LoadingRows />
                    ) : purchases.length === 0 ? (
                      <div className="py-16 text-center space-y-2 border border-dashed border-border rounded-xl">
                        <Truck className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                        <p className="text-sm font-medium text-muted-foreground">
                          No hay compras registradas para esta variante.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-2xs">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead>
                              <tr className="border-b border-border bg-muted/40 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                <th className="px-4 py-3">Factura / Orden</th>
                                <th className="px-4 py-3">Fecha Compra</th>
                                <th className="px-4 py-3">Proveedor</th>
                                <th className="px-4 py-3 text-right">Cant. Comprada</th>
                                <th className="px-4 py-3 text-right">Costo Unit.</th>
                                <th className="px-4 py-3 text-right">Total Orden</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {purchases.map((purchase: ProductHistoryPurchase) => {
                                const matchingItem = purchase.items?.find(
                                  (it: any) => it.variant?.id === activeVariantId || it.variantId === activeVariantId
                                ) || purchase.items?.[0];
                                const purchaseQty = matchingItem ? Number(matchingItem.quantity) : 1;
                                const unitCost = matchingItem ? Number(matchingItem.unitPrice) : 0;

                                return (
                                  <tr key={purchase.id} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-3 font-mono font-bold text-primary">
                                      {purchase.invoiceNumber || 'S/Ref'}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground font-mono">
                                      {new Date(purchase.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-foreground font-medium">
                                      {purchase.supplier?.name || 'Proveedor General'}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-bold">
                                      <Badge variant="outline" className="font-mono">
                                        {purchaseQty} pzs
                                      </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-semibold text-muted-foreground">
                                      ${unitCost.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                                      ${Number(purchase.totalAmount || 0).toFixed(2)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* TAB 5: MOVIMIENTOS */}
                  <TabsContent value="movements" className="mt-0 space-y-4">
                    <ProductPagination
                      meta={movementsMeta}
                      onPageChange={(page) => setPages((value) => ({ ...value, movements: page }))}
                      onLimitChange={(nextLimit) => {
                        setPageSize(nextLimit);
                        setPages((value) => ({ ...value, movements: 1 }));
                      }}
                    />

                    {isLoadingMovements ? (
                      <LoadingRows />
                    ) : movements.length === 0 ? (
                      <div className="py-16 text-center space-y-2 border border-dashed border-border rounded-xl">
                        <ClipboardList className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                        <p className="text-sm font-medium text-muted-foreground">
                          No hay movimientos registrados para esta variante.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-2xs">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead>
                              <tr className="border-b border-border bg-muted/40 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                <th className="px-4 py-3">Tipo</th>
                                <th className="px-4 py-3">Motivo / Razón</th>
                                <th className="px-4 py-3">Fecha y Hora</th>
                                <th className="px-4 py-3">Variante / SKU</th>
                                <th className="px-4 py-3 text-right">Cantidad</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {movements.map((movement: InventoryMovement) => {
                                const isPositive = movement.type === 'IN' || movement.type === 'INPUT';
                                return (
                                  <tr key={movement.id} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-3">
                                      <Badge
                                        variant="outline"
                                        className={
                                          isPositive
                                            ? 'text-emerald-600 border-emerald-500/30 bg-emerald-500/5'
                                            : 'text-rose-600 border-rose-500/30 bg-rose-500/5'
                                        }
                                      >
                                        {isPositive ? 'Entrada' : 'Salida'}
                                      </Badge>
                                    </td>
                                    <td className="px-4 py-3 font-medium text-foreground">{movement.reason}</td>
                                    <td className="px-4 py-3 font-mono text-muted-foreground">
                                      {new Date(movement.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-muted-foreground">
                                      {movement.variant?.sku || activeVariant?.sku || 'Sin SKU'}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-bold">
                                      <span className={isPositive ? 'text-emerald-600' : 'text-destructive'}>
                                        {isPositive ? '+' : '-'}
                                        {Number(movement.quantity || 0)}
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
                  </TabsContent>

                  {/* TAB 6: AJUSTE DE STOCK */}
                  {canAdjustStock && (
                    <TabsContent value="adjustment" className="mt-0">
                      <StockAdjustmentForm product={detailProduct} selectedBranchId={selectedBranchId} />
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
