import React, { useState, useMemo } from 'react';
import { useUsers, useCreateUser, useUpdateUser, useGeneratePin } from '../hooks/useUsers';
import { useRoles, useDeleteRole } from '../hooks/useRoles';
import type { UserItem, CreateUserInput, UpdateUserInput } from '../services/users.service';
import type { RoleItem } from '../services/roles.service';
import { RoleEditorModal } from '../components/RoleEditorModal';
import { DeleteRoleModal } from '../components/DeleteRoleModal';
import { UserFormModal } from '../components/UserFormModal';
import { PinRevealModal } from '../components/PinRevealModal';
import { UsersTab } from '../components/UsersTab';
import { RolesTab } from '../components/RolesTab';
import { usePermissions } from '@/hooks/usePermissions';
import { APP_PERMISSIONS } from '@/constants/permissions';
import { Users, UserPlus, Search, Shield, Plus } from 'lucide-react';
import { useBranches } from '@/modules/branches';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export const UsersView: React.FC = () => {
  const { user: currentAuthUser } = useAuthStore();
  const { can } = usePermissions();
  const { users, isLoading } = useUsers();
  const { roles, isLoading: isLoadingRoles } = useRoles();
  const { deleteRole, isDeleting: isDeletingRole } = useDeleteRole();
  const { createUser, isCreating } = useCreateUser();
  const { updateUser, isUpdating } = useUpdateUser();
  const { generatePin } = useGeneratePin();
  const { branches } = useBranches();

  // Tab: 'users' | 'roles'
  const [activeMainTab, setActiveMainTab] = useState<'users' | 'roles'>('users');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modals state
  const [showUserModal, setShowUserModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserItem | null>(null);

  const [showPinModal, setShowPinModal] = useState(false);
  const [revealedPin, setRevealedPin] = useState('');
  const [pinTargetUser, setPinTargetUser] = useState<UserItem | null>(null);
  const [copied, setCopied] = useState(false);

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<RoleItem | null>(null);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u: UserItem) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter || u.roleName === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  // Open Create User Modal
  const handleOpenCreateUser = () => {
    setUserToEdit(null);
    setShowUserModal(true);
  };

  // Open Edit User Modal
  const handleOpenEditUser = (user: UserItem) => {
    setUserToEdit(user);
    setShowUserModal(true);
  };

  // Handle Create User Submit
  const handleCreateUser = async (data: CreateUserInput) => {
    await createUser(data);
  };

  // Handle Update User Submit
  const handleUpdateUser = async (id: string, data: UpdateUserInput) => {
    await updateUser({ id, input: data });
  };

  // Quick Toggle Active/Inactive
  const handleToggleActive = async (user: UserItem) => {
    const newStatus = !user.isActive;
    try {
      await updateUser({
        id: user.id,
        input: { isActive: newStatus },
      });
      toast.success(`Usuario ${newStatus ? 'habilitado' : 'deshabilitado'} exitosamente.`);
    } catch (err: any) {
      toast.error(err?.message || 'Error al cambiar estado.');
    }
  };

  // Generate Fast Random PIN
  const handleGeneratePin = async (user: UserItem) => {
    try {
      const res = await generatePin(user.id);
      setRevealedPin(res.pin);
      setPinTargetUser(user);
      setShowPinModal(true);
    } catch (err: any) {
      toast.error(err?.message || 'Error al generar PIN.');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(revealedPin);
    setCopied(true);
    toast.success('PIN copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  // Confirm Delete Role
  const handleConfirmDeleteRole = async (roleId: string) => {
    try {
      await deleteRole(roleId);
      setRoleToDelete(null);
    } catch {
      // Error handled by hook
    }
  };

  const canManageRoles = can(APP_PERMISSIONS.ROLES_MANAGE);

  return (
    <div className="space-y-6">
      {/* ── HEADER TOOLBAR ── */}
      <div className="bg-bg-card border border-border-card rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-secondary tracking-tight">Personal & Roles</h1>
              <p className="text-xs text-neutral">
                Gestiona usuarios, roles personalizados y permisos de acceso para tu equipo.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {activeMainTab === 'users' ? (
            <>
              {/* Search Box */}
              <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 text-neutral absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre o usuario..."
                  className="w-full bg-bg-dark border border-border-card rounded-xl py-2 pl-9 pr-3 text-xs text-secondary placeholder-neutral focus:outline-none focus:border-primary transition-all font-medium"
                />
              </div>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none focus:border-primary cursor-pointer font-medium"
              >
                <option value="ALL">Todos los Roles</option>
                {roles.map((r: RoleItem) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>

              {/* New User Button */}
              <Button
                type="button"
                onClick={handleOpenCreateUser}
                className="h-9 px-4 text-xs font-bold gap-1.5 shadow-md shadow-primary/20 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Nuevo Usuario</span>
              </Button>
            </>
          ) : (
            canManageRoles && (
              <Button
                type="button"
                onClick={() => {
                  setEditingRole(null);
                  setShowRoleModal(true);
                }}
                className="h-9 px-4 text-xs font-bold gap-1.5 shadow-md shadow-primary/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Rol</span>
              </Button>
            )
          )}
        </div>
      </div>

      {/* Main Tabs switcher */}
      <div className="flex items-center gap-2 border-b border-border pb-1">
        <button
          type="button"
          onClick={() => setActiveMainTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeMainTab === 'users'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Usuarios ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainTab('roles')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeMainTab === 'roles'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Roles y Permisos ({roles.length})</span>
        </button>
      </div>

      {/* Tabs Content */}
      {activeMainTab === 'roles' ? (
        <RolesTab
          roles={roles}
          isLoadingRoles={isLoadingRoles}
          canManageRoles={canManageRoles}
          isDeletingRole={isDeletingRole}
          onEditRole={(role) => {
            setEditingRole(role);
            setShowRoleModal(true);
          }}
          onDeleteRole={(role) => setRoleToDelete(role)}
        />
      ) : (
        <UsersTab
          users={filteredUsers}
          isLoading={isLoading}
          currentAuthUserId={currentAuthUser?.id}
          searchTerm={searchTerm}
          roleFilter={roleFilter}
          onOpenCreate={handleOpenCreateUser}
          onGeneratePin={handleGeneratePin}
          onEditUser={handleOpenEditUser}
          onToggleActive={handleToggleActive}
        />
      )}

      {/* ── MODAL UNIFICADO: CREAR / EDITAR USUARIO ── */}
      <UserFormModal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setUserToEdit(null);
        }}
        userToEdit={userToEdit}
        roles={roles}
        branches={branches}
        currentAuthUserId={currentAuthUser?.id}
        onSubmitCreate={handleCreateUser}
        onSubmitUpdate={handleUpdateUser}
        isSubmitting={isCreating || isUpdating}
      />

      {/* ── MODAL: PIN REVELADO / GENERADO ── */}
      <PinRevealModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        pin={revealedPin}
        targetUser={pinTargetUser}
        copied={copied}
        onCopy={copyToClipboard}
      />

      {/* ── MODAL: CREAR O EDITAR ROL ── */}
      <RoleEditorModal
        isOpen={showRoleModal}
        onClose={() => {
          setShowRoleModal(false);
          setEditingRole(null);
        }}
        roleToEdit={editingRole}
      />

      {/* ── MODAL: CONFIRMAR ELIMINACIÓN DE ROL ── */}
      <DeleteRoleModal
        roleToDelete={roleToDelete}
        onClose={() => setRoleToDelete(null)}
        onConfirmDelete={handleConfirmDeleteRole}
        isDeleting={isDeletingRole}
      />
    </div>
  );
};

export default UsersView;
