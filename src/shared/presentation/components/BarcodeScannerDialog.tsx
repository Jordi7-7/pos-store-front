import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CameraOff, Check, Flashlight, FlashlightOff, Loader2, RefreshCw, X, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { pushScanResult, type ScanResultEntry } from '../../domain/rules/scan-history';
import { beep } from '../../infrastructure/scanner/beep';
import { useBarcodeScanner, type ScannerStatus } from '../hooks/useBarcodeScanner';

/** Qué hacer con la cámara tras procesar un código. */
export type ScanOutcome = 'continue' | 'close';

/** Lo que quien recibe el código le cuenta al escáner para mostrarlo sobre la cámara. */
export interface ScanFeedback {
  status: 'ok' | 'error';
  /** «Playera M agregada», «El código X no existe»… */
  message: string;
  outcome?: ScanOutcome;
}

export type ScanResponse = ScanOutcome | ScanFeedback | void;

interface BarcodeScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Recibe cada código leído (o tecleado). Puede responder qué mostrar y si cerrar o seguir. */
  onDetected: (code: string) => ScanResponse | Promise<ScanResponse>;
  /** Sigue leyendo código tras código (venta, ingreso); si no, se cierra tras el primero. */
  continuous?: boolean;
  title?: string;
}

const PROBLEMS: Record<Exclude<ScannerStatus, 'starting' | 'scanning'>, { title: string; hint: string }> = {
  denied: { title: 'No hay permiso para usar la cámara', hint: 'Pulsa el candado de la barra de direcciones, permite la cámara para este sitio y vuelve a abrir el escáner. También puedes escribir el código abajo.' },
  'no-camera': { title: 'No se encontró una cámara', hint: 'Conecta una cámara, usa un lector de códigos de barras o escribe el código abajo.' },
  insecure: { title: 'La cámara solo funciona con conexión segura', hint: 'Abre el sistema con https:// (o desde localhost). Por http el navegador bloquea la cámara.' },
  error: { title: 'No se pudo encender la cámara', hint: 'Cierra otras aplicaciones que la estén usando e inténtalo de nuevo, o escribe el código abajo.' },
};

const FLASH_MS = 900;

