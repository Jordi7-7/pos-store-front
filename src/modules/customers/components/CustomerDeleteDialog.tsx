import React from 'react';
import { Loader2 } from 'lucide-react';
import type { CustomerEntity } from '../entities/customer.entity';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface CustomerDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerEntity | null;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export const CustomerDeleteDialog: React.FC<CustomerDeleteDialogProps> = ({
  isOpen,
  onClose,
  customer,
  onConfirm,
  isDeleting,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm bg-card border border-border rounded-2xl shadow-xl p-6 text-foreground">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            Eliminar Cliente
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral mt-1">
            ¿Estás seguro de que deseas eliminar a{' '}
            <strong className="text-secondary uppercase">{customer?.name}</strong>? Esta acción no se
            puede deshacer y desvinculará sus datos directos del directorio.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-2 border-t border-border pt-4 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="text-xs font-semibold h-9 rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold h-9 rounded-xl border-none cursor-pointer"
          >
            {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
            Confirmar Eliminar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
