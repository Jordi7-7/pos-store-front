/**
 * Espacio de trabajo: dónde está operando el usuario ahora (sucursal y caja elegidas).
 * No es parte de la sesión: cambia a menudo y puede ser inválido tras un cambio de permisos.
 * Se guardan solo ids; los datos (nombre, dirección…) se leen del perfil, así nunca quedan viejos.
 */
export interface Workspace {
  selectedBranchId: string | null;
  selectedCashRegisterId: string | null;
}

/** Lo que el usuario tiene permitido usar (sale del perfil). */
export interface WorkspaceAccess {
  branches: ReadonlyArray<{ id: string }>;
  cashRegisters: ReadonlyArray<{ id: string; branchId: string }>;
}

export const EMPTY_WORKSPACE: Workspace = { selectedBranchId: null, selectedCashRegisterId: null };

/**
 * Ajusta la selección a lo que el usuario puede usar:
 * - una sucursal que ya no tiene asignada se descarta; si solo tiene una, se elige sola;
 * - una caja que no pertenece a la sucursal elegida (o que no le toca) se descarta;
 *   si en ese ámbito solo hay una, se elige sola.
 */
export function reconcileWorkspace(current: Workspace, access: WorkspaceAccess): Workspace {
  const branchIds = access.branches.map((b) => b.id);

  let selectedBranchId = current.selectedBranchId;
  if (selectedBranchId && !branchIds.includes(selectedBranchId)) selectedBranchId = null;
  if (!selectedBranchId && branchIds.length === 1) selectedBranchId = branchIds[0] ?? null;

  const candidates = access.cashRegisters.filter((r) => !selectedBranchId || r.branchId === selectedBranchId);
  let selectedCashRegisterId = current.selectedCashRegisterId;
  if (selectedCashRegisterId && !candidates.some((r) => r.id === selectedCashRegisterId)) selectedCashRegisterId = null;
  if (!selectedCashRegisterId && candidates.length === 1) selectedCashRegisterId = candidates[0]?.id ?? null;

  return { selectedBranchId, selectedCashRegisterId };
}
