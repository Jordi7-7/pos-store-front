import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  EMPTY_WORKSPACE,
  reconcileWorkspace,
  type Workspace,
  type WorkspaceAccess,
} from '@/shared/domain/workspace';

interface WorkspaceState extends Workspace {
  setSelectedBranchId: (branchId: string | null) => void;
  setSelectedCashRegisterId: (registerId: string | null) => void;
  /** Ajusta la selección a lo que el perfil permite (se llama tras cargar el perfil). */
  reconcile: (access: WorkspaceAccess) => void;
  reset: () => void;
}

export const WORKSPACE_STORAGE_VERSION = 1;

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      ...EMPTY_WORKSPACE,

      // Cambiar de sucursal invalida la caja elegida (pertenece a la anterior).
      setSelectedBranchId: (branchId) =>
        set(branchId === get().selectedBranchId ? {} : { selectedBranchId: branchId, selectedCashRegisterId: null }),

      setSelectedCashRegisterId: (registerId) => set({ selectedCashRegisterId: registerId }),

      reconcile: (access) => {
        const next = reconcileWorkspace(get(), access);
        const { selectedBranchId, selectedCashRegisterId } = get();
        if (next.selectedBranchId !== selectedBranchId || next.selectedCashRegisterId !== selectedCashRegisterId) set(next);
      },

      reset: () => set(EMPTY_WORKSPACE),
    }),
    {
      name: 'aura-pos-workspace',
      version: WORKSPACE_STORAGE_VERSION,
      partialize: (state): Workspace => ({
        selectedBranchId: state.selectedBranchId,
        selectedCashRegisterId: state.selectedCashRegisterId,
      }),
    },
  ),
);
