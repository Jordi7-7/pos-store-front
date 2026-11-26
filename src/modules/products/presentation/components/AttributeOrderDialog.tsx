import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getErrorMessage } from '@/shared/presentation/formatting/error-messages';
import type { AttributeEntity } from '../../domain/entities/catalog.entity';
import { moveItem, sortAlphabetically, suggestSizeOrder } from '../../domain/rules/option-order';

interface AttributeOrderDialogProps {
  attribute: AttributeEntity | null;
  onClose: () => void;
  onSave: (attributeId: string, valueIds: string[]) => Promise<void>;
}

/** Ordena las opciones de un atributo (S, M, L, XL…): flechas por opción y dos atajos. El orden vale para toda la tienda. */
export const AttributeOrderDialog: React.FC<AttributeOrderDialogProps> = ({ attribute, onClose, onSave }) => {
  const [items, setItems] = useState<Array<{ id: string; value: string }>>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setItems(attribute ? attribute.values.map((value) => ({ id: value.id, value: value.value })) : []);
  }, [attribute]);

  const sizeSuggestion = suggestSizeOrder(items);
  const changed = attribute !== null && items.some((item, index) => item.id !== attribute.values[index]?.id);

  const save = async () => {
    if (!attribute) return;
    setIsSaving(true);
    try {
      await onSave(attribute.id, items.map((item) => item.id));
      toast.success(`Orden de ${attribute.name} guardado.`);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'No se pudo guardar el orden.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={attribute !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-secondary">Ordenar {attribute?.name}</DialogTitle>
          <DialogDescription className="text-xs text-neutral">
            Así se mostrarán las opciones al crear y editar productos y en el punto de venta. Los productos ya creados no cambian, solo el orden en que se ven.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" disabled={!sizeSuggestion} title={sizeSuggestion ? 'XS, S, M, L, XL… o números de menor a mayor' : 'Solo para tallas de letras o de números'} onClick={() => sizeSuggestion && setItems(sizeSuggestion)}>
            Ordenar como tallas
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setItems(sortAlphabetically(items))}>
            Ordenar A–Z
          </Button>
        </div>

        <ol className="max-h-80 space-y-1.5 overflow-y-auto" aria-label={`Opciones de ${attribute?.name ?? ''}`}>
          {items.map((item, index) => (
            <li key={item.id} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm">
              <span className="w-6 text-xs text-muted-foreground tabular-nums">{index + 1}</span>
              <span className="flex-1 truncate font-medium">{item.value}</span>
              <Button type="button" variant="ghost" size="icon-sm" disabled={index === 0} onClick={() => setItems(moveItem(items, index, -1))} aria-label={`Subir ${item.value}`} title="Subir">
                <ArrowUp />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" disabled={index === items.length - 1} onClick={() => setItems(moveItem(items, index, 1))} aria-label={`Bajar ${item.value}`} title="Bajar">
                <ArrowDown />
              </Button>
            </li>
          ))}
        </ol>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={save} disabled={!changed || isSaving}>
            {isSaving && <Loader2 className="animate-spin" />}
            Guardar orden
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
