import React, { useState } from 'react';
import { Bluetooth, CheckCircle2, Gauge, Loader2, Monitor, Printer, Unplug, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { deviceErrorMessage, isNoPrinterConfigured } from '@/modules/printing/domain/rules/device-error';
import type { LabelProtocol } from '@/modules/printing/domain/entities/label';
import { labelPrinterService } from '@/modules/printing/infrastructure/printers/label-printer.service';
import type { LabelPrinterState } from '@/modules/printing/presentation/hooks/useLabelPrinter';
import { useTicketFormat } from '@/modules/printing/presentation/hooks/useTicketFormat';
import { LabelSizePicker } from './LabelSizePicker';

interface LabelPrinterConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  printer: LabelPrinterState;
  storeName: string;
}

const LANGUAGES: Array<{ value: LabelProtocol; title: string; hint: string }> = [
  { value: 'TSPL', title: 'TSPL', hint: 'La mayoría: Xprinter, TSC, Gprinter, HPRT, Munbyn…' },
  { value: 'ZPL', title: 'ZPL', hint: 'Impresoras Zebra' },
];

const Section: React.FC<{ step: number; title: string; children: React.ReactNode }> = ({ step, title, children }) => (
  <section className="space-y-3">
    <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
      <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{step}</span>
      {title}
    </h3>
    {children}
  </section>
);

