import React, { useState, useEffect } from 'react';
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
import type { UserItem, CreateUserInput, UpdateUserInput } from '../services/users.service';
import type { RoleItem } from '../services/roles.service';
import type { Branch } from '@/modules/branches/services/branches.service';
import {
  UserPlus,
  Edit2,
  Check,
  Loader2,
  Sparkles,
  Lock,
  Mail,
  User as UserIcon,
  Shield,
  AtSign,
  Building,
  Key,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit?: UserItem | null;
  roles: RoleItem[];
  branches: Branch[];
  currentAuthUserId?: string;
  onSubmitCreate: (data: CreateUserInput) => Promise<void>;
  onSubmitUpdate: (id: string, data: UpdateUserInput) => Promise<void>;
  isSubmitting: boolean;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  userToEdit,
  roles,
  branches,
  currentAuthUserId,
  onSubmitCreate,
  onSubmitUpdate,
  isSubmitting,
}) => {
  const isEditing = !!userToEdit;

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [pin, setPin] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [branchIds, setBranchIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    if (userToEdit) {
      setName(userToEdit.name);
      setUsername(userToEdit.username || '');
      setEmail(userToEdit.email || '');
      setPassword('');
      setRoleId(userToEdit.role?.id || '');
      setPin('');
      const userBranchList = (userToEdit.branches || []).map((b) => b.id);
      setIsActive(userBranchList.length === 0 ? false : (userToEdit.isActive ?? true));
      setBranchIds(userBranchList);
    } else {
      setName('');
      setUsername('');
      setEmail('');
      setPassword('');
      const defaultRole = roles.find((r) => r.name.toLowerCase().includes('cajero')) || roles[0];
      setRoleId(defaultRole ? defaultRole.id : '');
      setPin('');
      const defaultBranchIds = branches.map((b) => b.id);
      setIsActive(defaultBranchIds.length > 0);
      setBranchIds(defaultBranchIds);
    }
  }, [userToEdit, isOpen, roles, branches]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !username.trim()) {
      toast.error('Completa los campos obligatorios (Nombre y Usuario).');
      return;
    }

    if (!isEditing && !password) {
      toast.error('La contraseña es obligatoria para nuevos usuarios.');
      return;
    }

    if (!roleId) {
      toast.error('Selecciona un rol para el usuario.');
      return;
    }

    const resolvedBranchIds = branchIds;
    const resolvedIsActive = resolvedBranchIds.length === 0 ? false : isActive;

    try {
      if (isEditing && userToEdit) {
        await onSubmitUpdate(userToEdit.id, {
          name: name.trim(),
          username: username.trim(),
          email: email.trim() || undefined,
          password: password.trim() ? password : undefined,
          roleId: roleId || undefined,
          pin: pin.trim() ? pin.trim() : undefined,
          isActive: resolvedIsActive,
          branchIds: resolvedBranchIds,
        });
        toast.success('Usuario actualizado con éxito.');
      } else {
        await onSubmitCreate({
          name: name.trim(),
          username: username.trim(),
          email: email.trim() || undefined,
          password,
          roleId,
          pin: pin.trim() || undefined,
          branchIds: resolvedBranchIds,
        });
        toast.success('Usuario registrado con éxito.');
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.message || `Error al ${isEditing ? 'actualizar' : 'crear'} usuario.`);
    }
  };

  const isSelf = currentAuthUserId === userToEdit?.id;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-bg-card border border-border-card p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-secondary flex items-center gap-2">
            {isEditing ? (
              <>
                <Edit2 className="w-4 h-4 text-primary" />
                <span>Editar Usuario</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 text-primary" />
                <span>Registrar Nuevo Usuario</span>
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral">
            {isEditing
              ? `Modifica datos, PIN de cajero y estado de habilitación de ${userToEdit?.name}.`
              : 'Crea un nuevo usuario asignándole credenciales de acceso y un rol.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <Field>
            <FieldLabel className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-primary" /> Nombre Completo *
            </FieldLabel>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Jordi Cajero"
              className="text-xs h-9"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field>
              <FieldLabel className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <AtSign className="w-3.5 h-3.5 text-primary" /> Nombre de Usuario *
              </FieldLabel>
              <Input
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                placeholder="ej. cajero1"
                className="text-xs h-9 font-mono"
              />
            </Field>

            <Field>
              <FieldLabel className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-primary" /> Rol {isEditing ? '' : 'Operativo'}
              </FieldLabel>
              <select
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className="w-full bg-bg-dark border border-border-card rounded-xl h-9 px-3 text-xs text-secondary focus:outline-none focus:border-primary cursor-pointer font-medium"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} {r.isSystem ? '(Sistema)' : ''}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field>
            <FieldLabel className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-primary" /> Correo Electrónico (Opcional)
            </FieldLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@minegocio.com (opcional)"
              className="text-xs h-9"
            />
          </Field>

          <Field>
            <FieldLabel className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-primary" />
              {isEditing ? 'Nueva Contraseña' : 'Contraseña Temporal *'}
            </FieldLabel>
            <Input
              type="password"
              required={!isEditing}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEditing ? 'Dejar en blanco para no modificar' : '••••••••'}
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
                  setPin(rnd);
                }}
                className="text-[10px] text-primary hover:underline font-bold cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" /> Generar PIN
              </button>
            </div>

            <Input
              type="text"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder={
                isEditing && userToEdit?.hasPin
                  ? 'PIN actual configurado (ingresa uno nuevo para cambiarlo)'
                  : isEditing
                  ? 'Ingresar PIN de 4 a 6 dígitos'
                  : '6 dígitos (ej. 123456)'
              }
              className="text-xs h-9 font-mono tracking-widest text-center"
            />
          </div>

          {/* ASIGNACIÓN DE SUCURSALES */}
          <div className="p-3.5 bg-bg-dark/70 rounded-2xl border border-border-card space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-secondary flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-primary" /> Sucursales con Acceso
                </span>
                <span className="text-[11px] text-neutral block mt-0.5">
                  {branchIds.length === branches.length && branches.length > 0
                    ? 'Todas las sucursales asignadas'
                    : branchIds.length === 0
                    ? 'Sin sucursales asignadas'
                    : `${branchIds.length} de ${branches.length} asignadas`}
                </span>
              </div>
              {branches.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (branchIds.length === branches.length) {
                      setBranchIds([]);
                      setIsActive(false);
                    } else {
                      setBranchIds(branches.map((b) => b.id));
                      setIsActive(true);
                    }
                  }}
                  className="text-[11px] font-semibold text-primary hover:underline transition-all"
                >
                  {branchIds.length === branches.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                </button>
              )}
            </div>

            {/* Warning when no branches are selected */}
            {branchIds.length === 0 && (
              <div className="flex items-center gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-500 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Al no tener sucursales asignadas, el usuario quedará inactivo automáticamente.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {branches.map((b) => {
                const isChecked = branchIds.includes(b.id);
                return (
                  <label
                    key={b.id}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-primary/10 border-primary/40 text-secondary'
                        : 'bg-bg-dark border-border-card text-neutral hover:border-neutral/40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        let next: string[];
                        if (e.target.checked) {
                          next = [...branchIds, b.id];
                        } else {
                          next = branchIds.filter((id) => id !== b.id);
                        }
                        setBranchIds(next);
                        if (next.length === 0) {
                          setIsActive(false);
                        }
                      }}
                      className="w-3.5 h-3.5 accent-primary rounded cursor-pointer"
                    />
                    <span className="truncate">{b.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Active Status Switch (Only for Edit) */}
          {isEditing && (
            <div className="p-3.5 bg-bg-dark/70 rounded-2xl border border-border-card flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-secondary block">Estado de la Cuenta</span>
                <span className="text-[10px] text-neutral">
                  {branchIds.length === 0
                    ? 'Inactivo: requiere al menos una sucursal asignada para activarse.'
                    : isSelf
                    ? 'No puedes desactivar tu propia cuenta en sesión'
                    : isActive
                    ? 'El usuario puede iniciar sesión en la tienda'
                    : 'Acceso bloqueado'}
                </span>
              </div>
              <label className={`relative inline-flex items-center ${isSelf || branchIds.length === 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  disabled={isSelf || branchIds.length === 0}
                  checked={branchIds.length === 0 ? false : isActive}
                  onChange={(e) => {
                    if (branchIds.length > 0) {
                      setIsActive(e.target.checked);
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          )}

          <div className="pt-3 border-t border-border-card flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              size="sm"
              className="text-xs font-bold gap-1.5 shadow-md shadow-primary/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Guardar Cambios' : 'Crear Usuario'}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
