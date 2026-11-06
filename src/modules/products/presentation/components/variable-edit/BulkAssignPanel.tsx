import React, { useState } from 'react';
import { Sparkles, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface BulkPrices {
  purchasePrice: string;
  salePrice: string;
  wholesalePrice: string;
}

interface BulkAssignPanelProps {
  /** Aplica los precios escritos a todas las variantes (los campos vacíos no se tocan). */
  onApply: (prices: BulkPrices) => void;
}

/** Asignación masiva rápida de precios. Los valores escritos solo le interesan a este panel. */
export const BulkAssignPanel: React.FC<BulkAssignPanelProps> = ({ onApply }) => {
  const [bulkPurchasePrice, setBulkPurchasePrice] = useState('');
  const [bulkSalePrice, setBulkSalePrice] = useState('');
  const [bulkWholesalePrice, setBulkWholesalePrice] = useState('');

  const apply = () => onApply({ purchasePrice: bulkPurchasePrice, salePrice: bulkSalePrice, wholesalePrice: bulkWholesalePrice });

  return (
          <Card className="border-border shadow-xs bg-card overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/15">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs flex items-center gap-1.5 text-secondary font-bold">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Asignación Masiva Rápida a Variantes
                </CardTitle>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={apply}
                  className="text-xs h-8 cursor-pointer font-bold shadow-xs gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Aplicar a Todas
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
 <FieldLabel className="text-xs text-neutral font-bold ">
                    P. Compra
                  </FieldLabel>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={bulkPurchasePrice}
                    onChange={(e) => setBulkPurchasePrice(e.target.value)}
                    className="text-xs h-9 bg-background"
                  />
                </div>
                <div className="space-y-1">
 <FieldLabel className="text-xs text-neutral font-bold ">
                    P. Venta
                  </FieldLabel>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={bulkSalePrice}
                    onChange={(e) => setBulkSalePrice(e.target.value)}
                    className="text-xs h-9 bg-background font-semibold"
                  />
                </div>
                <div className="space-y-1">
 <FieldLabel className="text-xs text-neutral font-bold ">
                    P. Mayoreo (Opc.)
                  </FieldLabel>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={bulkWholesalePrice}
                    onChange={(e) => setBulkWholesalePrice(e.target.value)}
                    className="text-xs h-9 bg-background"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
  );
};