/** Tamaño de las etiquetas y cómo se conecta la impresora. Los cambios se guardan al momento. */
export const LabelPrinterConfigModal: React.FC<LabelPrinterConfigModalProps> = ({ isOpen, onClose, printer, storeName }) => {
  const { config, connected, supported, update, connect, disconnect } = printer;
  const format = useTicketFormat();
  const [busy, setBusy] = useState<'connect' | 'test' | 'calibrate' | null>(null);

  const run = async (kind: 'connect' | 'test' | 'calibrate', action: () => Promise<void>) => {
    setBusy(kind);
    try {
      await action();
    } catch (err) {
      toast.error(isNoPrinterConfigured(err) ? 'Primero conecta la impresora.' : deviceErrorMessage(err, 'No se pudo hablar con la impresora. Revisa que esté encendida y conectada.'));
    } finally {
      setBusy(null);
    }
  };

  const handleConnect = () =>
    run('connect', async () => {
      if (await connect()) toast.success('Impresora conectada.');
    });
  const handleTest = () =>
    run('test', async () => {
      await labelPrinterService.printTestLabel(storeName, format);
      toast.success('Se enviaron 2 etiquetas de prueba: medidas y muestra.');
    });
  const handleCalibrate = () =>
    run('calibrate', async () => {
      await labelPrinterService.calibrate();
      toast.success('Calibrando: la impresora avanzará unas etiquetas. Espera a que termine.');
    });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[92vh] flex-col overflow-hidden border border-border bg-card p-0 text-foreground shadow-2xl sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
          <DialogTitle className="text-base font-semibold">Mi impresora de etiquetas</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">Elige el tamaño de tus etiquetas y cómo se conecta la impresora. Los cambios se guardan solos.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-7 overflow-y-auto px-6 py-5 text-sm">
          <Section step={1} title="¿De qué tamaño son tus etiquetas?">
            <LabelSizePicker config={config} onChange={update} />
            <details className="rounded-xl border border-border p-3 text-xs text-muted-foreground">
              <summary className="cursor-pointer font-semibold text-foreground">Opciones avanzadas: resolución de la impresora</summary>
              <div className="mt-2 space-y-2">
                <label className="flex flex-wrap items-center gap-2">
                  Resolución
                  <select aria-label="Resolución de la impresora" value={config.dpi} onChange={(e) => update({ dpi: e.target.value === '300' ? 300 : 203 })} className="rounded-lg border border-border bg-background px-2 py-1 text-xs font-semibold text-foreground">
                    <option value={203}>203 dpi (la más común)</option>
                    <option value={300}>300 dpi</option>
                  </select>
                </label>
                <p>
                  Debe ser la <strong>resolución real de tu impresora</strong>, no la que quieras. Casi todas las de etiquetas baratas son de 203 dpi. Si eliges 300 en una de 203, la etiqueta sale agrandada y se desborda. Para comprobarlo, imprime la etiqueta de prueba: su regla debe medir lo que dice.
                </p>
              </div>
            </details>
          </Section>

          <Section step={2} title="¿Cómo imprimes?">
            <div className="space-y-3 rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Bluetooth className="mt-0.5 size-4 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground">Directo a la impresora (Bluetooth o cable USB)</p>
                    <p className="text-xs text-muted-foreground">Un clic y sale, sin ventanas. Recomendado si tu impresora es de etiquetas.</p>
                  </div>
                </div>
                <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${connected ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700' : 'border-amber-500/30 bg-amber-500/10 text-amber-700'}`}>
                  {connected && <CheckCircle2 className="size-3" />}
                  {connected ? 'Conectada' : 'Sin conectar'}
                </span>
              </div>

              {!supported ? (
                <p role="alert" className="rounded-lg bg-amber-500/10 p-3 text-xs text-amber-700">Este navegador no permite conectarse directo a la impresora. Usa Chrome o Edge en computadora, o imprime con el controlador del sistema (abajo).</p>
              ) : (
                <>
                  <ol className="list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
                    <li><strong>Bluetooth:</strong> primero empareja la impresora en los ajustes del sistema. <strong>Cable USB:</strong> conéctala y enciéndela.</li>
                    <li>Pulsa «{connected ? 'Cambiar impresora' : 'Conectar impresora'}» y elige su puerto en la lista (suele llamarse COM o serie).</li>
                    <li>Haz una etiqueta de prueba para comprobar que sale bien.</li>
                  </ol>

                  <fieldset className="space-y-1.5">
                    <legend className="text-xs font-semibold text-foreground">Lenguaje de la impresora</legend>
                    <div className="grid grid-cols-2 gap-2">
                      {LANGUAGES.map((language) => (
                        <button key={language.value} type="button" aria-pressed={config.protocol === language.value} onClick={() => update({ protocol: language.value })} className={`cursor-pointer rounded-xl border px-3 py-2 text-left transition-colors ${config.protocol === language.value ? 'border-primary bg-primary/10 ring-1 ring-primary/30' : 'border-border hover:border-primary/40'}`}>
                          <span className="block text-sm font-semibold">{language.title}</span>
                          <span className="block text-xs text-muted-foreground">{language.hint}</span>
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <div className="flex flex-wrap gap-2">
                    <Button type="button" onClick={handleConnect} disabled={busy !== null}>
                      {busy === 'connect' ? <Loader2 className="animate-spin" /> : <Zap />}
                      {connected ? 'Cambiar impresora' : 'Conectar impresora'}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleTest} disabled={!connected || busy !== null} title="Imprime una etiqueta de medidas (marco y regla) y una de muestra">
                      {busy === 'test' ? <Loader2 className="animate-spin" /> : <Printer />}
                      Etiqueta de prueba (2)
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCalibrate} disabled={!connected || busy !== null} title="La impresora mide la separación entre etiquetas">
                      {busy === 'calibrate' ? <Loader2 className="animate-spin" /> : <Gauge />}
                      Calibrar rollo
                    </Button>
                    {connected && (
                      <Button type="button" variant="ghost" onClick={() => void disconnect().then(() => toast.info('Impresora desvinculada.'))} disabled={busy !== null}>
                        <Unplug />
                        Desvincular
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <strong>Etiqueta de prueba:</strong> sale una de medidas (un marco en el borde y una regla) y otra de muestra. Si el marco sale cortado o corrido, o la regla no mide lo que dice, revisa el tamaño y la separación.
                    <br />
                    <strong>Calibrar rollo:</strong> úsalo al cambiar de rollo; la impresora avanza unas etiquetas para medir la separación. Si tu modelo no responde, mantén pulsado su botón de avance unos segundos: en muchos modelos así se calibra.
                  </p>
                </>
              )}
            </div>

            <div className="space-y-1.5 rounded-xl border border-border p-4">
              <div className="flex items-start gap-2.5">
                <Monitor className="mt-0.5 size-4 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Con el controlador del sistema (cualquier impresora)</p>
                  <p className="text-xs text-muted-foreground">
                    Sirve con la impresora que tengas instalada en Windows o Mac, por USB, Bluetooth o red. En la ventana de impresión elige tu impresora, pon el papel en {config.widthMm} × {config.heightMm} mm y desactiva márgenes y escala.
                  </p>
                </div>
              </div>
            </div>
          </Section>
        </div>

        <DialogFooter className="shrink-0 border-t border-border px-6 py-3">
          <Button type="button" onClick={onClose}>Listo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
