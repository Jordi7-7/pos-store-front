import React, { useState } from 'react';
import { Package, Edit, Search, Barcode, CheckSquare, Square } from 'lucide-react';
import type { Product } from '../services/products.service';
import { ProductEditDrawer } from './ProductEditDrawer';
import { ProductDetailModal } from './ProductDetailModal';
import { BarcodePrintModal, type BarcodeLabelItem } from './barcode-printer/BarcodePrintModal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductPagination } from './ProductPagination';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ProductListTabProps {
  products: Product[];
  isLoading: boolean;
  categories: any[];
  uploadedImages: any[];
  selectedBranchId: string;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  search: string;
  onSearchChange: (search: string) => void;
}

import { usePermissions } from '@/hooks/usePermissions';
import { APP_PERMISSIONS } from '@/constants/permissions';

export const ProductListTab: React.FC<ProductListTabProps> = ({
  products,
  isLoading,
  categories,
  uploadedImages,
  selectedBranchId,
  meta,
  onPageChange,
  onLimitChange,
  search,
  onSearchChange
}) => {
  const { can } = usePermissions();
  const canEdit = can(APP_PERMISSIONS.PRODUCTS_EDIT);
  const canPrintBarcodes = can(APP_PERMISSIONS.PRODUCTS_PRINT_BARCODES);

  const [selectedProductToEdit, setSelectedProductToEdit] = useState<any | null>(null);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(search);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Estado para selección masiva de etiquetas: Guardar Map<productId, Product> para persistir entre búsquedas y páginas
  const [selectedProductsMap, setSelectedProductsMap] = useState<Map<string, Product>>(new Map());
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [barcodeQueue, setBarcodeQueue] = useState<BarcodeLabelItem[]>([]);

  const handleOpenEditDrawer = (product: any) => {
    if (!canEdit) return;
    setSelectedProductToEdit(product);
    setIsEditDrawerOpen(true);
  };

  const handleCloseEditDrawer = () => {
    setIsEditDrawerOpen(false);
    setSelectedProductToEdit(null);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(searchInput.trim());
    onPageChange(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    onSearchChange('');
    onPageChange(1);
  };

  // Toggle selección de un producto: Guarda el objeto completo
  const toggleSelectProduct = (product: Product, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedProductsMap((prev) => {
      const next = new Map(prev);
      if (next.has(product.id)) {
        next.delete(product.id);
      } else {
        next.set(product.id, product);
      }
      return next;
    });
  };

  // Toggle seleccionar todos los visibles en la página actual
  const toggleSelectAllPage = () => {
    const allCurrentPageSelected = products.length > 0 && products.every((p) => selectedProductsMap.has(p.id));
    setSelectedProductsMap((prev) => {
      const next = new Map(prev);
      if (allCurrentPageSelected) {
        products.forEach((p) => next.delete(p.id));
      } else {
        products.forEach((p) => next.set(p.id, p));
      }
      return next;
    });
  };

  // Abrir modal de impresión con todos los productos seleccionados acumulados
  const handleOpenMassPrint = () => {
    const selectedProds = Array.from(selectedProductsMap.values());
    const itemsToPrint: BarcodeLabelItem[] = [];

    selectedProds.forEach((prod) => {
      const variants = prod.variants && prod.variants.length > 0 ? prod.variants : [];
      if (variants.length > 0) {
        variants.forEach((v: any) => {
          itemsToPrint.push({
            sku: v.sku || 'SIN-SKU',
            name: prod.name,
            price: Number(v.salePrice || 0),
            quantity: 1,
          });
        });
      } else {
        itemsToPrint.push({
          sku: 'SIN-SKU',
          name: prod.name,
          price: 0,
          quantity: 1,
        });
      }
    });

    setBarcodeQueue(itemsToPrint);
    setBarcodeModalOpen(true);
  };

  // Imprimir un solo producto desde el botón de la fila
  const handlePrintSingleProduct = (product: Product, event: React.MouseEvent) => {
    event.stopPropagation();
    const variants = product.variants && product.variants.length > 0 ? product.variants : [];
    const itemsToPrint: BarcodeLabelItem[] = [];

    if (variants.length > 0) {
      variants.forEach((v: any) => {
        itemsToPrint.push({
          sku: v.sku || 'SIN-SKU',
          name: product.name,
          price: Number(v.salePrice || 0),
          quantity: 1,
        });
      });
    } else {
      itemsToPrint.push({
        sku: 'SIN-SKU',
        name: product.name,
        price: 0,
        quantity: 1,
      });
    }

    setBarcodeQueue(itemsToPrint);
    setBarcodeModalOpen(true);
  };

  const isAllSelected = products.length > 0 && products.every((p) => selectedProductsMap.has(p.id));

  return (
    <Card className="border border-border/80 shadow-xs">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-bold">Catálogo de Productos ({meta.total})</CardTitle>
            <CardDescription className="text-xs">Visualiza y edita los productos de tu inventario.</CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Botón de impresión masiva cuando hay seleccionados */}
            {canPrintBarcodes && selectedProductsMap.size > 0 && (
              <Button
                type="button"
                size="sm"
                onClick={handleOpenMassPrint}
                className="text-xs h-9 gap-1.5 font-bold bg-primary text-white shadow-sm cursor-pointer animate-fade-in"
              >
                <Barcode className="w-4 h-4" />
                Imprimir Etiquetas ({selectedProductsMap.size})
              </Button>
            )}

            <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 md:w-80">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Buscar por nombre, SKU o código de barras..."
                  className="pl-9 pr-8 text-xs h-9"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 top-2 text-xs text-muted-foreground hover:text-foreground font-bold"
                  >
                    ×
                  </button>
                )}
              </div>
              <Button type="submit" size="sm" className="text-xs h-9">
                Buscar
              </Button>
            </form>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ProductPagination meta={meta} onPageChange={onPageChange} onLimitChange={onLimitChange} />

        {isLoading ? (
          <div className="space-y-2.5 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 border border-border rounded-xl">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-60" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
            <Package className="w-10 h-10 text-muted-foreground opacity-40" />
            <p className="text-sm text-muted-foreground">No se encontraron productos en esta página.</p>
            {search && (
              <Button variant="link" size="sm" onClick={handleClearSearch} className="text-xs">
                Limpiar filtros de búsqueda
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  {/* Checkbox para seleccionar todos */}
                  <TableHead className="w-[40px] px-3">
                    <button
                      type="button"
                      onClick={toggleSelectAllPage}
                      className="text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-center"
                      title={isAllSelected ? 'Deseleccionar todos en esta página' : 'Seleccionar todos en esta página'}
                    >
                      {isAllSelected ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                  <TableHead className="font-semibold text-xs">SKU</TableHead>
                  <TableHead className="font-semibold text-xs">Producto</TableHead>
                  <TableHead className="font-semibold text-xs">Cód. Barras</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Compra</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Venta</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Precio Mayoreo</TableHead>
                  <TableHead className="font-semibold text-xs text-center">Stock Sucursal</TableHead>
                  <TableHead className="w-[80px] text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const defaultVariant = product.variants?.[0];
                  const purchasePrice = defaultVariant?.purchasePrice ?? 0;
                  const salePrice = defaultVariant?.salePrice ?? 0;
                  const wholesalePrice = defaultVariant?.wholesalePrice;
                  const sku = defaultVariant?.sku ?? 'N/A';
                  const barcode = defaultVariant?.barcode ?? 'N/A';
                  const currentStock = defaultVariant?.stocks?.find(s => s.branchId === selectedBranchId)?.quantity ?? 0;
                  const isSelected = selectedProductsMap.has(product.id);

                  return (
                    <TableRow 
                      key={product.id} 
                      onClick={() => setSelectedProduct(product)} 
                      className={`hover:bg-muted/30 cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/5' : ''
                      }`}
                    >
                      {/* Checkbox individual */}
                      <TableCell className="py-2.5 px-3" onClick={(e) => toggleSelectProduct(product, e)}>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-center"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </TableCell>

                      {/* Image Thumbnail */}
                      <TableCell className="py-2.5">
                        <div className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                          {product.imageIds && product.imageIds.length > 0 ? (
                            (() => {
                              const imgObj = uploadedImages.find(img => img.id === product.imageIds[0]);
                              return imgObj ? (
                                <img src={imgObj.url} className="w-full h-full object-cover" alt={product.name} />
                              ) : (
                                <Package className="w-4 h-4 text-muted-foreground" />
                              );
                            })()
                          ) : (
                            <Package className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>

                      {/* SKU */}
                      <TableCell className="py-2.5 font-mono text-[11px] text-primary font-bold">
                        {sku}
                      </TableCell>

                      {/* Product details */}
                      <TableCell className="py-2.5">
                        <div className="font-semibold text-xs text-foreground leading-tight truncate max-w-[200px]" title={product.name}>
                          {product.name}
                        </div>
                        {product.description && (
                          <div className="text-[10px] text-muted-foreground truncate max-w-[200px]" title={product.description}>
                            {product.description}
                          </div>
                        )}
                      </TableCell>

                      {/* Barcode */}
                      <TableCell className="py-2.5 font-mono text-[11px] text-muted-foreground">
                        {barcode}
                      </TableCell>

                      {/* Purchase Price */}
                      <TableCell className="py-2.5 text-right font-mono text-xs">
                        ${purchasePrice.toFixed(2)}
                      </TableCell>

                      {/* Sale Price */}
                      <TableCell className="py-2.5 text-right font-mono text-xs font-semibold text-foreground">
                        ${salePrice.toFixed(2)}
                      </TableCell>

                      {/* Wholesale Price */}
                      <TableCell className="py-2.5 text-right font-mono text-xs font-semibold text-foreground">
                        {wholesalePrice !== null && wholesalePrice !== undefined && Number(wholesalePrice) > 0 ? (
                          `$${Number(wholesalePrice).toFixed(2)}`
                        ) : (
                          <span className="text-muted-foreground/50 text-[11px]">—</span>
                        )}
                      </TableCell>

                      {/* Stock */}
                      <TableCell className="py-2.5 text-center">
                        <Badge
                          variant={currentStock > 0 ? 'secondary' : 'destructive'}
                          className="font-bold font-mono text-[10px]"
                        >
                          {currentStock} pzs
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Botón imprimir etiqueta individual */}
                          {canPrintBarcodes && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(event) => handlePrintSingleProduct(product, event)}
                              title="Imprimir Código de Barras"
                              className="h-8 w-8 text-primary hover:bg-primary/10 cursor-pointer"
                            >
                              <Barcode className="w-4 h-4" />
                            </Button>
                          )}

                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(event) => { event.stopPropagation(); handleOpenEditDrawer(product); }}
                              title="Editar Ficha de Producto"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

      </CardContent>

      <ProductEditDrawer
        product={selectedProductToEdit}
        isOpen={isEditDrawerOpen}
        onClose={handleCloseEditDrawer}
        categories={categories}
        uploadedImages={uploadedImages}
        selectedBranchId={selectedBranchId}
      />
      <ProductDetailModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        uploadedImages={uploadedImages}
        selectedBranchId={selectedBranchId}
      />

      {/* Modal de Impresión Térmica de Códigos de Barras */}
      <BarcodePrintModal
        isOpen={barcodeModalOpen}
        onClose={() => setBarcodeModalOpen(false)}
        items={barcodeQueue}
        onUpdateItems={setBarcodeQueue}
      />
    </Card>
  );
};
