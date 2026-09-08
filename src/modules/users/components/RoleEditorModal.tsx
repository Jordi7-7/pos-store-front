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
import { usePermissionsCatalog, useCreateRole, useUpdateRole } from '../hooks/useRoles';
import type { RoleItem } from '../services/roles.service';
import { Shield, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface RoleEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleToEdit?: RoleItem | null;
}

export const RoleEditorModal: React.FC<RoleEditorModalProps> = ({
  isOpen,
  onClose,
  roleToEdit,
}) => {
  const { modules, permissions, isLoading: isLoadingCatalog } = usePermissionsCatalog();
  const { createRole, isCreating } = useCreateRole();
  const { updateRole, isUpdating } = useUpdateRole();

  const isEditing = !!roleToEdit;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [activeModuleTab, setActiveModuleTab] = useState<string>('pos');

  useEffect(() => {
    if (roleToEdit) {
      setName(roleToEdit.name);
      setDescription(roleToEdit.description || '');
      setSelectedPermissions(roleToEdit.permissions || []);
    } else {
      setName('');
      setDescription('');
      setSelectedPermissions([
        'view:pos',
        'view:sales',
        'view:customers',
        'action:cash.open_close',
      ]);
    }
  }, [roleToEdit, isOpen]);

  const togglePermission = (code: string) => {
    if (roleToEdit?.name === 'Propietario') {
      toast.info('El rol Propietario tiene acceso absoluto permanente.');
      return;
    }
    setSelectedPermissions((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code],
    );
  };

  const handleSelectAllModule = (moduleId: string) => {
    if (roleToEdit?.name === 'Propietario') return;
    const modulePerms = permissions.filter((p) => p.module === moduleId).map((p) => p.code);
    const allSelected = modulePerms.every((code) => selectedPermissions.includes(code));

    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((p) => !modulePerms.includes(p as any)));
    } else {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...modulePerms])));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      return toast.warning('Ingresa un nombre para el rol.');
    }

    try {
      if (isEditing && roleToEdit) {
        await updateRole({
          id: roleToEdit.id,
          data: {
            name: roleToEdit.isSystem ? undefined : name.trim(),
            description: description.trim() || undefined,
            permissions: selectedPermissions,
          },
        });
      } else {
        await createRole({
          name: name.trim(),
          description: description.trim() || undefined,
          permissions: selectedPermissions,
        });
      }
      onClose();
    } catch (err) {
      // Error handled by hook
    }
  };

  const currentModulePermissions = permissions.filter((p) => p.module === activeModuleTab);
  const isSaving = isCreating || isUpdating;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl w-full bg-card border border-border rounded-2xl shadow-2xl p-6 text-foreground">
        <DialogHeader className="border-b border-border pb-3">
          <DialogTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span>{isEditing ? `Editar Rol: ${roleToEdit.name}` : 'Crear Nuevo Rol'}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Configura el nombre y selecciona exactamente qué módulos y acciones puede realizar este rol.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Form Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field>
              <FieldLabel className="text-xs font-semibold">Nombre del Rol *</FieldLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={roleToEdit?.isSystem}
                placeholder="Ej. Cajero Turno Noche, Supervisor..."
                className="h-9 text-xs"
              />
              {roleToEdit?.isSystem && (
                <span className="text-[10px] text-muted-foreground italic mt-0.5">
                  Los roles base del sistema no permiten renombrarse.
                </span>
              )}
            </Field>

            <Field>
              <FieldLabel className="text-xs font-semibold">Descripción (Opcional)</FieldLabel>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve propósito del rol..."
                className="h-9 text-xs"
              />
            </Field>
          </div>

          {/* Permissions Matrix */}
          <div className="border border-border rounded-xl bg-muted/20 overflow-hidden flex flex-col md:flex-row h-[360px]">
            {/* Left Column: Module tabs */}
            <div className="w-full md:w-48 bg-muted/40 border-r border-border p-2 space-y-1 overflow-y-auto">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1 block">
                Módulos
              </span>
              {modules.map((mod) => {
                const modPerms = permissions.filter((p) => p.module === mod.id);
                const activeCount = modPerms.filter((p) => selectedPermissions.includes(p.code)).length;
                const isActive = activeModuleTab === mod.id;

                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => setActiveModuleTab(mod.id)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className="truncate">{mod.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                        isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {activeCount}/{modPerms.length}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right Column: Checkbox List of current module */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-xs font-bold text-foreground">
                  Permisos de {modules.find((m) => m.id === activeModuleTab)?.label}
                </span>
                <button
                  type="button"
                  onClick={() => handleSelectAllModule(activeModuleTab)}
                  className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                >
                  Seleccionar Todo / Ninguno
                </button>
              </div>

              {isLoadingCatalog ? (
                <div className="py-12 flex justify-center items-center text-xs text-muted-foreground gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  Cargando catálogo...
                </div>
              ) : (
                <div className="space-y-2">
                  {currentModulePermissions.map((perm) => {
                    const isChecked = selectedPermissions.includes(perm.code) || selectedPermissions.includes('*');

                    return (
                      <div
                        key={perm.code}
                        onClick={() => togglePermission(perm.code)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isChecked
                            ? 'bg-primary/5 border-primary/40'
                            : 'bg-card border-border hover:border-border/80'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition-all ${
                            isChecked
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-muted-foreground/40 bg-muted/20'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-foreground">{perm.label}</span>
                            {perm.isDangerous && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                Crítico
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                            {perm.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-[11px] text-muted-foreground">
              Total permisos activos: <strong className="text-foreground">{selectedPermissions.includes('*') ? 'Todos (*)' : selectedPermissions.length}</strong>
            </span>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={isSaving} className="gap-1.5">
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isEditing ? 'Guardar Cambios' : 'Crear Rol'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