/** Escáner de códigos de barras con la cámara del dispositivo (teléfono, tableta o computadora). */
export const BarcodeScannerDialog: React.FC<BarcodeScannerDialogProps> = ({ open, onOpenChange, onDetected, continuous = false, title = 'Escanear código de barras' }) => {
  const [history, setHistory] = useState<ScanResultEntry[]>([]);
  const [flash, setFlash] = useState<'ok' | 'error' | null>(null);
  const [typed, setTypedCode] = useState('');
  const busy = useRef(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (open) {
      setHistory([]);
      setFlash(null);
      setTypedCode('');
    }
    return () => clearTimeout(flashTimer.current);
  }, [open]);

  const handleCode = useCallback(
    async (code: string) => {
      if (busy.current) return;
      busy.current = true;
      try {
        const response = await onDetected(code);
        const feedback: ScanFeedback = typeof response === 'object' && response !== null ? response : { status: 'ok', message: `Leído: ${code}`, outcome: response ?? undefined };
        beep(feedback.status === 'ok');
        setFlash(feedback.status);
        clearTimeout(flashTimer.current);
        flashTimer.current = setTimeout(() => setFlash(null), FLASH_MS);
        setHistory((current) => pushScanResult(current, { status: feedback.status, message: feedback.message }));
        if (feedback.outcome === 'close' || !continuous) onOpenChange(false);
      } finally {
        busy.current = false;
      }
    },
    [onDetected, continuous, onOpenChange],
  );

  const scanner = useBarcodeScanner({ active: open, onCode: (code) => void handleCode(code) });
  const problem = scanner.status in PROBLEMS ? PROBLEMS[scanner.status as keyof typeof PROBLEMS] : null;
  const latest = history[0];
  const total = history.reduce((sum, entry) => sum + (entry.status === 'ok' ? entry.count : 0), 0);

  const submitTyped = (event: React.FormEvent) => {
    event.preventDefault();
    const code = typed.trim();
    if (!code) return;
    setTypedCode('');
    void handleCode(code);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[96dvh] gap-3 overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{continuous ? 'Apunta al código de barras de cada producto. Se van agregando solos; cierra cuando termines.' : 'Apunta la cámara al código de barras.'}</DialogDescription>
        </DialogHeader>

        {problem ? (
          <div role="alert" className="flex flex-col items-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-8 text-center">
            <CameraOff className="size-8 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">{problem.title}</p>
            <p className="max-w-sm text-xs text-muted-foreground">{problem.hint}</p>
          </div>
        ) : (
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-black max-sm:aspect-[3/4]">
            <video ref={scanner.videoRef} muted playsInline autoPlay className="size-full object-cover" aria-label="Vista de la cámara" />
            <div className={`pointer-events-none absolute inset-x-[8%] top-1/2 h-[34%] -translate-y-1/2 rounded-lg border-4 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] transition-colors duration-200 ${flash === 'ok' ? 'border-emerald-400' : flash === 'error' ? 'border-red-500' : 'border-white/80'}`}>
              <div className="absolute inset-x-2 top-1/2 h-0.5 -translate-y-1/2 bg-red-500/80" />
            </div>
            {scanner.status === 'starting' && (
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 text-sm text-white">
                <Loader2 className="size-4 animate-spin" />
                Encendiendo la cámara…
              </div>
            )}
            {flash && latest && (
              <div role="status" className={`absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white shadow-lg ${flash === 'ok' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                {flash === 'ok' ? <Check className="size-4 shrink-0" /> : <X className="size-4 shrink-0" />}
                <span className="truncate">{latest.message}</span>
              </div>
            )}
            <div className="absolute right-2 top-2 flex gap-1.5">
              {scanner.torchSupported && (
                <Button type="button" size="icon-sm" variant="secondary" onClick={() => void scanner.toggleTorch()} aria-label={scanner.torchOn ? 'Apagar la linterna' : 'Encender la linterna'}>
                  {scanner.torchOn ? <FlashlightOff /> : <Flashlight />}
                </Button>
              )}
              {scanner.canSwitchCamera && (
                <Button type="button" size="icon-sm" variant="secondary" onClick={scanner.switchCamera} aria-label="Cambiar de cámara">
                  <RefreshCw />
                </Button>
              )}
            </div>
          </div>
        )}

        {scanner.zoom && !problem && (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <ZoomIn className="size-4 shrink-0" />
            <span className="sr-only">Zoom de la cámara</span>
            <input type="range" min={scanner.zoom.min} max={scanner.zoom.max} step={scanner.zoom.step || 0.1} value={scanner.zoom.value} onChange={(event) => void scanner.changeZoom(Number(event.target.value))} aria-label="Zoom de la cámara" className="w-full accent-primary" />
          </label>
        )}

        {continuous && history.length > 0 && (
          <ul className="space-y-1 text-xs" aria-label="Últimas lecturas">
            {history.map((entry, index) => (
              <li key={`${entry.message}-${index}`} className={`flex items-center gap-2 rounded-md px-2 py-1 ${entry.status === 'ok' ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300' : 'bg-red-500/10 text-red-700 dark:text-red-300'} ${index === 0 ? 'font-semibold' : 'opacity-80'}`}>
                {entry.status === 'ok' ? <Check className="size-3.5 shrink-0" /> : <X className="size-3.5 shrink-0" />}
                <span className="flex-1 truncate">{entry.message}</span>
                {entry.count > 1 && <span className="font-mono">×{entry.count}</span>}
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={submitTyped} className="flex gap-2">
          <Input value={typed} onChange={(event) => setTypedCode(event.target.value)} placeholder="¿No lee? Escribe el código…" aria-label="Escribir el código a mano" className="font-mono" />
          <Button type="submit" variant="outline" disabled={!typed.trim()}>
            Agregar
          </Button>
        </form>

        <div className="flex min-h-9 items-center justify-between gap-3 text-xs text-muted-foreground" aria-live="polite">
          <span>{continuous ? (total > 0 ? <><strong className="text-foreground">{total}</strong> agregado{total === 1 ? '' : 's'}</> : 'Esperando un código…') : latest ? latest.message : 'Esperando un código…'}</span>
          <Button type="button" size="sm" variant={continuous ? 'default' : 'ghost'} onClick={() => onOpenChange(false)}>
            {continuous ? 'Listo' : 'Cerrar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
