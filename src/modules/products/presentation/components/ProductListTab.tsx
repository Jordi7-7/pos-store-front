import React, { useState } from 'react';
import { Package } from 'lucide-react';
import { APP_PERMISSIONS } from '@/constants/permissions';
import { usePermissions } from '@/hooks/usePermissions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PaginationControls } from '@/shared/presentation/components/PaginationControls';
import { ProductType } from '../../domain/enums';
import { isVariableProduct, labelLinesFor } from '../../domain/rules/product-stock';
import { useProductSelection } from '../hooks/useProductSelection';
import type { ProductVM } from '../view-models/product.vm';
import { BarcodePrintModal, type BarcodeLabelItem } from './barcode-printer/BarcodePrintModal';
import { ProductsTable } from './list/ProductsTable';
import { ProductListToolbar } from './list/ProductListToolbar';
import { ProductDetailModal } from './ProductDetailModal';
import { ProductEditDrawer } from './ProductEditDrawer';
import { ProductVariableEditModal } from './ProductVariableEditModal';
import type { CategoryEntity } from '../../domain/entities/catalog.entity';

interface ProductListTabProps {
  products: ProductVM[];
  isLoading: boolean;
  categories: CategoryEntity[];
  selectedBranchId: string;
  meta: { total: number; page: number; limit: number; totalPages: number };
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  search: string;
  onSearchChange: (search: string) => void;
  productType?: ProductType;
  onProductTypeChange?: (type?: ProductType) => void;
  inStockOnly?: boolean;
  onInStockOnlyChange?: (inStockOnly: boolean) => void;
}

/**
 * Lista de productos: junta la barra, la tabla y los diálogos (detalle, edición, etiquetas). La selección
 * para imprimir vive en `useProductSelection`, las reglas de existencias y etiquetas en `domain/rules/product-stock`.
 */
export const ProductListTab: React.FC<ProductListTabProps> = ({
  products, isLoading, categories, selectedBranchId, meta, onPageChange, onLimitChange,
  search, onSearchChange, productType, onProductTypeChange, inStockOnly, onInStockOnlyChange,
}) => {
  const { can } = usePermissions();
  const canEdit = can(APP_PERMISSIONS.PRODUCTS_EDIT);
  const canPrintBarcodes = can(APP_PERMISSIONS.PRODUCTS_PRINT_BARCODES);
  const selection = useProductSelection();

  const [simpleToEdit, setSimpleToEdit] = useState<ProductVM | null>(null);
  const [variableToEditId, setVariableToEditId] = useState<string | null>(null);
  const [detailProduct, setDetailProduct] = useState<ProductVM | null>(null);
  const [labelQueue, setLabelQueue] = useState<BarcodeLabelItem[]>([]);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);

  const openEditor = (product: ProductVM) => {
    if (!canEdit) return;
    if (isVariableProduct(product)) setVariableToEditId(product.id);
    else setSimpleToEdit(product);
  };

  const openLabels = (toPrint: ProductVM[]) => {
    setLabelQueue(labelLinesFor(toPrint));
    setIsLabelModalOpen(true);
  };

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

          <ProductListToolbar
            search={search}
            onSearchChange={onSearchChange}
            onResetPage={() => onPageChange(1)}
            productType={productType}
            onProductTypeChange={onProductTypeChange}
            inStockOnly={inStockOnly}
            onInStockOnlyChange={onInStockOnlyChange}
            canPrint={canPrintBarcodes}
            selectedCount={selection.count}
            onPrintSelected={() => openLabels(selection.selected)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <PaginationControls meta={meta} onPageChange={onPageChange} onLimitChange={onLimitChange} />

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
              <Button variant="link" size="sm" onClick={() => onSearchChange('')} className="text-xs">
                Limpiar filtros de búsqueda
              </Button>
            )}
          </div>
        ) : (
          <ProductsTable
            products={products}
            branchId={selectedBranchId}
            isSelected={selection.isSelected}
            allSelected={selection.allSelected(products)}
            canEdit={canEdit}
            canPrint={canPrintBarcodes}
            onToggleAll={() => selection.togglePage(products)}
            onToggleSelect={selection.toggle}
            onOpen={setDetailProduct}
            onPrint={(product) => openLabels([product])}
            onEdit={openEditor}
          />
        )}

      </CardContent>

      <ProductEditDrawer
        product={simpleToEdit}
        isOpen={simpleToEdit !== null}
        onClose={() => setSimpleToEdit(null)}
        categories={categories}
        selectedBranchId={selectedBranchId}
      />
      <ProductVariableEditModal
        productId={variableToEditId}
        isOpen={variableToEditId !== null}
        onClose={() => setVariableToEditId(null)}
        selectedBranchId={selectedBranchId}
      />
      <ProductDetailModal
        product={detailProduct}
        isOpen={detailProduct !== null}
        onClose={() => setDetailProduct(null)}
        categories={categories}
        selectedBranchId={selectedBranchId}
      />
      <BarcodePrintModal isOpen={isLabelModalOpen} onClose={() => setIsLabelModalOpen(false)} items={labelQueue} onUpdateItems={setLabelQueue} />
    </Card>
  );
};
