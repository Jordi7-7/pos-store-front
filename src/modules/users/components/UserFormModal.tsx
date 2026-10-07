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
  const [isGlobalBranch, setIsGlobalBranch] = useState(true);
  const [branchIds, setBranchIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    if (userToEdit) {
      setName(userToEdit.name);
      setUsername(userToEdit.username || '');
      setEmail(userToEdit.email);
      setPassword('');
      setRoleId(userToEdit.roleId || '');
      setPin('');
      setIsActive(userToEdit.isActive ?? true);
      const userBranchList = userToEdit.branchIds || [];
      setIsGlobalBranch(userBranchList.length === 0);
      setBranchIds(userBranchList);
    } else {
      setName('');
      setUsername('');
      setEmail('');
      setPassword('');
      const defaultRole = roles.find((r) => r.name.toLowerCase().includes('cajero')) || roles[0];
      setRoleId(defaultRole ? defaultRole.id : '');
      setPin('');
      setIsActive(true);
      setIsGlobalBranch(true);
      setBranchIds([]);
    }
  }, [userToEdit, isOpen, roles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      toast.error('Completa los campos obligatorios.');
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

    const resolvedBranchIds = isGlobalBranch ? branches.map((b) => b.id) : branchIds;

    try {
      if (isEditing && userToEdit) {
        await onSubmitUpdate(userToEdit.id, {
          name: name.trim(),
          username: username.trim() || undefined,
          email: email.trim(),
          password: password.trim() ? password : undefined,
          roleId: roleId || undefined,
          pin: pin.trim() ? pin.trim() : undefined,
          isActive,
          branchIds: resolvedBranchIds,
        });
        toast.success('Usuario actualizado con éxito.');
      } else {
        await onSubmitCreate({
          name: name.trim(),
          username: username.trim() || undefined,
          email: email.trim(),
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
                <AtSign className="w-3.5 h-3.5 text-primary" /> Nombre de Usuario
              </FieldLabel>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
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
              <Mail className="w-3.5 h-3.5 text-primary" /> Correo Electrónico *
            </FieldLabel>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@minegocio.com"
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
            <div>
              <span className="text-xs font-bold text-secondary flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-primary" /> Asignación de Sucursales
              </span>
              <span className="text-[11px] text-neutral block mt-0.5">
                Define si este usuario opera en todas las tiendas o en sucursales puntuales.
              </span>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={isGlobalBranch}
                  onChange={(e) => {
                    setIsGlobalBranch(e.target.checked);
                    if (e.target.checked) {
                      setBranchIds([]);
                    }
                  }}
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
                <span>Acceso Global (Todas las sucursales)</span>
              </label>

              {!isGlobalBranch && (
                <div className="pl-6 space-y-1.5 pt-1">
                  <span className="text-[10px] uppercase font-bold text-neutral tracking-wider block">
                    Selecciona las sucursales permitidas:
                  </span>
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
                              if (e.target.checked) {
                                setBranchIds([...branchIds, b.id]);
                              } else {
                                setBranchIds(branchIds.filter((id) => id !== b.id));
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
              )}
            </div>
          </div>

          {/* Active Status Switch (Only for Edit) */}
          {isEditing && (
            <div className="p-3.5 bg-bg-dark/70 rounded-2xl border border-border-card flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-secondary block">Estado de la Cuenta</span>
                <span className="text-[10px] text-neutral">
                  {isSelf
                    ? 'No puedes desactivar tu propia cuenta en sesión'
                    : isActive
                    ? 'El usuario puede iniciar sesión en la tienda'
                    : 'Acceso bloqueado'}
                </span>
              </div>
              <label className={`relative inline-flex items-center ${isSelf ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  disabled={isSelf}
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
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
