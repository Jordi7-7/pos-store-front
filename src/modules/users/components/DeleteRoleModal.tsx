import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import type { RoleItem } from '../services/roles.service';

interface DeleteRoleModalProps {
  roleToDelete: RoleItem | null;
  onClose: () => void;
  onConfirmDelete: (roleId: string) => Promise<void>;
  isDeleting: boolean;
}

export const DeleteRoleModal: React.FC<DeleteRoleModalProps> = ({
  roleToDelete,
  onClose,
  onConfirmDelete,
  isDeleting,
}) => {
  return (
    <Dialog open={!!roleToDelete} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-bg-card border border-border-card p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-secondary flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span>¿Eliminar rol?</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral mt-1 leading-relaxed">
            Estás a punto de eliminar permanentemente el rol{' '}
            <strong className="text-foreground">"{roleToDelete?.name}"</strong>. Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <div className="p-3 rounded-xl bg-bg-dark border border-border-card text-xs space-y-1.5 mt-2">
          <div className="flex justify-between text-muted-foreground">
            <span>Usuarios vinculados:</span>
            <strong className="text-foreground">{roleToDelete?.userCount || 0}</strong>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Permisos asignados:</span>
            <strong className="text-foreground font-mono">
              {roleToDelete?.permissions?.includes('*') ? 'Todos (*)' : roleToDelete?.permissions?.length || 0}
            </strong>
          </div>
        </div>

        <div className="pt-3 flex justify-end gap-2 border-t border-border-card/60 mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
            className="text-xs"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isDeleting}
            onClick={async () => {
              if (!roleToDelete) return;
              await onConfirmDelete(roleToDelete.id);
            }}
            className="text-xs font-bold gap-1.5 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
          >
            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            <span>Eliminar Rol</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
