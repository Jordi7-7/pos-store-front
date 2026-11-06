import React from 'react';
import { Delete, Loader2 } from 'lucide-react';

interface PinPadProps {
  pin: string;
  length: number;
  isLoading: boolean;
  hasError: boolean;
  shake: boolean;
  onDigit: (digit: string) => void;
  onDelete: () => void;
  onClear: () => void;
  onSubmit: () => void;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];

/** Teclado numérico para el PIN del cajero (también responde al teclado físico, que escucha la pantalla). */
export const PinPad: React.FC<PinPadProps> = ({ pin, length, isLoading, hasError, shake, onDigit, onDelete, onClear, onSubmit }) => (
  <div className="flex animate-fade-up flex-col items-center gap-7">
    <div role="img" aria-label={`PIN: ${pin.length} de ${length} dígitos`} className={`flex gap-3.5 py-1 ${shake ? 'animate-shake' : ''}`}>
      {Array.from({ length }).map((_, index) => (
        <span
          key={index}
          className={`size-4 rounded-full border-2 transition-all duration-200 ${
            hasError ? 'border-rose-500 bg-rose-500/30' : index < pin.length ? 'scale-110 border-primary bg-primary' : 'border-border bg-card'
          }`}
        />
      ))}
    </div>

    <div className="grid w-full max-w-[300px] grid-cols-3 gap-3">
      {KEYS.map((key) => {
        const isClear = key === 'C';
        const isBackspace = key === '⌫';
        return (
          <button
            key={key}
            type="button"
            disabled={isLoading}
            aria-label={isBackspace ? 'Borrar un dígito' : isClear ? 'Borrar todo' : key}
            onClick={() => (isClear ? onClear() : isBackspace ? onDelete() : onDigit(key))}
            className={`flex h-14 cursor-pointer select-none items-center justify-center rounded-2xl border text-xl font-semibold outline-none transition-all duration-150 focus-visible:ring-4 focus-visible:ring-primary/15 active:scale-95 disabled:opacity-50 ${
              isClear || isBackspace
                ? 'border-transparent bg-transparent text-sm text-muted-foreground hover:bg-card hover:text-secondary'
                : 'border-border bg-card text-secondary shadow-xs hover:border-primary/40 hover:shadow-md'
            }`}
          >
            {isBackspace ? <Delete className="size-5" /> : key}
          </button>
        );
      })}
    </div>

    <button
      type="button"
      disabled={isLoading || pin.length < 4}
      onClick={onSubmit}
      className="flex h-12 w-full max-w-[300px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white shadow-lg shadow-black/10 transition-all hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {isLoading ? <Loader2 className="size-4 animate-spin" /> : 'Entrar al POS'}
    </button>
  </div>
);
