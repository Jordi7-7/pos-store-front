import React from 'react';
import type { RoleItem } from '../services/roles.service';
import { RolesList } from './RolesList';
import { Loader2 } from 'lucide-react';

interface RolesTabProps {
  roles: RoleItem[];
  isLoadingRoles: boolean;
  canManageRoles: boolean;
  isDeletingRole: boolean;
  onEditRole: (role: RoleItem) => void;
  onDeleteRole: (role: RoleItem) => void;
}

export const RolesTab: React.FC<RolesTabProps> = ({
  roles,
  isLoadingRoles,
  canManageRoles,
  isDeletingRole,
  onEditRole,
  onDeleteRole,
}) => {
  if (isLoadingRoles) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs text-neutral">Cargando roles...</p>
      </div>
    );
  }

  return (
    <RolesList
      roles={roles}
      canManageRoles={canManageRoles}
      isDeletingRole={isDeletingRole}
      onEditRole={onEditRole}
      onDeleteRole={onDeleteRole}
    />
  );
};
