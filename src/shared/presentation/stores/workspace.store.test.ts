import { beforeEach, describe, expect, it } from 'vitest';
import { useWorkspaceStore } from './workspace.store';

beforeEach(() => useWorkspaceStore.getState().reset());

describe('useWorkspaceStore', () => {
  it('cambiar de sucursal borra la caja elegida (era de la anterior)', () => {
    const s = useWorkspaceStore.getState();
    s.setSelectedBranchId('b1');
    s.setSelectedCashRegisterId('c1');
    useWorkspaceStore.getState().setSelectedBranchId('b2');
    expect(useWorkspaceStore.getState()).toMatchObject({ selectedBranchId: 'b2', selectedCashRegisterId: null });
  });

  it('volver a elegir la misma sucursal NO borra la caja', () => {
    const s = useWorkspaceStore.getState();
    s.setSelectedBranchId('b1');
    s.setSelectedCashRegisterId('c1');
    useWorkspaceStore.getState().setSelectedBranchId('b1');
    expect(useWorkspaceStore.getState().selectedCashRegisterId).toBe('c1');
  });

  it('solo guarda ids, en su propia clave', () => {
    useWorkspaceStore.getState().setSelectedBranchId('b1');
    const saved = JSON.parse(localStorage.getItem('aura-pos-workspace') ?? '{}') as { version: number; state: object };
    expect(saved.version).toBe(1);
    expect(Object.keys(saved.state).sort()).toEqual(['selectedBranchId', 'selectedCashRegisterId']);
  });
});
