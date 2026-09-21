import React, { useState, useMemo } from 'react';
import { Printer, Barcode } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';
import type { BarcodeLabelItem } from './types';
import { BarcodeQueueList } from './BarcodeQueueList';
import { BarcodePreviewPanel } from './BarcodePreviewPanel';
import { ThermalPrintOutput } from './ThermalPrintOutput';

import { printThermalLabels } from './ThermalPrintOutput';

export type { BarcodeLabelItem } from './types';

interface BarcodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: BarcodeLabelItem[];
  onUpdateItems: (items: BarcodeLabelItem[]) => void;
}

export const BarcodePrintModal: React.FC<BarcodePrintModalProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateItems,
}) => {
  const publicTenant = useAuthStore((state) => state.publicTenant);
  const defaultStoreName = publicTenant?.name ? publicTenant.name.toUpperCase() : 'LEIZA STORE';
  
  const [storeName, setStoreName] = useState(defaultStoreName);
  const [previewIndex, setPreviewIndex] = useState(0);

  const totalLabelsCount = useMemo(() => {
    return items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
  }, [items]);

  const handleQuantityChange = (sku: string, delta: number) => {
    const updated = items.map((it) => {
      if (it.sku === sku) {
        const nextQty = Math.max(1, (it.quantity || 1) + delta);
        return { ...it, quantity: nextQty };
      }
      return it;
    });
    onUpdateItems(updated);
  };

  const handleSetQuantity = (sku: string, val: number) => {
    const qty = Math.max(1, isNaN(val) ? 1 : val);
    const updated = items.map((it) => (it.sku === sku ? { ...it, quantity: qty } : it));
    onUpdateItems(updated);
  };

  const handleRemoveItem = (sku: string) => {
    const updated = items.filter((it) => it.sku !== sku);
    onUpdateItems(updated);
    if (previewIndex >= updated.length) {
      setPreviewIndex(Math.max(0, updated.length - 1));
    }
  };

  const handleSetAllQuantities = (qty: number) => {
    onUpdateItems(items.map((it) => ({ ...it, quantity: Math.max(1, qty) })));
  };

  const handlePrint = () => {
    printThermalLabels(items, storeName);
  };

  const activePreviewItem = items[previewIndex] || items[0];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-5xl! sm:max-w-5xl! h-[88vh] max-h-[750px] bg-card border border-border rounded-2xl p-6 text-foreground flex flex-col gap-0 overflow-hidden shadow-2xl">
          {/* Header del modal */}
          <DialogHeader className="pb-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                <Barcode className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  Impresión Térmica de Etiquetas (50×30 mm)
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Ajusta la cantidad de copias por producto e imprime directamente en tu impresora térmica de rollos.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Cuerpo principal en 2 columnas con espacio amplio */}
          <div className="flex-1 min-h-0 py-4 grid grid-cols-1 md:grid-cols-12 gap-5 overflow-hidden">
            {/* Columna Izquierda: Cola de productos */}
            <div className="md:col-span-7 h-full min-h-0">
              <BarcodeQueueList
                items={items}
                previewIndex={previewIndex}
                onSelectPreview={setPreviewIndex}
                onQuantityChange={handleQuantityChange}
                onSetQuantity={handleSetQuantity}
                onRemoveItem={handleRemoveItem}
                onSetAllQuantities={handleSetAllQuantities}
              />
            </div>

            {/* Columna Derecha: Configuración y Vista previa */}
            <div className="md:col-span-5 h-full min-h-0">
              <BarcodePreviewPanel
                storeName={storeName}
                onStoreNameChange={setStoreName}
                activeItem={activePreviewItem}
              />
            </div>
          </div>

          {/* Footer con totales y botones de acción */}
          <div className="pt-4 border-t border-border flex items-center justify-between shrink-0">
            <div className="text-xs text-muted-foreground">
              Total a imprimir: <strong className="text-foreground font-mono font-bold">{totalLabelsCount}</strong> etiqueta(s)
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose} className="text-xs h-9 cursor-pointer">
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handlePrint}
                disabled={items.length === 0}
                className="text-xs h-9 gap-1.5 font-bold shadow-md shadow-primary/20 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Imprimir {totalLabelsCount} Etiquetas
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Salida oculta para impresión física */}
      <ThermalPrintOutput items={items} storeName={storeName} />
    </>
  );
};
export default BarcodePrintModal;
