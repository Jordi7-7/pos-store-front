import React from 'react';
import { AlertCircle, ArrowRight, Building2, Loader2 } from 'lucide-react';

interface TenantSlugFormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  isSearching: boolean;
  error: string | null;
}

/** Primer paso: la persona escribe el identificador de su tienda. */
export const TenantSlugForm: React.FC<TenantSlugFormProps> = ({ value, onChange, onSubmit, isSearching, error }) => (
  <div className="w-full max-w-sm animate-fade-up">
    <h2 className="text-3xl font-semibold tracking-tight text-secondary">Bienvenido</h2>
    <p className="mt-2 text-sm text-muted-foreground">Escribe el identificador de tu tienda para abrir la terminal.</p>

    {error && (
      <div role="alert" className="mt-6 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-600">
        <AlertCircle className="size-4 shrink-0" />
        <span>{error}</span>
      </div>
    )}

    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      <div>
        <label htmlFor="tenant-slug" className="mb-1.5 block text-[13px] font-medium text-secondary">
          Identificador de la tienda
        </label>
        <div className="relative">
          <Building2 className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            id="tenant-slug"
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="ej: zapateria-gomez"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            autoFocus
            className="h-12 w-full rounded-xl border border-border bg-card pl-12 pr-4 font-mono text-[15px] text-secondary shadow-xs outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Si no lo recuerdas, pídeselo a quien administra tu negocio.</p>
      </div>

      <button
        type="submit"
        disabled={isSearching}
        className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white shadow-lg shadow-black/10 transition-all hover:bg-primary-hover hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 active:scale-[0.99] disabled:opacity-60"
      >
        {isSearching ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            Entrar a la tienda
            <ArrowRight className="size-4" />
          </>
        )}
      </button>
    </form>
  </div>
);
