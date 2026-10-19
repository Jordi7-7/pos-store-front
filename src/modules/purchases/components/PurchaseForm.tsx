import React, { useState, useMemo, useEffect } from 'react';
import { useRegisterPurchase, useSuppliers } from '../hooks';
import { productsService } from '../../products/services/products.service';
import type { Supplier } from '../types';
import { useLayoutContext } from '@/providers/LayoutContext';
import { ClipboardList, Loader2, Plus, FileSpreadsheet, Building, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { BulkPurchaseModal } from './BulkPurchaseModal';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from '@/components/ui/combobox';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableFooter
} from "@/components/ui/table";
import { PurchaseFormRow } from './PurchaseFormRow';

interface PurchaseItemInput {
  variantId: string;
  variantSku: string;
  productName: string;
  combinationText: string;
  quantity: number;
  unitCost: number;
}

interface PurchaseFormProps {
  selectedBranchId?: string;
  onSuccess: () => void;
}

export const PurchaseForm: React.FC<PurchaseFormProps> = ({ onSuccess }) => {
  const { selectedBranchId, selectedBranchName } = useLayoutContext();
  const { suppliers } = useSuppliers();
  const { registerPurchase, isRegistering } = useRegisterPurchase();

  // Local Purchase Order general inputs
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [purInvoice, setPurInvoice] = useState('');
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  // Auto-select generic supplier by default if not set
  useEffect(() => {
    if (!selectedSupplierId && suppliers.length > 0) {
      const generic = suppliers.find(
        (s: Supplier) =>
          s.identityNumber?.toUpperCase() === 'GENERICO' ||
          s.name?.toUpperCase().includes('GENERICO')
      );
      if (generic) {
        setSelectedSupplierId(generic.id);
      } else {
        setSelectedSupplierId(suppliers[0].id);
      }
    }
  }, [suppliers, selectedSupplierId]);

  // Purchase items table state, initialized with one empty row
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItemInput[]>([
    {
      variantId: '',
      variantSku: '',
      productName: '',
      combinationText: '',
      quantity: 1,
      unitCost: 0
    }
  ]);

  const updateRow = (index: number, fields: Partial<PurchaseItemInput>) => {
    const updated = [...purchaseItems];
    updated[index] = { ...updated[index], ...fields };
    setPurchaseItems(updated);
  };

  const handleRowProductSelect = async (index: number, skuVal: string | null) => {
    if (!skuVal) {
      updateRow(index, {
        variantId: '',
        variantSku: '',
        productName: '',
        combinationText: '',
        unitCost: 0,
      });
      return;
    }

    const trimmed = skuVal.trim();
    if (!trimmed) return;

    try {
      const variant = await productsService.getVariantBySku(trimmed);
      if (variant && variant.id) {
        const nextIndex = index + 1;

        setPurchaseItems((prevItems) => {
          const updated = [...prevItems];
          updated[index] = {
            ...updated[index],
            variantId: variant.id,
            variantSku: variant.sku,
            productName: variant.productName,
            combinationText: 'Estándar',
            unitCost: Number(variant.purchasePrice || 0),
          };

          // If this is the last row, automatically append a new empty row
          if (index === updated.length - 1) {
            updated.push({
              variantId: '',
              variantSku: '',
              productName: '',
              combinationText: '',
              quantity: 1,
              unitCost: 0,
            });
          }
          return updated;
        });

        // Set focus to the SKU input of the next row after state updates
        setTimeout(() => {
          const nextInput = document.querySelector(`[data-row="${nextIndex}"][data-col="sku"]`) as HTMLInputElement | null;
          if (nextInput) {
            nextInput.focus();
            nextInput.select();
          }
        }, 80);

      } else {
        throw new Error('Producto no encontrado');
      }
    } catch (err: any) {
      toast.error(`Error: El SKU "${trimmed}" no se encuentra en el catálogo.`);
      // Focus back and select text on the same SKU input
      setTimeout(() => {
        const currentInput = document.querySelector(`[data-row="${index}"][data-col="sku"]`) as HTMLInputElement | null;
        if (currentInput) {
          currentInput.focus();
          currentInput.select();
        }
      }, 50);
    }
  };

  const handleAddRow = () => {
    setPurchaseItems([
      ...purchaseItems,
      {
        variantId: '',
        variantSku: '',
        productName: '',
        combinationText: '',
        quantity: 1,
        unitCost: 0,
      }
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (purchaseItems.length === 1) {
      // Reset the single row instead of deleting it
      setPurchaseItems([
        {
          variantId: '',
          variantSku: '',
          productName: '',
          combinationText: '',
          quantity: 1,
          unitCost: 0,
        }
      ]);
    } else {
      setPurchaseItems(purchaseItems.filter((_, idx) => idx !== index));
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>, 
    rowIndex: number, 
    field: 'sku' | 'quantity' | 'unitCost'
  ) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextInput = document.querySelector(`[data-row="${rowIndex + 1}"][data-col="${field}"]`) as HTMLInputElement | null;
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      } else if (rowIndex === purchaseItems.length - 1) {
        handleAddRow();
        setTimeout(() => {
          const newInput = document.querySelector(`[data-row="${rowIndex + 1}"][data-col="sku"]`) as HTMLInputElement | null;
          newInput?.focus();
        }, 50);
      }
    } else if (e.key === 'ArrowUp' && rowIndex > 0) {
      e.preventDefault();
      const prevInput = document.querySelector(`[data-row="${rowIndex - 1}"][data-col="${field}"]`) as HTMLInputElement | null;
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'sku') {
        handleRowProductSelect(rowIndex, e.currentTarget.value);
      } else if (field === 'quantity') {
        if (rowIndex === purchaseItems.length - 1) {
          handleAddRow();
          setTimeout(() => {
            const newInput = document.querySelector(`[data-row="${rowIndex + 1}"][data-col="sku"]`) as HTMLInputElement | null;
            newInput?.focus();
          }, 50);
        } else {
          const nextSkuInput = document.querySelector(`[data-row="${rowIndex + 1}"][data-col="sku"]`) as HTMLInputElement | null;
          nextSkuInput?.focus();
        }
      }
    }
  };

  const preventEnterSubmit = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT') {
        e.preventDefault();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId) {
      toast.warning('Por favor selecciona una sucursal específica en la barra superior antes de registrar ingresos.');
      return;
    }
    
    const validItems = purchaseItems.filter(i => i.variantId !== '');
    if (validItems.length === 0) {
      toast.warning('Debes añadir al menos un artículo válido (selecciona un producto de la lista).');
      return;
    }

    try {
      await registerPurchase({
        branchId: selectedBranchId,
        supplierId: selectedSupplierId || undefined,
        invoiceNumber: purInvoice.trim() || undefined,
        items: validItems.map(i => ({
          variantId: i.variantId,
          quantity: i.quantity,
          purchasePrice: i.unitCost
        }))
      });

      toast.success('¡Ingreso registrado en Kardex y stock incrementado!');
      setPurInvoice('');
      setPurchaseItems([
        {
          variantId: '',
          variantSku: '',
          productName: '',
          combinationText: '',
          quantity: 1,
          unitCost: 0
        }
      ]);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar el ingreso.');
    }
  };

  const totalCostOfPurchase = useMemo(() => {
    return purchaseItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitCost || 0), 0);
  }, [purchaseItems]);

  return (
    <div className="space-y-6 animate-fade-in">
      {!selectedBranchId && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Para registrar compras, selecciona una sucursal en la barra superior.</span>
        </div>
      )}

      <Card className="border border-border/80 shadow-xs">
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-primary" />
                <span>Registrar Ingreso de Mercancía</span>
                {selectedBranchId && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 font-normal">
                    <Building className="w-3 h-3" />
                    {selectedBranchName}
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                Ingresa mercancía al inventario indicando el SKU del producto. El sistema te mostrará sugerencias a medida que escribes.
              </CardDescription>
            </div>
            <button
              type="button"
              onClick={() => setIsBulkOpen(true)}
              className="flex items-center gap-1.5 text-xs text-primary font-bold border border-primary/20 hover:border-primary/40 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs self-start sm:self-center"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Carga Masiva (Excel)
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
      
      <form onSubmit={handleSubmit} onKeyDown={preventEnterSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] uppercase tracking-wider font-bold mb-1 text-muted-foreground">
              Proveedor Comercial *
            </label>
            <Combobox
              value={selectedSupplierId || ''}
              onValueChange={(val) => setSelectedSupplierId(val || '')}
            >
              <ComboboxInput
                placeholder="Buscar o seleccionar proveedor..."
                className="text-xs shadow-none h-9 bg-muted/30 border-border rounded-xl"
                showTrigger
                value={(() => {
                  const s = suppliers.find((sup: Supplier) => sup.id === selectedSupplierId);
                  return s ? `${s.name} (${s.identityNumber})` : '';
                })()}
              />
              <ComboboxContent className="bg-popover border border-border rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                <ComboboxEmpty className="p-3 text-center text-xs text-muted-foreground">
                  No se encontraron proveedores.
                </ComboboxEmpty>
                <ComboboxList className="p-1">
                  {suppliers.map((sup: Supplier) => (
                    <ComboboxItem key={sup.id} value={sup.id} className="text-xs py-1.5 cursor-pointer">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{sup.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          RUC / ID: {sup.identityNumber}
                        </span>
                      </div>
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider font-bold mb-1 text-muted-foreground">Referencia / Factura (Opcional)</label>
            <input 
              type="text" 
              value={purInvoice}
              onChange={(e) => setPurInvoice(e.target.value)}
              placeholder="Ej. Guía, FAC-123" 
              className="w-full bg-muted/30 border border-border rounded-xl py-2 px-3 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary h-9" 
            />
          </div>
        </div>

        {/* Tabular Input Area */}
        <div className="border border-border rounded-xl overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-1/4">SKU / Código</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-1/3">Nombre del Producto</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right w-24">Cant.</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right w-28">Costo U.</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right w-28">Subtotal</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center w-12">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseItems.map((item, index) => (
                <PurchaseFormRow
                  key={index}
                  index={index}
                  item={item}
                  onUpdateRow={updateRow}
                  onRemoveRow={handleRemoveRow}
                  onProductSelect={handleRowProductSelect}
                  onKeyDown={handleKeyDown}
                />
              ))}
            </TableBody>
            <TableFooter className="bg-muted/20 border-t border-border">
              <TableRow>
                <TableCell colSpan={4} className="text-right text-xs font-bold text-muted-foreground">Total de Ingreso:</TableCell>
                <TableCell className="text-right text-sm font-extrabold text-primary font-mono">${totalCostOfPurchase.toFixed(2)}</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </div>

        {/* Add row manually button */}
        <div className="flex justify-start">
          <button
            type="button"
            onClick={handleAddRow}
            className="flex items-center gap-1 px-3 py-1.5 border border-dashed border-border hover:border-primary/50 text-xs font-semibold rounded-lg text-muted-foreground hover:text-primary transition-all bg-card/50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar Fila</span>
          </button>
        </div>

        <button 
          type="submit" 
          disabled={isRegistering || purchaseItems.every(i => i.variantId === '')}
          className="w-full py-3 bg-primary hover:bg-primary/95 disabled:bg-muted disabled:text-muted-foreground text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {isRegistering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          <span>Registrar Ingreso (Kardex)</span>
        </button>
      </form>
      <BulkPurchaseModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
      />
        </CardContent>
      </Card>
    </div>
  );
};
export default PurchaseForm;
