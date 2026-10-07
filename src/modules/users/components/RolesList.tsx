import React from 'react';
import type { RoleItem } from '../services/roles.service';
import { Shield, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RolesListProps {
  roles: RoleItem[];
  canManageRoles: boolean;
  isDeletingRole: boolean;
  onEditRole: (role: RoleItem) => void;
  onDeleteRole: (role: RoleItem) => void;
}

export const RolesList: React.FC<RolesListProps> = ({
  roles,
  canManageRoles,
  isDeletingRole,
  onEditRole,
  onDeleteRole,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {roles.map((r) => {
        const permsCount = r.permissions.includes('*') ? 'Todos (*)' : r.permissions.length;

        return (
          <div
            key={r.id}
            className="bg-bg-card border border-border-card hover:border-primary/40 transition-all rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm group"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-secondary flex items-center gap-1.5">
                      {r.name}
                      {r.isSystem && (
                        <span className="text-[9px] font-semibold bg-neutral/10 text-neutral px-1.5 py-0.2 rounded border border-border-card">
                          Sistema
                        </span>
                      )}
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {r.userCount || 0} usuario(s) asignado(s)
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-neutral leading-relaxed min-h-[36px]">
                {r.description || 'Sin descripción configurada.'}
              </p>

              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Permisos activos:</span>
                <strong className="text-foreground font-mono bg-muted px-2 py-0.5 rounded-md text-[10px]">
                  {permsCount}
                </strong>
              </div>
            </div>

            {canManageRoles && (
              <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onEditRole(r)}
                  className="flex-1 text-xs h-8 gap-1.5 cursor-pointer hover:border-primary"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Configurar Permisos</span>
                </Button>

                {r.name !== 'Propietario' && !r.permissions.includes('*') && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isDeletingRole || (r.userCount || 0) > 0}
                    title={
                      (r.userCount || 0) > 0
                        ? `No se puede eliminar: tiene ${r.userCount} usuario(s) asignado(s)`
                        : 'Eliminar Rol'
                    }
                    onClick={() => onDeleteRole(r)}
                    className="h-8 w-8 p-0 text-rose-400 hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
