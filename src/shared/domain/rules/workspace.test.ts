import { describe, expect, it } from 'vitest';
import { reconcileWorkspace, type WorkspaceAccess } from './workspace';

const two: WorkspaceAccess = {
  branches: [{ id: 'b1' }, { id: 'b2' }],
  cashRegisters: [
    { id: 'c1', branchId: 'b1' },
    { id: 'c2', branchId: 'b1' },
    { id: 'c3', branchId: 'b2' },
  ],
};
const none = { selectedBranchId: null, selectedCashRegisterId: null };

describe('reconcileWorkspace', () => {
  it('conserva una selección válida', () => {
    expect(reconcileWorkspace({ selectedBranchId: 'b1', selectedCashRegisterId: 'c2' }, two)).toEqual({
      selectedBranchId: 'b1',
      selectedCashRegisterId: 'c2',
    });
  });

  it('descarta una sucursal que el usuario ya no tiene asignada', () => {
    expect(reconcileWorkspace({ selectedBranchId: 'b9', selectedCashRegisterId: null }, two).selectedBranchId).toBeNull();
  });

  it('descarta una caja que pertenece a otra sucursal que la elegida', () => {
    expect(reconcileWorkspace({ selectedBranchId: 'b1', selectedCashRegisterId: 'c3' }, two).selectedCashRegisterId).toBeNull();
  });

  it('descarta una caja que el usuario no tiene asignada', () => {
    expect(reconcileWorkspace({ selectedBranchId: 'b1', selectedCashRegisterId: 'c9' }, two).selectedCashRegisterId).toBeNull();
  });

  it('con una sola sucursal la elige; con varias no elige ninguna ("todas")', () => {
    const one: WorkspaceAccess = { branches: [{ id: 'b1' }], cashRegisters: [] };
    expect(reconcileWorkspace(none, one).selectedBranchId).toBe('b1');
    expect(reconcileWorkspace(none, two).selectedBranchId).toBeNull();
  });

  it('elige la caja sola cuando solo hay una en el ámbito (sucursal elegida)', () => {
    expect(reconcileWorkspace({ selectedBranchId: 'b2', selectedCashRegisterId: null }, two).selectedCashRegisterId).toBe('c3');
    expect(reconcileWorkspace({ selectedBranchId: 'b1', selectedCashRegisterId: null }, two).selectedCashRegisterId).toBeNull();
  });

  it('sin permisos sobre nada, no queda nada seleccionado', () => {
    expect(reconcileWorkspace({ selectedBranchId: 'b1', selectedCashRegisterId: 'c1' }, { branches: [], cashRegisters: [] })).toEqual(none);
  });
});
