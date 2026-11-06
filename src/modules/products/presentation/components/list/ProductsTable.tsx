import React from 'react';
import { CheckSquare, Square } from 'lucide-react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ProductType } from '../../../domain/enums';
import type { ProductVM } from '../../view-models/product.vm';
import { ProductRow } from './ProductRow';
import { VariantSubRows } from './VariantSubRows';

interface ProductsTableProps {
  products: ProductVM[];
  /** Sucursal elegida; vacío = existencias de toda la empresa. */
  branchId: string;
  isSelected: (productId: string) => boolean;
  allSelected: boolean;
  canEdit: boolean;
  canPrint: boolean;
  onToggleAll: () => void;
  onToggleSelect: (product: ProductVM) => void;
  onOpen: (product: ProductVM) => void;
  onPrint: (product: ProductVM) => void;
  onEdit: (product: ProductVM) => void;
}

/** Tabla de productos; cada producto con variantes se despliega en sus variantes. */
export const ProductsTable: React.FC<ProductsTableProps> = ({ products, branchId, isSelected, allSelected, canEdit, canPrint, onToggleAll, onToggleSelect, onOpen, onPrint, onEdit }) => {
  const isAll = !branchId;
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  const toggleExpand = (productId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (!next.delete(productId)) next.add(productId);
      return next;
    });

  return (
  <div className="overflow-x-auto rounded-xl border border-border bg-card">
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50 hover:bg-muted/50">
          {/* Checkbox para seleccionar todos */}
          <TableHead className="w-[40px] px-3">
            <button
              type="button"
              onClick={onToggleAll}
              className="text-muted-foreground hover:text-foreground cursor-pointer flex items-center justify-center"
              title={allSelected ? 'Deseleccionar todos en esta página' : 'Seleccionar todos en esta página'}
            >
              {allSelected ? (
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
            {products.map((product) => (
              <React.Fragment key={product.id}>
                <ProductRow
                  product={product}
                  branchId={branchId}
                  isExpanded={expanded.has(product.id)}
                  isSelected={isSelected(product.id)}
                  canEdit={canEdit}
                  canPrint={canPrint}
                  onOpen={onOpen}
                  onToggleSelect={onToggleSelect}
                  onToggleExpand={toggleExpand}
                  onPrint={onPrint}
                  onEdit={onEdit}
                />
                {product.type === ProductType.VARIABLE && expanded.has(product.id) && <VariantSubRows product={product} branchId={branchId} />}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
  );
};
