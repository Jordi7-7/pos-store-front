import React, { useState, useMemo } from 'react';
import { useCashRegisters, useCreateCashRegister, useUpdateCashRegister, useAssignUsersToRegister } from '../hooks/useCashRegisters';
import { useBranches } from '@/modules/branches';
import { useUsers } from '@/modules/users/hooks/useUsers';
import { usePermissions } from '@/hooks/usePermissions';
import { APP_PERMISSIONS } from '@/constants/permissions';
import {
  CreditCard,
  Plus,
  Building,
  UserCheck,
  CheckCircle2,
  Edit2,
  Users as UsersIcon,
  Search,
  Loader2,
  Clock,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';
import type { CashRegisterItem } from '../services/cash-registers.service';

export const CashRegistersView: React.FC = () => {
  const { can } = usePermissions();
  const canManage = can(APP_PERMISSIONS.CASH_REGISTERS_MANAGE);

  const { branches } = useBranches();
  const { users } = useUsers();

  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const { cashRegisters, isLoading } = useCashRegisters(
    selectedBranchFilter === 'ALL' ? undefined : selectedBranchFilter
  );

  const { createRegister, isCreating } = useCreateCashRegister();
  const { updateRegister, isUpdating } = useUpdateCashRegister();
  const { assignUsers, isAssigning } = useAssignUsersToRegister();

  // Modal Create
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createBranchId, setCreateBranchId] = useState('');
  const [createName, setCreateName] = useState('');

  // Modal Edit
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRegister, setEditingRegister] = useState<CashRegisterItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  // Modal Assign Users
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningRegister, setAssigningRegister] = useState<CashRegisterItem | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [assignUserSearch, setAssignUserSearch] = useState('');

  // Filtered registers
  const filteredRegisters = useMemo(() => {
    return cashRegisters.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.branchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `Caja ${r.code}`.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [cashRegisters, searchTerm]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setCreateBranchId(branches[0]?.id || '');
    setCreateName(`Caja ${cashRegisters.length + 1}`);
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createBranchId) {
      toast.error('Selecciona una sucursal');
      return;
    }
    if (!createName.trim()) {
      toast.error('Ingresa un nombre para la caja');
      return;
    }
    try {
      await createRegister({
        branchId: createBranchId,
        name: createName.trim(),
      });
      setShowCreateModal(false);
    } catch (err: any) {
      // Error handled by hook
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (reg: CashRegisterItem) => {
    setEditingRegister(reg);
    setEditName(reg.name);
    setEditIsActive(reg.isActive);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRegister) return;
    if (!editName.trim()) {
      toast.error('El nombre no puede estar vacío');
      return;
    }
    try {
      await updateRegister({
        id: editingRegister.id,
        input: {
          name: editName.trim(),
          isActive: editIsActive,
        },
      });
      setShowEditModal(false);
    } catch (err: any) {
      // Error handled by hook
    }
  };

  // Open Assign Users Modal
  const handleOpenAssign = (reg: CashRegisterItem) => {
    setAssigningRegister(reg);
    setSelectedUserIds(reg.assignedUserIds || []);
    setAssignUserSearch('');
    setShowAssignModal(true);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleAssignSubmit = async () => {
    if (!assigningRegister) return;
    try {
      await assignUsers({
        id: assigningRegister.id,
        userIds: selectedUserIds,
      });
      setShowAssignModal(false);
    } catch (err: any) {
      // Handled by hook
    }
  };

  // Filter users eligible for assignment (can filter by name/email/role)
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = assignUserSearch.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        u.email.toLowerCase().includes(q) ||
        u.roleName.toLowerCase().includes(q)
      );
    });
  }, [users, assignUserSearch]);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-bg-dark h-[calc(100vh-4rem)] overflow-hidden">
      {/* Top Header Controls */}
      <div className="border-b border-border-card bg-bg-card px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold text-secondary tracking-wide">
              Cajas Registradoras
            </h2>
          </div>
          <p className="text-xs text-neutral mt-0.5">
            Administra los puntos de cobro físicos de cada sucursal y qué personal tiene permiso para operarlos.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {canManage && (
            <Button
              onClick={handleOpenCreate}
              className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Caja</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="px-6 py-3 border-b border-border-card bg-bg-card/50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Branch filter */}
          <div className="flex items-center gap-1.5 bg-bg-dark border border-border-card rounded-xl px-3 py-1.5 text-xs text-secondary">
            <Building className="w-3.5 h-3.5 text-neutral" />
            <span className="text-[11px] text-neutral font-medium uppercase tracking-wider">Sucursal:</span>
            <select
              value={selectedBranchFilter}
              onChange={(e) => setSelectedBranchFilter(e.target.value)}
              className="bg-transparent font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-bg-card text-secondary">Todas las Sucursales</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id} className="bg-bg-card text-secondary">
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-neutral absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por caja o sucursal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-bg-dark border border-border-card rounded-xl text-xs text-secondary placeholder:text-neutral/60 focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>

        <div className="text-xs text-neutral font-medium">
          Total de cajas: <span className="text-secondary font-bold">{filteredRegisters.length}</span>
        </div>
      </div>

      {/* Main Grid List */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs">Cargando cajas registradoras...</span>
          </div>
        ) : filteredRegisters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CreditCard className="w-12 h-12 text-neutral/30 mb-3" />
            <h3 className="text-sm font-bold text-secondary">No se encontraron cajas registradoras</h3>
            <p className="text-xs text-neutral mt-1 max-w-sm">
              {searchTerm || selectedBranchFilter !== 'ALL'
                ? 'No hay cajas que coincidan con los filtros aplicados.'
                : 'Aún no has creado cajas registradoras para tus sucursales. Haz clic en "Nueva Caja" para habilitar tu primer punto de cobro.'}
            </p>
            {canManage && (
              <Button
                onClick={handleOpenCreate}
                variant="outline"
                size="sm"
                className="mt-4 text-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Crear Caja
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredRegisters.map((reg) => {
              const isTurnoAbierto = reg.isOpen;
              const assignedCount = (reg.assignedUserIds || []).length;

              return (
                <div
                  key={reg.id}
                  className={`bg-bg-card border rounded-2xl p-5 flex flex-col justify-between transition-all hover:border-primary/40 ${
                    reg.isActive ? 'border-border-card' : 'border-border-card/40 opacity-60'
                  }`}
                >
                  <div>
                    {/* Top Row: Code Badge & Status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-bg-dark border border-border-card text-[11px] font-mono font-bold text-primary">
                          #{reg.code}
                        </span>
                        <h4 className="text-sm font-bold text-secondary truncate" title={reg.name}>
                          {reg.name}
                        </h4>
                      </div>

                      {/* Status indicator */}
                      <div
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                          isTurnoAbierto
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-neutral/10 text-neutral border border-border-card'
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            isTurnoAbierto ? 'bg-emerald-500 animate-pulse' : 'bg-neutral/40'
                          }`}
                        />
                        <span>{isTurnoAbierto ? 'Abierta' : 'Cerrada'}</span>
                      </div>
                    </div>

                    {/* Branch Info */}
                    <div className="flex items-center gap-1.5 text-xs text-neutral mb-3">
                      <Building className="w-3.5 h-3.5 text-neutral/70 shrink-0" />
                      <span className="truncate">{reg.branchName}</span>
                    </div>

                    {/* Live Session Info if open */}
                    {isTurnoAbierto && reg.activeSession && (
                      <div className="p-2.5 rounded-xl bg-bg-dark border border-emerald-500/20 mb-3 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-neutral flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-400" /> Abierta por:
                          </span>
                          <span className="font-semibold text-secondary truncate max-w-[140px]">
                            {reg.activeSession.userName}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-neutral flex items-center gap-1">
                            <Wallet className="w-3 h-3 text-emerald-400" /> Fondo inicial:
                          </span>
                          <span className="font-mono font-bold text-emerald-400">
                            ${Number(reg.activeSession.openingBalance || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Assigned Users summary */}
                    <div className="border-t border-border-card/60 pt-3 mt-1 flex items-center justify-between text-xs text-neutral">
                      <span className="flex items-center gap-1.5">
                        <UsersIcon className="w-3.5 h-3.5 text-neutral" />
                        <span>Personal asignado:</span>
                      </span>
                      <span className="font-semibold text-secondary">
                        {assignedCount === 0 ? (
                          <span className="text-neutral/60 italic text-[11px]">Todos / Global</span>
                        ) : (
                          `${assignedCount} usuario(s)`
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Actions footer */}
                  {canManage && (
                    <div className="border-t border-border-card/60 pt-3 mt-4 flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenAssign(reg)}
                        className="flex-1 text-[11px] h-8 cursor-pointer flex items-center justify-center gap-1 hover:text-primary hover:border-primary/40"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Asignar Cajeros</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(reg)}
                        className="h-8 w-8 p-0 cursor-pointer text-neutral hover:text-secondary hover:border-border-card"
                        title="Editar Caja"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL: NUEVA CAJA REGISTRADORA ── */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md bg-bg-card border border-border-card p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-secondary flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              <span>Registrar Nueva Caja</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral">
              Habilita un nuevo punto de cobro físico en una sucursal.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 mt-2">
            <Field>
              <FieldLabel className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-primary" /> Sucursal *
              </FieldLabel>
              <select
                value={createBranchId}
                onChange={(e) => setCreateBranchId(e.target.value)}
                className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none focus:border-primary"
                required
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-bg-card text-secondary">
                    {b.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field>
              <FieldLabel className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-primary" /> Nombre de la Caja *
              </FieldLabel>
              <Input
                required
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Ej. Caja 1 - Principal, Caja Rápida, Mostrador"
                className="text-xs h-9"
              />
            </Field>

            <div className="flex justify-end gap-2 pt-2 border-t border-border-card">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCreateModal(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isCreating}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold cursor-pointer"
              >
                {isCreating && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                Crear Caja
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: EDITAR CAJA REGISTRADORA ── */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md bg-bg-card border border-border-card p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-secondary flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-primary" />
              <span>Editar Caja Registradora</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral">
              Actualiza el nombre o estado operativo de esta caja.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 mt-2">
            <Field>
              <FieldLabel className="text-[11px] font-bold uppercase tracking-wider">
                Nombre de la Caja *
              </FieldLabel>
              <Input
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-xs h-9"
              />
            </Field>

            <div className="flex items-center justify-between p-3 rounded-xl bg-bg-dark border border-border-card">
              <div>
                <span className="text-xs font-semibold text-secondary block">Estado de la Caja</span>
                <span className="text-[11px] text-neutral">
                  {editIsActive ? 'Habilitada para aperturas' : 'Deshabilitada temporalmente'}
                </span>
              </div>
              <input
                type="checkbox"
                checked={editIsActive}
                onChange={(e) => setEditIsActive(e.target.checked)}
                className="w-4 h-4 accent-primary rounded cursor-pointer"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border-card">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowEditModal(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isUpdating}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold cursor-pointer"
              >
                {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                Guardar Cambios
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: ASIGNAR USUARIOS A LA CAJA ── */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="sm:max-w-lg bg-bg-card border border-border-card p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-secondary flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary" />
              <span>Asignar Personal a {assigningRegister?.name}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral">
              Selecciona qué usuarios tienen autorización para abrir turno y cobrar en esta caja registradora.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            {/* Search users */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar colaboradores por nombre o rol..."
                value={assignUserSearch}
                onChange={(e) => setAssignUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-bg-dark border border-border-card rounded-xl text-xs text-secondary placeholder:text-neutral/60 focus:outline-none focus:border-primary/50"
              />
            </div>

            <div className="text-[11px] text-neutral flex items-center justify-between">
              <span>
                {selectedUserIds.length} usuario(s) seleccionado(s)
              </span>
              {selectedUserIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedUserIds([])}
                  className="text-primary hover:underline cursor-pointer"
                >
                  Limpiar selección
                </button>
              )}
            </div>

            {/* List of selectable users */}
            <div className="max-h-64 overflow-y-auto space-y-1.5 border border-border-card rounded-xl p-2 bg-bg-dark/40">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-6 text-xs text-neutral">
                  No se encontraron usuarios.
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const isSelected = selectedUserIds.includes(user.id);
                  return (
                    <div
                      key={user.id}
                      onClick={() => toggleUserSelection(user.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-primary/10 border-primary/40 text-secondary'
                          : 'bg-bg-dark border-border-card hover:border-neutral/40 text-neutral'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-primary border-primary text-white'
                              : 'border-neutral/40 bg-bg-card'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-secondary block truncate">
                            {user.name}
                          </span>
                          <span className="text-[10px] text-neutral block truncate">
                            {user.roleName} • {user.email}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border-card">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAssignModal(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleAssignSubmit}
                disabled={isAssigning}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold cursor-pointer"
              >
                {isAssigning && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                Guardar Asignaciones
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
