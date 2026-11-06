import React from 'react';
import { LockKeyhole, Wallet } from 'lucide-react';

interface ShiftClosedNoticeProps {
  canOpen: boolean;
  onOpen: () => void;
}

/** Aviso cuando no hay turno abierto: explica por qué no se puede cobrar y da el paso siguiente. */
export const ShiftClosedNotice: React.FC<ShiftClosedNoticeProps> = ({ canOpen, onOpen }) => (
  <div role="status" className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-amber-500/40 bg-amber-500/10 p-4">
    <div className="rounded-xl bg-amber-500/20 p-2.5 text-amber-500">
      <LockKeyhole className="h-6 w-6" />
    </div>
    <div className="min-w-[12rem] flex-1">
      <p className="text-sm font-bold text-secondary">Todavía no hay un turno abierto</p>
      <p className="text-xs text-neutral">Puedes armar el carrito, pero para cobrar necesitas abrir tu turno con el fondo inicial.</p>
    </div>
    {canOpen && (
      <button
        type="button"
        onClick={onOpen}
        className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-xs transition-colors hover:bg-primary-hover cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        <Wallet className="h-4 w-4" />
        Abrir turno
      </button>
    )}
  </div>
);
