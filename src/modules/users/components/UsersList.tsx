import React from 'react';
import type { UserItem } from '../services/users.service';
import { Users, UserPlus, Key, Edit2, Check, Power, AtSign } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UsersListProps {
  users: UserItem[];
  currentAuthUserId?: string;
  searchTerm: string;
  roleFilter: string;
  onOpenCreate: () => void;
  onGeneratePin: (user: UserItem) => void;
  onEditUser: (user: UserItem) => void;
  onToggleActive: (user: UserItem) => void;
}

export const UsersList: React.FC<UsersListProps> = ({
  users,
  currentAuthUserId,
  searchTerm,
  roleFilter,
  onOpenCreate,
  onGeneratePin,
  onEditUser,
  onToggleActive,
}) => {
  const getRoleBadge = (role?: string, roleName?: string) => {
    if (roleName) {
      return {
        label: roleName,
        className: 'bg-primary/10 text-primary border-primary/25',
      };
    }
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

  if (users.length === 0) {
    return (
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
          onClick={onOpenCreate}
          className="text-xs font-bold gap-1.5 mt-2"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Registrar Primer Usuario</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {users.map((user) => {
        const roleInfo = getRoleBadge(user.role, user.roleName);
        const isActive = user.isActive ?? true;
        const isSelf = currentAuthUserId === user.id;

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
                onClick={() => onGeneratePin(user)}
                className="h-8 text-xs font-semibold gap-1.5 cursor-pointer hover:border-primary flex-1"
              >
                <Key className="w-3.5 h-3.5 text-primary" />
                <span>{user.hasPin ? 'Nuevo PIN' : 'Crear PIN'}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEditUser(user)}
                className="h-8 text-xs font-semibold gap-1.5 cursor-pointer hover:border-primary flex-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSelf}
                title={
                  isSelf
                    ? 'No puedes desactivar tu propia cuenta en sesión'
                    : isActive
                    ? 'Deshabilitar Usuario'
                    : 'Habilitar Usuario'
                }
                onClick={() => onToggleActive(user)}
                className={`h-8 w-8 p-0 ${
                  isSelf
                    ? 'opacity-40 cursor-not-allowed text-neutral'
                    : isActive
                    ? 'cursor-pointer text-neutral hover:text-rose-500 hover:border-rose-500/30'
                    : 'cursor-pointer text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
