import React, { useState, useMemo } from 'react';
import { useUsers, useCreateUser, useUpdateUser, useGeneratePin } from '../hooks/useUsers';
import type { UserItem } from '../services/users.service';
import {
  Users,
  UserPlus,
  Key,
  Edit2,
  Copy,
  Check,
  ShieldAlert,
  Search,
  Loader2,
  Sparkles,
  Lock,
  Mail,
  User as UserIcon,
  Shield,
  Power,
  AtSign,
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

export const UsersView: React.FC = () => {
  const { users, isLoading, refetchUsers } = useUsers();
  const { createUser, isCreating } = useCreateUser();
  const { updateUser, isUpdating } = useUpdateUser();
  const { generatePin } = useGeneratePin();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  // Selected User for Edit
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  // Create Form State
  const [createName, setCreateName] = useState('');
  const [createUsername, setCreateUsername] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState<'CASHIER' | 'MANAGER' | 'ADMIN' | 'OWNER'>('CASHIER');
  const [createPin, setCreatePin] = useState('');

  // Edit Form State
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<'CASHIER' | 'MANAGER' | 'ADMIN' | 'OWNER'>('CASHIER');
  const [editPin, setEditPin] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  // Pin Reveal Modal State
  const [revealedPin, setRevealedPin] = useState('');
  const [pinTargetUser, setPinTargetUser] = useState<UserItem | null>(null);
  const [copied, setCopied] = useState(false);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setCreateName('');
    setCreateUsername('');
    setCreateEmail('');
    setCreatePassword('');
    setCreateRole('CASHIER');
    setCreatePin('');
    setShowCreateModal(true);
  };

  // Submit Create User
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName || !createEmail || !createPassword) {
      toast.error('Completa los campos obligatorios.');
      return;
    }

    try {
      await createUser({
        name: createName,
        username: createUsername.trim() || undefined,
        email: createEmail,
        password: createPassword,
        role: createRole,
        pin: createPin.trim() || undefined,
      });

      toast.success('Usuario registrado con éxito.');
      setShowCreateModal(false);
      refetchUsers();
    } catch (err: any) {
      toast.error(err?.message || 'Error al crear usuario.');
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (user: UserItem) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditUsername(user.username || '');
    setEditEmail(user.email);
    setEditPassword('');
    setEditRole(user.role);
    setEditPin('');
    setEditIsActive(user.isActive ?? true);
    setShowEditModal(true);
  };

  // Submit Edit User
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      await updateUser({
        id: editingUser.id,
        input: {
          name: editName,
          username: editUsername.trim() || undefined,
          email: editEmail,
          password: editPassword.trim() ? editPassword : undefined,
          role: editRole,
          pin: editPin.trim() ? editPin.trim() : undefined,
          isActive: editIsActive,
        },
      });

      toast.success('Usuario actualizado con éxito.');
      setShowEditModal(false);
      setEditingUser(null);
      refetchUsers();
    } catch (err: any) {
      toast.error(err?.message || 'Error al actualizar usuario.');
    }
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
      refetchUsers();
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
      refetchUsers();
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'OWNER':
        return {
          label: 'Propietario',
          className: 'bg-purple-500/10 text-purple-500 border-purple-500/25',
        };
      case 'ADMIN':
        return {
          label: 'Administrador',
          className: 'bg-sky-500/10 text-sky-500 border-sky-500/25',
        };
      case 'MANAGER':
        return {
          label: 'Encargado',
          className: 'bg-amber-500/10 text-amber-500 border-amber-500/25',
        };
      case 'CASHIER':
      default:
        return {
          label: 'Cajero POS',
          className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25',
        };
    }
  };

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
              <h1 className="text-lg font-black text-secondary tracking-tight">Personal & Usuarios</h1>
              <p className="text-xs text-neutral">
                Gestiona roles, accesos, contraseñas y códigos PIN de los miembros del equipo.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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
            <option value="CASHIER">Cajeros</option>
            <option value="ADMIN">Administradores</option>
            <option value="MANAGER">Encargados</option>
            <option value="OWNER">Propietarios</option>
          </select>

          {/* New User Button */}
          <Button
            type="button"
            onClick={handleOpenCreateModal}
            className="h-9 px-4 text-xs font-bold gap-1.5 shadow-md shadow-primary/20 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nuevo Usuario</span>
          </Button>
        </div>
      </div>

      {/* ── USERS LIST / GRID ── */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-xs text-neutral">Cargando personal...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-bg-card border border-border-card rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-bg-dark border border-border-card flex items-center justify-center mx-auto text-neutral">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-secondary">No se encontraron usuarios</h3>
          <p className="text-xs text-neutral max-w-sm mx-auto">
            {searchTerm || roleFilter !== 'ALL'
              ? 'No hay resultados que coincidan con los filtros aplicados.'
              : 'Comienza creando el primer usuario o cajero para tu tienda.'}
          </p>
          <Button
            type="button"
            size="sm"
            onClick={handleOpenCreateModal}
            className="text-xs font-bold gap-1.5 mt-2"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Registrar Primer Usuario</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => {
            const roleInfo = getRoleBadge(user.role);
            const isActive = user.isActive ?? true;

            return (
              <div
                key={user.id}
                className={`bg-bg-card border rounded-2xl p-4.5 transition-all flex flex-col justify-between gap-4 shadow-xs relative group ${
                  isActive ? 'border-border-card hover:border-primary/40' : 'border-rose-500/20 bg-rose-500/3 opacity-80'
                }`}
              >
                {/* Header info */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 border ${
                          isActive
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'bg-neutral/10 text-neutral border-border-card'
                        }`}
                      >
                        {user.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-xs font-bold text-secondary truncate">{user.name}</h4>
                        {user.username && (
                          <div className="flex items-center gap-1 text-[10px] text-primary font-mono font-semibold">
                            <AtSign className="w-2.5 h-2.5" />
                            <span>{user.username}</span>
                          </div>
                        )}
                        <p className="text-[10px] text-neutral truncate mt-0.5">{user.email}</p>
                      </div>
                    </div>

                    {/* Status & Role Badges */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${roleInfo.className}`}
                      >
                        {roleInfo.label}
                      </span>
                      <span
                        className={`text-[9px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                          isActive
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                          }`}
                        />
                        {isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>

                  {/* PIN & Security Status */}
                  <div className="p-2.5 bg-bg-dark/60 rounded-xl border border-border-card flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-neutral" />
                      <span className="text-neutral font-medium">Acceso por PIN:</span>
                    </div>
                    {user.hasPin ? (
                      <span className="text-emerald-500 font-bold flex items-center gap-1 text-[10px]">
                        <Check className="w-3 h-3" /> Configurado
                      </span>
                    ) : (
                      <span className="text-neutral font-medium text-[10px]">Sin PIN</span>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-border-card flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleGeneratePin(user)}
                    className="h-8 text-xs font-semibold gap-1.5 cursor-pointer hover:border-primary flex-1"
                  >
                    <Key className="w-3.5 h-3.5 text-primary" />
                    <span>{user.hasPin ? 'Nuevo PIN' : 'Crear PIN'}</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEditModal(user)}
                    className="h-8 text-xs font-semibold gap-1.5 cursor-pointer hover:border-primary flex-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    title={isActive ? 'Deshabilitar Usuario' : 'Habilitar Usuario'}
                    onClick={() => handleToggleActive(user)}
                    className={`h-8 w-8 p-0 cursor-pointer ${
                      isActive
                        ? 'text-neutral hover:text-rose-500 hover:border-rose-500/30'
                        : 'text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL 1: REGISTRAR NUEVO USUARIO ── */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md bg-bg-card border border-border-card p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-secondary flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />
              <span>Registrar Nuevo Usuario</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral">
              Crea un nuevo usuario asignándole credenciales de acceso y un rol.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 mt-2">
            <Field>
              <FieldLabel className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-primary" /> Nombre Completo *
              </FieldLabel>
              <Input
                required
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Ej. Jordi Cajero"
                className="text-xs h-9"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field>
                <FieldLabel className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <AtSign className="w-3.5 h-3.5 text-primary" /> Nombre de Usuario
                </FieldLabel>
                <Input
                  value={createUsername}
                  onChange={(e) => setCreateUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="ej. cajero1"
                  className="text-xs h-9 font-mono"
                />
              </Field>

              <Field>
                <FieldLabel className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-primary" /> Rol Operativo
                </FieldLabel>
                <select
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value as any)}
                  className="w-full bg-bg-dark border border-border-card rounded-xl h-9 px-3 text-xs text-secondary focus:outline-none focus:border-primary cursor-pointer font-medium"
                >
                  <option value="CASHIER">Cajero (POS)</option>
                  <option value="ADMIN">Administrador</option>
                  <option value="MANAGER">Encargado</option>
                </select>
              </Field>
            </div>

            <Field>
              <FieldLabel className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-primary" /> Correo Electrónico *
              </FieldLabel>
              <Input
                type="email"
                required
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                placeholder="usuario@minegocio.com"
                className="text-xs h-9"
              />
            </Field>

            <Field>
              <FieldLabel className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-primary" /> Contraseña Temporal *
              </FieldLabel>
              <Input
                type="password"
                required
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                placeholder="••••••••"
                className="text-xs h-9"
              />
            </Field>

            <Field>
              <FieldLabel className="text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-primary" /> PIN de Cajero (Opcional)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const rnd = Math.floor(100000 + Math.random() * 900000).toString();
                    setCreatePin(rnd);
                  }}
                  className="text-[10px] text-primary hover:underline font-bold cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Generar PIN
                </button>
              </FieldLabel>
              <Input
                type="text"
                maxLength={6}
                value={createPin}
                onChange={(e) => setCreatePin(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="6 dígitos (ej. 123456)"
                className="text-xs h-9 font-mono tracking-widest text-center"
              />
            </Field>

            <div className="pt-3 border-t border-border-card flex justify-end gap-2">
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
                disabled={isCreating}
                size="sm"
                className="text-xs font-bold gap-1.5 shadow-md shadow-primary/20"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Crear Usuario</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── MODAL 2: EDITAR USUARIO ── */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md bg-bg-card border border-border-card p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-secondary flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-primary" />
              <span>Editar Usuario</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral">
              Modifica datos, PIN de cajero y estado de habilitación de {editingUser?.name}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 mt-2">
            <Field>
              <FieldLabel className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-primary" /> Nombre Completo *
              </FieldLabel>
              <Input
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-xs h-9"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field>
                <FieldLabel className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <AtSign className="w-3.5 h-3.5 text-primary" /> Nombre de Usuario
                </FieldLabel>
                <Input
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="ej. cajero1"
                  className="text-xs h-9 font-mono"
                />
              </Field>

              <Field>
                <FieldLabel className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-primary" /> Rol
                </FieldLabel>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  className="w-full bg-bg-dark border border-border-card rounded-xl h-9 px-3 text-xs text-secondary focus:outline-none focus:border-primary cursor-pointer font-medium"
                >
                  <option value="CASHIER">Cajero (POS)</option>
                  <option value="ADMIN">Administrador</option>
                  <option value="MANAGER">Encargado</option>
                  <option value="OWNER">Propietario</option>
                </select>
              </Field>
            </div>

            <Field>
              <FieldLabel className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-primary" /> Correo Electrónico *
              </FieldLabel>
              <Input
                type="email"
                required
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="text-xs h-9"
              />
            </Field>

            <Field>
              <FieldLabel className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-primary" /> Nueva Contraseña
              </FieldLabel>
              <Input
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="Dejar en blanco para no modificar"
                className="text-xs h-9"
              />
            </Field>

            {/* PIN Section */}
            <div className="p-3.5 bg-bg-dark/70 rounded-2xl border border-border-card space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-secondary flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-primary" /> Código PIN de Cajero
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const rnd = Math.floor(100000 + Math.random() * 900000).toString();
                    setEditPin(rnd);
                  }}
                  className="text-[10px] text-primary hover:underline font-bold cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Generar PIN
                </button>
              </div>

              <Input
                type="text"
                maxLength={6}
                value={editPin}
                onChange={(e) => setEditPin(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder={
                  editingUser?.hasPin
                    ? 'PIN actual configurado (ingresa uno nuevo para cambiarlo)'
                    : 'Ingresar PIN de 4 a 6 dígitos'
                }
                className="text-xs h-9 font-mono tracking-widest text-center"
              />
            </div>

            {/* Active Status Switch */}
            <div className="p-3.5 bg-bg-dark/70 rounded-2xl border border-border-card flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-secondary block">Estado de la Cuenta</span>
                <span className="text-[10px] text-neutral">
                  {editIsActive ? 'El usuario puede iniciar sesión en la tienda' : 'Acceso bloqueado'}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="pt-3 border-t border-border-card flex justify-end gap-2">
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
                disabled={isUpdating}
                size="sm"
                className="text-xs font-bold gap-1.5 shadow-md shadow-primary/20"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Guardar Cambios</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── MODAL 3: PIN REVELADO / GENERADO ── */}
      <Dialog open={showPinModal} onOpenChange={setShowPinModal}>
        <DialogContent className="sm:max-w-md bg-bg-card border border-border-card p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-secondary flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              <span>Nuevo PIN Asignado</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral">
              PIN generado para <span className="text-secondary font-semibold">{pinTargetUser?.name}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div className="bg-bg-dark border border-border-card rounded-2xl p-6 text-center space-y-2 relative overflow-hidden">
              <span className="text-[10px] uppercase font-bold tracking-widest text-primary block">
                Código de Cajero POS
              </span>
              <div className="text-4xl font-mono font-black tracking-widest text-secondary select-all">
                {revealedPin}
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Copia o anota este PIN ahora. Por motivos de seguridad, el sistema lo encripta y no podrá volver a mostrarse en texto plano.
              </span>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              onClick={copyToClipboard}
              className="w-full text-xs font-bold gap-1.5 shadow-md shadow-primary/20 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '¡PIN Copiado!' : 'Copiar PIN al Portapapeles'}</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersView;
