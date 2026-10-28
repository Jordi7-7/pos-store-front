import React, { useState } from 'react';
import { Building, MapPin, Plus, Edit2, Loader2 } from 'lucide-react';
import { useBranches } from '../hooks/useBranches';
import type { Branch } from '../services/branches.service';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';
import { APP_PERMISSIONS } from '@/constants/permissions';

export const BranchesManagementTab: React.FC = () => {
  const { branches, isLoading, createBranch, isCreating, updateBranch, isUpdating } = useBranches();
  const { can } = useAuthStore();
  const canCreate = can(APP_PERMISSIONS.BRANCHES_CREATE);
  const canEdit = can(APP_PERMISSIONS.BRANCHES_EDIT);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [isActive, setIsActive] = useState(true);

  const handleOpenCreate = () => {
    setEditingBranch(null);
    setName('');
    setAddress('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setName(branch.name);
    setAddress(branch.address);
    setIsActive(branch.isActive !== undefined ? branch.isActive : true);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;

    if (editingBranch) {
      await updateBranch({
        id: editingBranch.id,
        data: {
          name: name.trim(),
          address: address.trim(),
          isActive,
        },
      });
    } else {
      await createBranch({
        name: name.trim(),
        address: address.trim(),
        isActive,
      });
    }
    setIsModalOpen(false);
  };

  const isSaving = isCreating || isUpdating;

  return (
    <Card className="border border-border-card shadow-sm">
      <CardHeader className="pb-4 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-bold text-secondary flex items-center gap-2">
            <Building className="w-5 h-5 text-primary" /> Sucursales del Negocio
          </CardTitle>
          <CardDescription className="text-xs text-neutral mt-0.5">
            Administra los locales físicos, bodegas y puntos de venta de tu empresa.
          </CardDescription>
        </div>

        {canCreate && (
          <Button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 h-8 text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Sucursal</span>
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-neutral">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-xs">Cargando sucursales...</span>
          </div>
        ) : branches.length === 0 ? (
          <div className="text-center py-8 text-neutral border border-dashed border-border-card rounded-xl">
            <Building className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">No hay sucursales registradas aún.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {branches.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-xl border border-border-card bg-bg-card flex flex-col justify-between hover:border-neutral/30 transition-all gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-secondary">{b.name}</h4>
                      {b.code && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-neutral/10 text-neutral">
                          #{String(b.code).padStart(3, '0')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-neutral/70 shrink-0" />
                      <span>{b.address || 'Sin dirección registrada'}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Badge
                      className={`text-[9.5px] px-2 py-0.5 font-bold ${
                        b.isActive !== false
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {b.isActive !== false ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>
                </div>

                {canEdit && (
                  <div className="pt-2 border-t border-border-card/60 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(b)}
                      className="text-xs text-primary hover:text-primary-hover font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" /> Editar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal Crear / Editar Sucursal */}
        {isModalOpen && (
          <Dialog open={isModalOpen} onOpenChange={(open) => !open && setIsModalOpen(false)}>
            <DialogContent className="sm:max-w-md bg-bg-card border border-border-card text-text-main">
              <DialogHeader>
                <DialogTitle className="text-sm font-bold text-secondary flex items-center gap-2">
                  <Building className="w-4 h-4 text-primary" />
                  {editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSave} className="space-y-4 pt-2">
                <Field>
                  <FieldLabel className="text-[11px] font-bold uppercase tracking-wider">
                    Nombre de la Sucursal *
                  </FieldLabel>
                  <Input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Sucursal Centro, Bodega Norte"
                    className="text-xs h-9"
                    autoFocus
                  />
                </Field>

                <Field>
                  <FieldLabel className="text-[11px] font-bold uppercase tracking-wider">
                    Dirección / Ubicación *
                  </FieldLabel>
                  <Input
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ej. Av. Central #123, Zona Comercial"
                    className="text-xs h-9"
                  />
                </Field>

                <div className="pt-1">
                  <label className="flex items-center gap-2 text-xs font-semibold text-secondary cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary/20 accent-primary"
                    />
                    <span>Sucursal Activa para Operaciones</span>
                  </label>
                  <p className="text-[10px] text-neutral mt-0.5 pl-6">
                    Las sucursales inactivas no aparecen en el punto de venta ni permiten aperturas de caja.
                  </p>
                </div>

                <DialogFooter className="pt-2 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSaving}
                    className="h-8 text-xs cursor-pointer"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving || !name.trim() || !address.trim()}
                    className="h-8 text-xs font-bold cursor-pointer"
                  >
                    {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                    {editingBranch ? 'Guardar Cambios' : 'Crear Sucursal'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
};
