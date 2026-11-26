import React, { useState } from 'react';
import { Package } from 'lucide-react';
import { toast } from 'sonner';
import { APP_PERMISSIONS } from '@/constants/permissions';
import { usePermissions } from '@/hooks/usePermissions';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PaginationControls } from '@/shared/presentation/components/PaginationControls';
import { ProductType, type StockStatus } from '../../domain/enums';
import { isVariableProduct, labelLinesFor } from '../../domain/rules/product-stock';
import { useProductSearch } from '../hooks/useProductSearch';
import { useProductSelection } from '../hooks/useProductSelection';
import type { ProductVM } from '../view-models/product.vm';
import { BarcodePrintModal, type BarcodeLabelItem } from './barcode-printer/BarcodePrintModal';
import { ProductsTable } from './list/ProductsTable';
import { ProductListSummary } from './list/ProductListSummary';
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
  stockStatus?: StockStatus;
  onStockStatusChange?: (status?: StockStatus) => void;
}

/**
 * Lista de productos: junta la barra, la tabla y los diálogos (detalle, edición, etiquetas). La selección
 * para imprimir vive en `useProductSelection`, las reglas de existencias y etiquetas en `domain/rules/product-stock`.
 */
export const ProductListTab: React.FC<ProductListTabProps> = ({
  products, isLoading, categories, selectedBranchId, meta, onPageChange, onLimitChange,
  search, onSearchChange, productType, onProductTypeChange, stockStatus, onStockStatusChange,
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
    const { lines, skipped } = labelLinesFor(toPrint);
    if (skipped > 0) toast.warning(`${skipped} ${skipped === 1 ? 'variante sin SKU no se imprimirá' : 'variantes sin SKU no se imprimirán'}: el código de barras sale del SKU.`);
    if (lines.length === 0) return;
    setLabelQueue(lines);
    setIsLabelModalOpen(true);
  };

  const isAll = !selectedBranchId;

  const resetPage = () => onPageChange(1);
  const searchField = useProductSearch(search, onSearchChange, resetPage);
  const clearFilters = () => {
    searchField.clear();
    onProductTypeChange?.(undefined);
    onStockStatusChange?.(undefined);
    resetPage();
  };

  return (
    <div className="space-y-4">
      <ProductListToolbar
        searchInput={searchField.input}
        onSearchInputChange={searchField.setInput}
        onSearchSubmit={searchField.applyNow}
        onScan={searchField.applyCode}
        onResetPage={resetPage}
        productType={productType}
        onProductTypeChange={onProductTypeChange}
        stockStatus={stockStatus}
        onStockStatusChange={onStockStatusChange}
      />

      <Card className="gap-0 overflow-hidden p-0">
        <ProductListSummary
          total={meta.total}
          isConsolidated={isAll}
          hasActiveFilters={Boolean(search || productType || stockStatus)}
          onClearFilters={clearFilters}
          canPrint={canPrintBarcodes}
          selectedCount={selection.count}
          onPrintSelected={() => openLabels(selection.selected)}
        />

        <div className="px-4">
          <PaginationControls placement="top" meta={meta} onPageChange={onPageChange} onLimitChange={onLimitChange} />
        </div>

        {isLoading ? (
          <div className="space-y-2.5 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl border border-border p-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-60" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Package className="h-10 w-10 text-muted-foreground opacity-40" />
            <p className="text-sm text-muted-foreground">No hay productos que coincidan con los filtros.</p>
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

        <div className="px-4">
          <PaginationControls meta={meta} onPageChange={onPageChange} onLimitChange={onLimitChange} />
        </div>
      </Card>

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
    </div>
  );
};
