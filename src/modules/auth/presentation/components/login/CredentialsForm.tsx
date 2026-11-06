import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Loader2, Lock, User } from 'lucide-react';

interface CredentialsFormProps {
  identifier: string;
  password: string;
  error: string;
  isLoading: boolean;
  onIdentifierChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}

const FIELD = 'h-12 w-full rounded-xl border border-border bg-card pl-12 pr-4 text-[15px] text-secondary shadow-xs outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10';

/** Acceso con usuario o correo y contraseña (administración). */
export const CredentialsForm: React.FC<CredentialsFormProps> = ({ identifier, password, error, isLoading, onIdentifierChange, onPasswordChange, onSubmit }) => {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <form onSubmit={onSubmit} className="animate-fade-up space-y-5">
      {error && (
        <div role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm font-medium text-rose-600">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="login-identifier" className="mb-1.5 block text-[13px] font-medium text-secondary">
          Usuario o correo
        </label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input id="login-identifier" type="text" value={identifier} onChange={(event) => onIdentifierChange(event.target.value)} placeholder="cajero1 o admin@tienda.com" autoComplete="username" className={FIELD} />
        </div>
      </div>

      <div>
        <label htmlFor="login-password" className="mb-1.5 block text-[13px] font-medium text-secondary">
          Contraseña
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input id="login-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => onPasswordChange(event.target.value)} placeholder="••••••••" autoComplete="current-password" className={`${FIELD} pr-12`} />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-secondary"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-white shadow-lg shadow-black/10 transition-all hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 active:scale-[0.99] disabled:opacity-60"
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            Acceder al Sistema
            <ArrowRight className="size-4" />
          </>
        )}
      </button>
    </form>
  );
};
