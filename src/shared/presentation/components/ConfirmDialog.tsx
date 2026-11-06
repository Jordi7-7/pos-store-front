import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Acción que no se puede deshacer (eliminar, anular): el botón de confirmar va en rojo. */
  destructive?: boolean;
}

interface ConfirmDialogProps extends ConfirmOptions {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmación con el estilo de la app, en lugar del cuadro nativo del navegador. */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ open, title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', destructive = false, onConfirm, onCancel }) => (
  <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
    <DialogContent className="sm:max-w-md" showCloseButton={false}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{message}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button type="button" variant={destructive ? 'destructive' : 'default'} onClick={onConfirm} autoFocus>
          {confirmLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
