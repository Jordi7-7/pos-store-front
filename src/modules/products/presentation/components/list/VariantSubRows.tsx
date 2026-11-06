import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { variantStock } from '../../../domain/rules/product-stock';
import type { ProductVM } from '../../view-models/product.vm';

interface VariantSubRowsProps {
  product: ProductVM;
  branchId: string;
}

/** Filas desplegables con cada variante de un producto compuesto. */
export const VariantSubRows: React.FC<VariantSubRowsProps> = ({ product, branchId }) => (
  <>
    {product.variants.map((v, idx) => {
      const vStock = variantStock(v, branchId);
      const varImgUrl = v.images[0]?.url;

      return (
        <TableRow
          key={`var-${v.id || idx}`}
          className="border-b border-border-card bg-muted/30 transition-colors hover:bg-muted/50"
        >
          <TableCell className="border-l-2 border-l-primary/40 px-3 py-2"></TableCell>
          <TableCell className="py-2 pl-4">
            <div className="flex items-center gap-1.5">
              {varImgUrl ? (
                <img src={varImgUrl} className="w-6 h-6 rounded object-cover border border-border" alt={v.sku} />
              ) : null}
            </div>
          </TableCell>
          <TableCell className="py-2 font-mono text-xs text-foreground font-medium">
            {v.sku}
          </TableCell>
          <TableCell className="py-2">
            <div className="flex flex-wrap gap-1">
              {v.attributes.length > 0 ? (
                <Badge variant="outline" className="h-6 bg-card px-2 font-medium text-foreground" title={v.attributesLabel}>
                  {v.attributes.map((attribute) => attribute.value).join(' · ')}
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground">Variante #{idx + 1}</span>
              )}
            </div>
          </TableCell>
          <TableCell className="hidden py-2 font-mono text-xs text-muted-foreground lg:table-cell">
            {v.barcode || '—'}
          </TableCell>
          <TableCell className="py-2 text-right font-mono text-xs text-muted-foreground">
            {v.purchasePriceFormatted}
          </TableCell>
          <TableCell className="py-2 text-right font-mono text-xs font-semibold text-foreground">
            {v.salePriceFormatted}
          </TableCell>
          <TableCell className="hidden py-2 text-right font-mono text-xs xl:table-cell">
            {v.wholesalePriceFormatted}
          </TableCell>
          <TableCell className="py-2 text-center">
            <Badge
              variant={vStock > 0 ? 'secondary' : vStock < 0 ? 'destructive' : 'outline'}
              className={`font-mono text-xs px-1.5 py-0 h-4 ${
                vStock === 0 ? 'text-muted-foreground border-border bg-muted/40' : ''
              }`}
            >
              {vStock} pzs
            </Badge>
          </TableCell>
          <TableCell className="py-2 text-center"></TableCell>
        </TableRow>
      );
    })}
  </>
);
