import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Package, Edit, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '../services/products.service';
import { ProductEditDrawer } from './ProductEditDrawer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [selectedProductToEdit, setSelectedProductToEdit] = useState<any | null>(null);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(search);

  const toggleExpand = (productId: string) => {
    setExpandedProductId(expandedProductId === productId ? null : productId);
  };

  const handleOpenEditDrawer = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
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
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-sm">Productos Registrados ({meta.total})</CardTitle>
            <CardDescription className="text-xs">Consulta, despliega existencias o edita tus productos.</CardDescription>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar por nombre o SKU..."
                className="pl-9 pr-8 text-xs"
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
            <Button type="submit" size="sm" className="text-xs">
              Buscar
            </Button>
          </form>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border border-border rounded-xl space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-72" />
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
          <div className="space-y-3">
            {products.map((product) => {
              const isExpanded = expandedProductId === product.id;
              const hasMultipleVariants = product.variants.length > 1;
              const totalStock = product.variants.reduce((sum, v) => sum + (v.stocks?.reduce((sSum, s) => sSum + s.quantity, 0) || 0), 0);

              return (
                <div
                  key={product.id}
                  className={`border rounded-xl overflow-hidden transition-all duration-200 ${
                    isExpanded ? 'border-primary/40 bg-muted/30' : 'hover:border-border/80'
                  }`}
                >
                  {/* Product Header Row */}
                  <div
                    onClick={() => toggleExpand(product.id)}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                        {(product as any).images && (product as any).images.length > 0 ? (
                          <img src={(product as any).images[0].url} className="w-full h-full object-cover" alt={product.name} />
                        ) : (
                          <Package className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-secondary truncate">{product.name}</h5>
                        <p className="text-[10px] text-muted-foreground truncate max-w-md mt-0.5">{product.description || 'Sin descripción'}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 text-[11px]">
                      <div className="text-right">
                        <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">Variantes</span>
                        <span className="font-semibold">{product.variants.length}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">Stock Total</span>
                        <Badge variant={totalStock > 0 ? 'secondary' : 'destructive'} className="text-[10px] font-bold h-5">
                          {totalStock} pzs
                        </Badge>
                      </div>
                      <div className="text-right">
                        <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">Precio</span>
                        <span className="font-bold text-primary text-xs">
                          {hasMultipleVariants
                            ? `$${Math.min(...product.variants.map(v => v.salePrice)).toFixed(2)} – $${Math.max(...product.variants.map(v => v.salePrice)).toFixed(2)}`
                            : `$${(product.variants[0]?.salePrice || 0).toFixed(2)}`
                          }
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pl-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => handleOpenEditDrawer(e, product)}
                          title="Editar Ficha de Producto"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <div className="text-muted-foreground">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Product Variants Details */}
                  {isExpanded && (
                    <div className="border-t border-border bg-muted/20 p-4 space-y-3">
                      <div className="overflow-x-auto">
                        <table className="w-full text-[10px] text-left">
                          <thead>
                            <tr className="text-muted-foreground border-b border-border/50">
                              <th className="pb-2 font-semibold">SKU</th>
                              <th className="pb-2 font-semibold">Código de Barras</th>
                              <th className="pb-2 font-semibold">Precios</th>
                              <th className="pb-2 font-semibold">Atributos / Variación</th>
                              <th className="pb-2 font-semibold text-right">Stock</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/30">
                            {product.variants.map((v, idx) => {
                              const varStock = v.stocks?.find(s => s.branchId === selectedBranchId)?.quantity || 0;
                              return (
                                <tr key={idx} className="hover:bg-muted/30">
                                  <td className="py-2.5 font-mono text-foreground">{v.sku}</td>
                                  <td className="py-2.5 font-mono text-foreground">{v.barcode || 'N/A'}</td>
                                  <td className="py-2.5">
                                    <span className="block text-muted-foreground text-[9px]">Compra: ${v.purchasePrice.toFixed(2)}</span>
                                    <span className="block text-primary font-bold">Venta: ${v.salePrice.toFixed(2)}</span>
                                  </td>
                                  <td className="py-2.5">
                                    {v.attributeValues && v.attributeValues.length > 0 ? (
                                      <div className="flex flex-wrap gap-1">
                                        {v.attributeValues.map((av: any, aIdx: number) => (
                                          <Badge key={aIdx} variant="outline" className="text-[9px] h-4 px-1">
                                            {av.attribute?.name || 'Attr'}: {av.value || av.attributeValueId}
                                          </Badge>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="italic text-muted-foreground/70 text-[10px]">Estándar</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 font-bold text-right">
                                    <Badge variant={varStock > 0 ? 'secondary' : 'destructive'} className="text-[9px] h-4">
                                      {varStock} pzs
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
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Footer */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
            <span className="text-[11px] text-muted-foreground">
              Página <span className="font-bold text-foreground">{page}</span> de <span className="font-bold text-foreground">{meta.totalPages}</span> ({meta.total} productos)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => onPageChange(Math.min(meta.totalPages, page + 1))}
                disabled={page === meta.totalPages}
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
