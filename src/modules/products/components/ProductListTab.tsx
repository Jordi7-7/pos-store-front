import React, { useState } from 'react';
import { Package, Edit, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '../services/products.service';
import { ProductEditDrawer } from './ProductEditDrawer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  page: number;
  onPageChange: (page: number) => void;
  search: string;
  onSearchChange: (search: string) => void;
}

export const ProductListTab: React.FC<ProductListTabProps> = ({
  products,
  isLoading,
  categories,
  uploadedImages,
  selectedBranchId,
  meta,
  page,
  onPageChange,
  search,
  onSearchChange
}) => {
  const [selectedProductToEdit, setSelectedProductToEdit] = useState<any | null>(null);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(search);

  const handleOpenEditDrawer = (product: any) => {
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

  return (
    <Card className="border border-border/80 shadow-xs">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-bold">Catálogo de Productos ({meta.total})</CardTitle>
            <CardDescription className="text-xs">Visualiza y edita los productos de tu inventario.</CardDescription>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:max-w-md">
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
      </CardHeader>

      <CardContent>
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
                  <TableHead className="w-[80px]"></TableHead>
                  <TableHead className="font-semibold text-xs">Producto</TableHead>
                  <TableHead className="font-semibold text-xs">SKU Propio</TableHead>
                  <TableHead className="font-semibold text-xs">Cód. Barras</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Compra</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Venta</TableHead>
                  <TableHead className="font-semibold text-xs text-center">Stock Sucursal</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const defaultVariant = product.variants?.[0];
                  const purchasePrice = defaultVariant?.purchasePrice ?? 0;
                  const salePrice = defaultVariant?.salePrice ?? 0;
                  const sku = defaultVariant?.sku ?? 'N/A';
                  const barcode = defaultVariant?.barcode ?? 'N/A';
                  const currentStock = defaultVariant?.stocks?.find(s => s.branchId === selectedBranchId)?.quantity ?? 0;

                  return (
                    <TableRow key={product.id} className="hover:bg-muted/30">
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

                      {/* SKU */}
                      <TableCell className="py-2.5 font-mono text-[11px] text-primary font-bold">
                        {sku}
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditDrawer(product)}
                          title="Editar Ficha de Producto"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination Footer */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border pt-4 mt-4">
            <span className="text-[11px] text-muted-foreground">
              Página <span className="font-bold text-foreground">{page}</span> de <span className="font-bold text-foreground">{meta.totalPages}</span> ({meta.total} productos)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1}
                className="h-8 w-8"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(Math.min(meta.totalPages, page + 1))}
                disabled={page === meta.totalPages}
                className="h-8 w-8"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
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
    </Card>
  );
};
