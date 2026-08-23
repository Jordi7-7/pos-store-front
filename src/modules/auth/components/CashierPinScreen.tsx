import React, { useState, useEffect, useCallback } from 'react';
import { Delete, LogOut, Loader2, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../hooks/useAuthStore';
import { toast } from 'sonner';

const DOTS = 6;

export const CashierPinScreen: React.FC = () => {
  const { user, pinLogin, logout } = useAuthStore();
  const [pin, setPin] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = useCallback(async (submittedPin: string) => {
    if (submittedPin.length !== DOTS) return;
    setIsLoading(true);
    setError(false);
    const ok = await pinLogin(submittedPin);
    setIsLoading(false);
    if (!ok) {
      setError(true);
      setShake(true);
      setPin('');
      toast.error('PIN incorrecto. Intenta de nuevo.');
      setTimeout(() => setShake(false), 600);
    }
  }, [pinLogin]);

  const handleKey = useCallback((digit: string) => {
    if (isLoading) return;
    setError(false);
    setPin((prev) => {
      const next = prev.length < DOTS ? prev + digit : prev;
      if (next.length === DOTS) {
        // Submit after short delay so last dot animates
        setTimeout(() => handleSubmit(next), 80);
      }
      return next;
    });
  }, [isLoading, handleSubmit]);

  const handleDelete = useCallback(() => {
    if (isLoading) return;
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  }, [isLoading]);

  // Physical keyboard support
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleKey(e.key);
      if (e.key === 'Backspace') handleDelete();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKey, handleDelete]);

  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[50%] translate-x-[-50%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-violet-500/8 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm px-6 flex flex-col items-center gap-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/15 border border-primary/25 mb-2">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-extrabold text-secondary tracking-tight">Ingresa tu PIN</h1>
          <p className="text-sm text-neutral">
            Bienvenido, <span className="text-secondary font-semibold">{user?.name}</span>
          </p>
          <p className="text-xs text-neutral/70">Ingresa el PIN de 6 dígitos del cajero</p>
        </div>

        {/* PIN dots */}
        <div
          className={`flex gap-3 transition-all ${shake ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}
          style={shake ? { animation: 'shake 0.4s ease-in-out' } : {}}
        >
          {Array.from({ length: DOTS }).map((_, i) => {
            const filled = i < pin.length;
            const isError = error;
            return (
              <div
                key={i}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isError
                    ? 'bg-rose-500 scale-110'
                    : filled
                    ? 'bg-primary scale-110 shadow-[0_0_12px_2px_rgba(var(--color-primary)/0.4)]'
                    : 'bg-border-card border-2 border-border-card'
                }`}
              />
            );
          })}
        </div>

        {/* Numeric keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
          {keys.map((key, idx) => {
            if (key === '') return <div key={idx} />;
            const isDelete = key === '⌫';
            return (
              <button
                key={idx}
                type="button"
                onClick={() => isDelete ? handleDelete() : handleKey(key)}
                disabled={isLoading}
                className={`
                  h-16 rounded-2xl font-bold text-xl transition-all active:scale-95 cursor-pointer select-none
                  ${isDelete
                    ? 'bg-transparent text-neutral hover:text-secondary hover:bg-bg-card border border-transparent hover:border-border-card'
                    : 'bg-bg-card border border-border-card text-secondary hover:border-primary/40 hover:bg-primary/5 hover:text-primary shadow-sm'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {isLoading && key === '⌫' ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />
                ) : isDelete ? (
                  <Delete className="w-5 h-5 mx-auto" />
                ) : (
                  key
                )}
              </button>
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <p className="text-xs text-rose-500 font-semibold animate-fade-in">
            PIN incorrecto. Verifica el código con tu administrador.
          </p>
        )}

        {/* Logout only */}
        <div className="flex flex-col items-center gap-3 pt-2 w-full">
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 text-xs text-neutral/60 hover:text-rose-500 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar sesión de Admin</span>
          </button>
        </div>
      </div>

      {/* Shake keyframe */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
};
