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
              {v.attributesLabel ? (
                <Badge
                  variant="outline"
                  className="text-[9px] px-1.5 py-0 h-4 font-normal bg-card text-foreground border-border/70 shadow-2xs"
                >
                  {v.attributesLabel}
                </Badge>
              ) : (
                <span className="text-[11px] text-muted-foreground">Variante #{idx + 1}</span>
              )}
            </div>
          </TableCell>
          <TableCell className="py-2 font-mono text-[10px] text-muted-foreground">
            {v.barcode || '—'}
          </TableCell>
          <TableCell className="py-2 text-right font-mono text-xs text-muted-foreground">
            {v.purchasePriceFormatted}
          </TableCell>
          <TableCell className="py-2 text-right font-mono text-xs font-semibold text-foreground">
            {v.salePriceFormatted}
          </TableCell>
          <TableCell className="py-2 text-right font-mono text-xs">
            {v.wholesalePriceFormatted}
          </TableCell>
          <TableCell className="py-2 text-center">
            <Badge
              variant={vStock > 0 ? 'secondary' : vStock < 0 ? 'destructive' : 'outline'}
              className={`font-mono text-[9px] px-1.5 py-0 h-4 ${
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
