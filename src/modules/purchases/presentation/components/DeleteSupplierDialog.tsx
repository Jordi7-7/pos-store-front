import React from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getErrorMessage } from '@/shared/presentation/formatting/error-messages';
import type { SupplierEntity } from '../../domain/entities/supplier.entity';
import { useDeleteSupplier } from '../hooks/useSuppliers';

interface DeleteSupplierDialogProps {
  supplier: SupplierEntity | null;
  onClose: () => void;
}

/** Confirmación para eliminar un proveedor; está abierta mientras haya uno elegido. */
export const DeleteSupplierDialog: React.FC<DeleteSupplierDialogProps> = ({ supplier, onClose }) => {
  const { deleteSupplier, isDeleting } = useDeleteSupplier();

  const handleDelete = async () => {
    if (!supplier) return;
    try {
      await deleteSupplier(supplier.id);
      toast.success('Proveedor eliminado correctamente');
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo eliminar el proveedor'));
    }
  };

  return (
    <Dialog open={supplier !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm bg-card border border-border rounded-2xl shadow-xl p-6 text-foreground">
        <DialogHeader className="border-b border-border pb-3">
          <DialogTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-rose-500">
            <Trash2 className="w-4 h-4 text-rose-500" />
            Eliminar Proveedor
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral mt-2">
            ¿Estás seguro de que deseas eliminar al proveedor <strong className="text-foreground">{supplier?.name}</strong>?
            Esta acción no se puede deshacer si no posee compras históricas asociadas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="text-xs font-semibold h-8 rounded-xl cursor-pointer">
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting} className="text-xs font-semibold h-8 rounded-xl cursor-pointer">
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                Eliminando...
              </>
            ) : (
              'Eliminar'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
