import React, { useCallback, useRef, useState } from 'react';
import { ConfirmDialog, type ConfirmOptions } from './ConfirmDialog';

/**
 * Pide confirmación con un diálogo propio y devuelve una promesa:
 * `if (!(await confirm({ title, message, destructive: true }))) return;`. Hay que pintar `confirmDialog` una vez en el componente.
 */
export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((accepted: boolean) => void) | null>(null);

  const confirm = useCallback(
    (next: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        resolver.current?.(false);
        resolver.current = resolve;
        setOptions(next);
      }),
    [],
  );

  const settle = (accepted: boolean) => {
    resolver.current?.(accepted);
    resolver.current = null;
    setOptions(null);
  };

  const confirmDialog: React.ReactNode = <ConfirmDialog open={options !== null} title={options?.title ?? ''} message={options?.message ?? ''} confirmLabel={options?.confirmLabel} cancelLabel={options?.cancelLabel} destructive={options?.destructive} onConfirm={() => settle(true)} onCancel={() => settle(false)} />;

  return { confirm, confirmDialog };
}
