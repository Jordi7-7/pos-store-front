import React, { useState } from 'react';
import { Package, Edit, Search, Barcode, CheckSquare, Square, Layers, ChevronDown, ChevronRight } from 'lucide-react';
import { ProductType, type Product } from '../services/products.service';
import { ProductEditDrawer } from './ProductEditDrawer';
import { ProductDetailModal } from './ProductDetailModal';
import { ProductVariableEditModal } from './ProductVariableEditModal';
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
  uploadedImages?: any[];
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
  productType?: ProductType;
  onProductTypeChange?: (type?: ProductType) => void;
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
  onSearchChange,
  productType,
  onProductTypeChange,
}) => {
  const { can } = usePermissions();
  const canEdit = can(APP_PERMISSIONS.PRODUCTS_EDIT);
  const canPrintBarcodes = can(APP_PERMISSIONS.PRODUCTS_PRINT_BARCODES);

  const [selectedProductToEdit, setSelectedProductToEdit] = useState<any | null>(null);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [selectedVariableProductId, setSelectedVariableProductId] = useState<string | null>(null);
  const [isVariableEditModalOpen, setIsVariableEditModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(search);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Estado para selección masiva de etiquetas: Guardar Map<productId, Product> para persistir entre búsquedas y páginas
  const [selectedProductsMap, setSelectedProductsMap] = useState<Map<string, Product>>(new Map());
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [barcodeQueue, setBarcodeQueue] = useState<BarcodeLabelItem[]>([]);
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set());

  const toggleExpandProduct = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const handleOpenEditDrawer = (product: any) => {
    if (!canEdit) return;

    // Check if product is variable (via explicit type column or fallback to attribute values/variants)
    const isVariableProduct = product.type === ProductType.VARIABLE || Boolean(
      (product.variants && product.variants.length > 1) ||
      (product.variants?.[0]?.attributeValues && product.variants[0].attributeValues.length > 0)
    );

    if (isVariableProduct) {
      setSelectedVariableProductId(product.id);
      setIsVariableEditModalOpen(true);
    } else {
      setSelectedProductToEdit(product);
      setIsEditDrawerOpen(true);
    }
  };

  const handleCloseEditDrawer = () => {
    setIsEditDrawerOpen(false);
    setSelectedProductToEdit(null);
  };

  const handleCloseVariableEditModal = () => {
    setIsVariableEditModalOpen(false);
    setSelectedVariableProductId(null);
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

  const isAll = !selectedBranchId;

  return (
    <Card className="border border-border/80 shadow-xs">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-bold">Catálogo de Productos ({meta.total})</CardTitle>
              <Badge variant="outline" className={`text-[10px] font-semibold gap-1 ${
                isAll 
                  ? 'text-amber-400 border-amber-500/30 bg-amber-500/5' 
                  : 'text-primary border-primary/30 bg-primary/5'
              }`}>
                {isAll ? 'Existencias Consolidadas (Toda la Empresa)' : 'Existencias de esta Sucursal'}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              {isAll 
                ? 'Visualizando las existencias totales sumadas de todas las sucursales de tu empresa.' 
                : 'El catálogo es compartido por toda la empresa; las existencias corresponden a la sucursal seleccionada.'}
            </CardDescription>
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

            {/* Filtro por tipo de producto (Todos / Simples / Con Variantes) */}
            {onProductTypeChange && (
              <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/80">
                <button
                  type="button"
                  onClick={() => onProductTypeChange(undefined)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    productType === undefined
                      ? 'bg-background text-foreground shadow-2xs'
                      : 'text-neutral hover:text-foreground'
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => onProductTypeChange(ProductType.SIMPLE)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    productType === ProductType.SIMPLE
                      ? 'bg-background text-foreground shadow-2xs'
                      : 'text-neutral hover:text-foreground'
                  }`}
                >
                  <Package className="w-3.5 h-3.5 text-neutral" />
                  <span>Simples</span>
                </button>
                <button
                  type="button"
                  onClick={() => onProductTypeChange(ProductType.VARIABLE)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    productType === ProductType.VARIABLE
                      ? 'bg-background text-primary shadow-2xs font-bold'
                      : 'text-neutral hover:text-foreground'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-primary" />
                  <span>Con Variantes</span>
                </button>
              </div>
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
                  <TableHead className="font-semibold text-xs text-center">{isAll ? 'Stock Total' : 'Stock Sucursal'}</TableHead>
                  <TableHead className="w-[80px] text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const isVariable = product.type === ProductType.VARIABLE;
                  const defaultVariant = product.variants?.[0];
                  const sku = product.baseSku || defaultVariant?.sku || 'N/A';
                  const barcode = defaultVariant?.barcode ?? 'N/A';

                  // Price calculation (stacked compact ranges if variable product)
                  const renderPriceDisplay = (
                    getVal: (v: any) => number | null | undefined,
                    isSale = false
                  ): React.ReactNode => {
                    if (!isVariable) {
                      const single = defaultVariant ? getVal(defaultVariant) : null;
                      if (single === null || single === undefined || isNaN(Number(single)) || Number(single) <= 0) {
                        return <span className="text-muted-foreground/50 text-[11px]">—</span>;
                      }
                      return (
                        <span className={`font-mono text-xs ${isSale ? 'font-semibold text-foreground' : 'text-foreground/80'}`}>
                          ${Number(single).toFixed(2)}
                        </span>
                      );
                    }

                    if (!product.variants || product.variants.length === 0) {
                      return <span className="text-muted-foreground/50 text-[11px]">—</span>;
                    }

                    const values = product.variants
                      .map(getVal)
                      .filter((val): val is number => val !== null && val !== undefined && !isNaN(val) && Number(val) > 0);

                    if (values.length === 0) {
                      return <span className="text-muted-foreground/50 text-[11px]">—</span>;
                    }

                    const min = Math.min(...values);
                    const max = Math.max(...values);

                    if (min === max) {
                      return (
                        <span className={`font-mono text-xs ${isSale ? 'font-semibold text-foreground' : 'text-foreground/80'}`}>
                          ${min.toFixed(2)}
                        </span>
                      );
                    }

                    return (
                      <div className="flex flex-col items-end leading-tight select-none">
                        <span className={`font-mono text-[11px] ${isSale ? 'font-bold text-primary' : 'font-medium text-foreground'}`}>
                          ${min.toFixed(2)}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground/75">
                          - ${max.toFixed(2)}
                        </span>
                      </div>
                    );
                  };

                  const purchasePriceDisplay = renderPriceDisplay((v) => Number(v.purchasePrice));
                  const salePriceDisplay = renderPriceDisplay((v) => Number(v.salePrice), true);
                  const wholesalePriceDisplay = renderPriceDisplay((v) =>
                    v.wholesalePrice !== null && v.wholesalePrice !== undefined && Number(v.wholesalePrice) > 0
                      ? Number(v.wholesalePrice)
                      : null
                  );

                  // Calculate stock: if variable, sum stock across all variants
                  const currentStock = isVariable
                    ? (product.variants?.reduce((total: number, v: any) => {
                        const variantStock = isAll
                          ? (v.stocks?.reduce((acc: number, s: any) => acc + Number(s.quantity || 0), 0) ?? 0)
                          : (v.stocks?.find((s: any) => s.branchId === selectedBranchId)?.quantity ?? 0);
                        return total + variantStock;
                      }, 0) ?? 0)
                    : isAll
                    ? (defaultVariant?.stocks?.reduce((acc: number, s: any) => acc + Number(s.quantity || 0), 0) ?? 0)
                    : (defaultVariant?.stocks?.find(s => s.branchId === selectedBranchId)?.quantity ?? 0);

                  const isSelected = selectedProductsMap.has(product.id);

                  return (
                    <React.Fragment key={product.id}>
                      <TableRow 
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

                      {/* Image Thumbnail with Expand Toggle for Variable Products */}
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-1.5">
                          {isVariable ? (
                            <button
                              type="button"
                              onClick={(e) => toggleExpandProduct(product.id, e)}
                              className="w-5 h-5 rounded hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                              title={expandedProductIds.has(product.id) ? 'Ocultar variantes' : 'Ver variantes'}
                            >
                              {expandedProductIds.has(product.id) ? (
                                <ChevronDown className="w-3.5 h-3.5 text-primary" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </button>
                          ) : (
                            <span className="w-5" />
                          )}
                          <div className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                            {(() => {
                              const directUrl = product.images?.[0]?.url;
                              if (directUrl) {
                                return <img src={directUrl} className="w-full h-full object-cover" alt={product.name} />;
                              }
                              if (product.imageIds && product.imageIds.length > 0 && uploadedImages) {
                                const imgObj = uploadedImages.find(img => img.id === product.imageIds![0]);
                                if (imgObj?.url) {
                                  return <img src={imgObj.url} className="w-full h-full object-cover" alt={product.name} />;
                                }
                              }
                              return <Package className="w-4 h-4 text-muted-foreground" />;
                            })()}
                          </div>
                        </div>
                      </TableCell>

                      {/* SKU */}
                      <TableCell className="py-2.5">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="font-mono text-[11px] text-primary font-bold">
                            {sku}
                          </span>
                          {isVariable ? (
                            <Badge
                              variant="outline"
                              onClick={(e) => toggleExpandProduct(product.id, e)}
                              className="text-[9px] px-1.5 py-0 h-4 font-semibold bg-primary/10 text-primary border-primary/30 cursor-pointer hover:bg-primary/20"
                            >
                              {product.variants?.length || 0} vars
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1.5 py-0 h-4 font-normal bg-muted/50 text-muted-foreground border-border"
                            >
                              Simple
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* Product details */}
                      <TableCell className="py-2.5">
                        <div className="font-semibold text-xs text-foreground leading-tight truncate max-w-[200px]" title={product.name}>
                          {product.name}
                        </div>
                        {product.categoryName && (
                          <div className="text-[10px] text-primary/80 font-medium mt-0.5">
                            {product.categoryName}
                          </div>
                        )}
                        {product.description && (
                          <div className="text-[10px] text-muted-foreground truncate max-w-[200px] mt-0.5" title={product.description}>
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
                        {purchasePriceDisplay}
                      </TableCell>

                      {/* Sale Price */}
                      <TableCell className="py-2.5 text-right font-mono text-xs font-semibold text-foreground">
                        {salePriceDisplay}
                      </TableCell>

                      {/* Wholesale Price */}
                      <TableCell className="py-2.5 text-right font-mono text-xs font-semibold text-foreground">
                        {wholesalePriceDisplay}
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

                    {/* Sub-filas desplegables de variantes para productos variables */}
                    {isVariable && expandedProductIds.has(product.id) && product.variants?.map((v: any, idx: number) => {
                      const vStock = isAll
                        ? (v.stocks?.reduce((acc: number, s: any) => acc + Number(s.quantity || 0), 0) ?? 0)
                        : (v.stocks?.find((s: any) => s.branchId === selectedBranchId)?.quantity ?? 0);

                      const varImgUrl = v.images?.[0]?.url;

                      return (
                        <TableRow
                          key={`var-${v.id || idx}`}
                          className="bg-muted/15 border-b border-border/40 hover:bg-muted/25 transition-colors"
                        >
                          <TableCell className="py-2 px-3"></TableCell>
                          <TableCell className="py-2 pl-4">
                            <div className="flex items-center gap-1.5">
                              <span className="text-muted-foreground/60 text-xs">└─</span>
                              {varImgUrl ? (
                                <img src={varImgUrl} className="w-6 h-6 rounded object-cover border border-border" alt={v.sku} />
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="py-2 font-mono text-[11px] text-foreground font-medium">
                            {v.sku}
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="flex flex-wrap gap-1">
                              {v.attributes && v.attributes.length > 0 ? (
                                v.attributes.map((attr: any, aIdx: number) => (
                                  <Badge
                                    key={aIdx}
                                    variant="outline"
                                    className="text-[9px] px-1 py-0 h-4 font-normal bg-card text-foreground border-border/70 shadow-2xs"
                                  >
                                    {attr.name ? `${attr.name}: ` : ''}
                                    <strong className="text-primary ml-0.5">{attr.value}</strong>
                                  </Badge>
                                ))
                              ) : v.attributeValues && v.attributeValues.length > 0 ? (
                                v.attributeValues.map((av: any) => (
                                  <Badge
                                    key={av.id || av.value}
                                    variant="outline"
                                    className="text-[9px] px-1 py-0 h-4 font-normal bg-card text-foreground border-border/70 shadow-2xs"
                                  >
                                    {av.attribute?.name ? `${av.attribute.name}: ` : ''}
                                    <strong className="text-primary ml-0.5">{av.value}</strong>
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-[11px] text-muted-foreground">Variante #{idx + 1}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-2 font-mono text-[10px] text-muted-foreground">
                            {v.barcode || '—'}
                          </TableCell>
                          <TableCell className="py-2 text-right font-mono text-xs text-muted-foreground">
                            ${Number(v.purchasePrice || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="py-2 text-right font-mono text-xs font-semibold text-foreground">
                            ${Number(v.salePrice || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="py-2 text-right font-mono text-xs">
                            {v.wholesalePrice !== null && v.wholesalePrice !== undefined && Number(v.wholesalePrice) > 0 ? (
                              `$${Number(v.wholesalePrice).toFixed(2)}`
                            ) : (
                              <span className="text-muted-foreground/40 text-[11px]">—</span>
                            )}
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            <Badge
                              variant={vStock > 0 ? 'secondary' : 'destructive'}
                              className="font-mono text-[9px] px-1.5 py-0 h-4"
                            >
                              {vStock} pzs
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2 text-center"></TableCell>
                        </TableRow>
                      );
                    })}
                  </React.Fragment>
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
      <ProductVariableEditModal
        productId={selectedVariableProductId}
        isOpen={isVariableEditModalOpen}
        onClose={handleCloseVariableEditModal}
        categories={categories}
        selectedBranchId={selectedBranchId}
      />
      <ProductDetailModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        categories={categories}
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
