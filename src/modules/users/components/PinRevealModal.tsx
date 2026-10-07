import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { UserItem } from '../services/users.service';
import { Key, ShieldAlert, Check, Copy } from 'lucide-react';

interface PinRevealModalProps {
  isOpen: boolean;
  onClose: () => void;
  pin: string;
  targetUser?: UserItem | null;
  copied: boolean;
  onCopy: () => void;
}

export const PinRevealModal: React.FC<PinRevealModalProps> = ({
  isOpen,
  onClose,
  pin,
  targetUser,
  copied,
  onCopy,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-bg-card border border-border-card p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-secondary flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            <span>Nuevo PIN Asignado</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral">
            PIN generado para <span className="text-secondary font-semibold">{targetUser?.name}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          <div className="bg-bg-dark border border-border-card rounded-2xl p-6 text-center space-y-2 relative overflow-hidden">
            <span className="text-[10px] uppercase font-bold tracking-widest text-primary block">
              Código de Cajero POS
            </span>
            <div className="text-4xl font-mono font-black tracking-widest text-secondary select-all">
              {pin}
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Copia o anota este PIN ahora. Por motivos de seguridad, el sistema lo encripta y no podrá volver a mostrarse en texto plano.
            </span>
          </div>
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <Button
            type="button"
            onClick={onCopy}
            className="w-full text-xs font-bold gap-1.5 shadow-md shadow-primary/20 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '¡PIN Copiado!' : 'Copiar PIN al Portapapeles'}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
