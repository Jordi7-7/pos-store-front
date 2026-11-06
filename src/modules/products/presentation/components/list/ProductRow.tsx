import React from 'react';
import { AlertTriangle, Barcode, CheckSquare, ChevronDown, ChevronRight, Edit, Package, Square } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { ProductType } from '../../../domain/enums';
import { productStock, stockBreakdown } from '../../../domain/rules/product-stock';
import type { ProductVM } from '../../view-models/product.vm';

interface ProductRowProps {
  product: ProductVM;
  /** Sucursal elegida; vacío = existencias de toda la empresa. */
  branchId: string;
  isExpanded: boolean;
  isSelected: boolean;
  canEdit: boolean;
  canPrint: boolean;
  onOpen: (product: ProductVM) => void;
  onToggleSelect: (product: ProductVM) => void;
  onToggleExpand: (productId: string) => void;
  onPrint: (product: ProductVM) => void;
  onEdit: (product: ProductVM) => void;
}

/** Fila principal de un producto: foto, SKU, precios, existencias y acciones. */
export const ProductRow: React.FC<ProductRowProps> = ({ product, branchId, isExpanded, isSelected, canEdit, canPrint, onOpen, onToggleSelect, onToggleExpand, onPrint, onEdit }) => {
  const isVariable = product.type === ProductType.VARIABLE;
  const defaultVariant = product.variants[0];
  const sku = product.baseSku || defaultVariant?.sku || 'N/A';
  const barcode = defaultVariant?.barcode || 'N/A';
  const currentStock = productStock(product, branchId);
  const { positive: positiveStock, negative: negativeStock, isMixed: hasMixedStock } = stockBreakdown(product, branchId);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand(product.id);
  };

  return (
    <TableRow 
      onClick={() => onOpen(product)} 
      className={`hover:bg-muted/30 cursor-pointer transition-colors ${
        isSelected ? 'bg-primary/5' : ''
      }`}
    >
    {/* Checkbox individual */}
    <TableCell className="py-2.5 px-3" onClick={(e) => { e.stopPropagation(); onToggleSelect(product); }}>
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
            onClick={toggleExpand}
            className="w-5 h-5 rounded hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            title={isExpanded ? 'Ocultar variantes' : 'Ver variantes'}
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-primary" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}
        <div className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
          {product.primaryImageUrl ? (
            <img src={product.primaryImageUrl} className="w-full h-full object-cover" alt={product.name} />
          ) : (
            <Package className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>
    </TableCell>

    {/* SKU */}
    <TableCell className="py-2.5">
      <div className="flex flex-col gap-1 items-start">
        <span className="font-mono text-xs text-primary font-bold">
          {sku}
        </span>
        {isVariable ? (
          <Badge
            variant="outline"
            onClick={toggleExpand}
            className="text-xs px-1.5 py-0 h-4 font-semibold bg-primary/10 text-primary border-primary/30 cursor-pointer hover:bg-primary/20"
          >
            {product.totalVariants} vars
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="text-xs px-1.5 py-0 h-4 font-normal bg-muted/50 text-muted-foreground border-border"
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
        <div className="text-xs text-primary/80 font-medium mt-0.5">
          {product.categoryName}
        </div>
      )}
      {product.description && (
        <div className="text-xs text-muted-foreground truncate max-w-[200px] mt-0.5" title={product.description}>
          {product.description}
        </div>
      )}
    </TableCell>

    {/* Barcode */}
    <TableCell className="hidden py-2.5 font-mono text-xs text-muted-foreground lg:table-cell">
      {barcode}
    </TableCell>

    {/* Purchase Price */}
    <TableCell className="py-2.5 text-right font-mono text-xs">
      {isVariable ? product.purchasePriceRangeFormatted : (defaultVariant?.purchasePriceFormatted || '—')}
    </TableCell>

    {/* Sale Price */}
    <TableCell className="py-2.5 text-right font-mono text-xs font-semibold text-foreground">
      {isVariable ? product.priceRangeFormatted : (defaultVariant?.salePriceFormatted || '—')}
    </TableCell>

    {/* Wholesale Price */}
    <TableCell className="hidden py-2.5 text-right font-mono text-xs font-semibold text-foreground xl:table-cell">
      {isVariable ? product.wholesalePriceRangeFormatted : (defaultVariant?.wholesalePriceFormatted || '—')}
    </TableCell>

    {/* Stock */}
    <TableCell className="py-2.5 text-center">
      {hasMixedStock ? (
        <div 
          className="flex flex-col items-center gap-0.5" 
          title={`Saldo neto: ${currentStock} pzs (${positiveStock} disponibles en algunas variantes, ${Math.abs(negativeStock)} en negativo)`}
        >
          <Badge
            variant="outline"
            className="font-bold font-mono text-xs border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1 cursor-pointer hover:bg-amber-500/20 transition-colors"
            onClick={toggleExpand}
          >
            <AlertTriangle className="w-2.5 h-2.5 text-amber-500 shrink-0" />
            <span>{currentStock} pzs</span>
          </Badge>
          <span 
            className="text-xs font-mono text-amber-600 dark:text-amber-400 font-semibold cursor-pointer hover:underline"
            onClick={toggleExpand}
          >
            +{positiveStock} / {negativeStock}
          </span>
        </div>
      ) : (
        <Badge
          variant={currentStock > 0 ? 'secondary' : currentStock < 0 ? 'destructive' : 'outline'}
          className={`font-bold font-mono text-xs ${
            currentStock === 0 ? 'text-muted-foreground border-border bg-muted/40' : ''
          }`}
        >
          {currentStock} pzs
        </Badge>
      )}
    </TableCell>

    {/* Actions */}
    <TableCell className="py-2.5 text-center">
      <div className="flex items-center justify-center gap-1">
        {/* Botón imprimir etiqueta individual */}
        {canPrint && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(event) => { event.stopPropagation(); onPrint(product); }}
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
            onClick={(event) => { event.stopPropagation(); onEdit(product); }}
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
};
