import React, { useEffect, useState } from 'react';
import type { Product } from '../services/products.service';
import { useInventoryMovementsByVariant, useProductDetail, useProductPurchases, useProductSales } from '../hooks/useProducts';
import { ProductPagination } from './ProductPagination';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Package, ShoppingCart, Truck, ClipboardList } from 'lucide-react';

type TabName = 'details' | 'sales' | 'purchases' | 'movements';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  uploadedImages: any[];
  selectedBranchId: string;
}

function LoadingRows() {
  return <div className="py-12 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, isOpen, onClose, uploadedImages, selectedBranchId }) => {
  const [tab, setTab] = useState<TabName>('details');
  const [pages, setPages] = useState({ sales: 1, purchases: 1, movements: 1 });
  const [pageSize, setPageSize] = useState(10);
  const [selectedVariantId, setSelectedVariantId] = useState<string>();

  useEffect(() => {
    if (isOpen) {
      setTab('details');
      setPages({ sales: 1, purchases: 1, movements: 1 });
      setPageSize(10);
    }
  }, [isOpen, product?.id]);

  const { product: fetchedProduct } = useProductDetail(product?.id, isOpen && tab === 'details');
  const { sales, meta: salesMeta, isLoading: isLoadingSales } = useProductSales(product?.id, pages.sales, pageSize, isOpen && tab === 'sales');
  const { purchases, meta: purchasesMeta, isLoading: isLoadingPurchases } = useProductPurchases(product?.id, pages.purchases, pageSize, isOpen && tab === 'purchases');
  const detailProduct = fetchedProduct || product;
  const image = detailProduct?.imageIds?.length ? uploadedImages.find((item) => item.id === detailProduct.imageIds[0]) : undefined;
  const variants = detailProduct?.variants || [];

  useEffect(() => {
    setSelectedVariantId(detailProduct?.variants?.[0]?.id);
  }, [detailProduct?.id]);

  const { movements, meta: movementsMeta, isLoading: isLoadingMovements } = useInventoryMovementsByVariant(
    selectedVariantId,
    pages.movements,
    pageSize,
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:max-w-7xl! h-[calc(100vh-2rem)] max-h-225 flex flex-col p-0 gap-0 overflow-hidden">
        {detailProduct && (
          <>
            <DialogHeader className="shrink-0 px-7 py-5 border-b border-border bg-muted/20">
              <div className="flex items-center gap-4 min-w-0">
                <div className="min-w-0">
                  <DialogTitle className="text-xl truncate">{detailProduct.name}</DialogTitle>
                  <p className="text-sm text-muted-foreground mt-1 truncate">{detailProduct.description || 'Sin descripción'}</p>
                </div>
              </div>
            </DialogHeader>

            <div className="flex min-h-0 flex-1 flex-col md:flex-row">
              <aside className="shrink-0 border-b border-border bg-muted/10 p-5 md:w-64 md:border-b-0 md:border-r">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Imágenes</span>
                  <span className="text-[10px] text-muted-foreground">{detailProduct.imageIds?.length || 0}</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-2 md:content-start md:overflow-y-auto md:pb-0">
                  {(detailProduct.imageIds || []).map((imageId) => {
                    const productImage = uploadedImages.find((item) => item.id === imageId);
                    return productImage ? <img key={imageId} src={productImage.url} alt={detailProduct.name} className="h-24 w-24 shrink-0 rounded-xl border border-border bg-background object-cover md:h-auto md:w-full md:aspect-square" /> : null;
                  })}
                  {!image && <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border border-dashed border-border bg-background md:h-auto md:w-full md:aspect-square"><Package className="w-8 h-8 text-muted-foreground/50" /></div>}
                </div>
              </aside>

              <Tabs value={tab} onValueChange={(value) => setTab(value as TabName)} className="flex min-h-0 min-w-0 flex-1 flex-col">
                <TabsList className="mx-6 mt-4 w-fit shrink-0">
                  <TabsTrigger value="details"><Package className="w-3.5 h-3.5 mr-1.5" />Detalles</TabsTrigger>
                  <TabsTrigger value="sales"><ShoppingCart className="w-3.5 h-3.5 mr-1.5" />Ventas</TabsTrigger>
                  <TabsTrigger value="purchases"><Truck className="w-3.5 h-3.5 mr-1.5" />Compras</TabsTrigger>
                  <TabsTrigger value="movements"><ClipboardList className="w-3.5 h-3.5 mr-1.5" />Movimientos</TabsTrigger>
                </TabsList>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <TabsContent value="details" className="mt-0 space-y-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="rounded-lg border border-border p-3"><span className="text-[10px] uppercase text-muted-foreground block">Categoría</span><strong className="text-sm">{detailProduct.categoryId || 'Sin categoría'}</strong></div>
                    <div className="rounded-lg border border-border p-3"><span className="text-[10px] uppercase text-muted-foreground block">Variantes</span><strong className="text-sm">{variants.length}</strong></div>
                    <div className="rounded-lg border border-border p-3"><span className="text-[10px] uppercase text-muted-foreground block">Stock sucursal</span><strong className="text-sm">{variants.reduce((total, variant) => total + Number(variant.stocks?.find((stock) => stock.branchId === selectedBranchId)?.quantity || 0), 0)}</strong></div>
                    <div className="rounded-lg border border-border p-3"><span className="text-[10px] uppercase text-muted-foreground block">SKU principal</span><strong className="text-sm font-mono">{variants[0]?.sku || 'N/A'}</strong></div>
                  </div>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <div className="px-4 py-3 bg-muted/40 text-xs font-bold uppercase tracking-wide">Variantes y precios</div>
                    <div className="divide-y divide-border">
                      {variants.map((variant) => <div key={variant.id || variant.sku} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-4 py-3 text-xs"><span className="font-mono font-semibold text-primary">{variant.sku}</span><span className="text-muted-foreground">Compra ${Number(variant.purchasePrice || 0).toFixed(2)}</span><span>Venta ${Number(variant.salePrice || 0).toFixed(2)}</span><Badge variant="secondary">{variant.stocks?.find((stock) => stock.branchId === selectedBranchId)?.quantity || 0}</Badge></div>)}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="sales" className="mt-0">
                  <ProductPagination meta={salesMeta} onPageChange={(page) => setPages((value) => ({ ...value, sales: page }))} onLimitChange={(nextLimit) => { setPageSize(nextLimit); setPages((value) => ({ ...value, sales: 1 })); }} />
                  {isLoadingSales ? <LoadingRows /> : sales.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">No hay ventas para este producto.</p> : <div className="space-y-2">{sales.map((sale) => <div key={sale.id} className="border border-border rounded-lg p-3 flex justify-between text-xs"><div><strong className="font-mono">{sale.invoiceNumber || 'S/Ref'}</strong><p className="text-muted-foreground mt-1">{new Date(sale.createdAt).toLocaleString()}</p></div><div className="text-right"><strong>${Number(sale.total || 0).toFixed(2)}</strong><p className="text-muted-foreground mt-1">{sale.customer?.name || 'Consumidor Final'}</p></div></div>)}</div>}
                </TabsContent>

                <TabsContent value="purchases" className="mt-0">
                  <ProductPagination meta={purchasesMeta} onPageChange={(page) => setPages((value) => ({ ...value, purchases: page }))} onLimitChange={(nextLimit) => { setPageSize(nextLimit); setPages((value) => ({ ...value, purchases: 1 })); }} />
                  {isLoadingPurchases ? <LoadingRows /> : purchases.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">No hay compras para este producto.</p> : <div className="space-y-2">{purchases.map((purchase) => <div key={purchase.id} className="border border-border rounded-lg p-3 flex justify-between text-xs"><div><strong className="font-mono">{purchase.invoiceNumber || 'S/Ref'}</strong><p className="text-muted-foreground mt-1">{purchase.supplier?.name || 'Proveedor General'} · {new Date(purchase.createdAt).toLocaleDateString()}</p></div><strong>${Number(purchase.totalAmount || 0).toFixed(2)}</strong></div>)}</div>}
                </TabsContent>

                <TabsContent value="movements" className="mt-0">
                  <ProductPagination meta={movementsMeta} onPageChange={(page) => setPages((value) => ({ ...value, movements: page }))} onLimitChange={(nextLimit) => { setPageSize(nextLimit); setPages((value) => ({ ...value, movements: 1 })); }} />
                  <div className="mb-4 flex items-center gap-3">
                    <label htmlFor="movement-variant" className="text-xs font-semibold text-muted-foreground">Variante</label>
                    <select id="movement-variant" value={selectedVariantId || ''} onChange={(event) => { setSelectedVariantId(event.target.value); setPages((value) => ({ ...value, movements: 1 })); }} className="h-9 min-w-56 rounded-md border border-input bg-background px-3 text-xs">
                      {variants.map((variant) => <option key={variant.id || variant.sku} value={variant.id}>{variant.sku}</option>)}
                    </select>
                  </div>
                  {isLoadingMovements ? <LoadingRows /> : movements.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">No hay movimientos para esta variante.</p> : <div className="space-y-2">{movements.map((movement) => <div key={movement.id} className="border border-border rounded-lg p-3 flex justify-between text-xs"><div><strong>{movement.reason}</strong><p className="text-muted-foreground mt-1">{new Date(movement.createdAt).toLocaleString()} · {movement.variant?.sku || 'Sin SKU'}</p></div><strong className={movement.type === 'IN' || movement.type === 'INPUT' ? 'text-emerald-600' : 'text-destructive'}>{movement.type === 'IN' || movement.type === 'INPUT' ? '+' : '-'}{Number(movement.quantity || 0)}</strong></div>)}</div>}
                </TabsContent>
                </div>
              </Tabs>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailModal;
