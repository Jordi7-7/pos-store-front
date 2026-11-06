import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { useConfirm } from './useConfirm';

function Harness({ onResult }: { onResult: (accepted: boolean) => void }) {
  const { confirm, confirmDialog } = useConfirm();
  return (
    <>
      <button onClick={async () => onResult(await confirm({ title: 'Eliminar imagen', message: 'No se puede deshacer.', confirmLabel: 'Eliminar', destructive: true }))}>Abrir</button>
      {confirmDialog}
    </>
  );
}

describe('useConfirm', () => {
  it('muestra el diálogo propio y resuelve true al confirmar', async () => {
    const results: boolean[] = [];
    render(<Harness onResult={(accepted) => results.push(accepted)} />);
    await userEvent.click(screen.getByText('Abrir'));
    expect(await screen.findByText('No se puede deshacer.')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    await act(async () => {});
    expect(results).toEqual([true]);
  });

  it('resuelve false al cancelar y el diálogo se cierra', async () => {
    const results: boolean[] = [];
    render(<Harness onResult={(accepted) => results.push(accepted)} />);
    await userEvent.click(screen.getByText('Abrir'));
    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));
    await act(async () => {});
    expect(results).toEqual([false]);
    expect(screen.queryByText('No se puede deshacer.')).toBeNull();
  });
});
