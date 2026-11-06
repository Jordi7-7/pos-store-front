import React, { useMemo, useState } from 'react';
import { Loader2, Plus, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { SupplierEntity } from '../../domain/entities/supplier.entity';
import { filterSuppliers } from '../../domain/rules/supplier-form';
import { useSuppliers } from '../hooks/useSuppliers';
import { DeleteSupplierDialog } from './DeleteSupplierDialog';
import { SupplierFormDialog } from './SupplierFormDialog';
import { SuppliersTable } from './SuppliersTable';
import { SearchInput } from '@/shared/presentation/components/SearchInput';

/** Directorio de proveedores: búsqueda y lista. El alta/edición y la confirmación de borrado son piezas con su propio estado. */
export const SuppliersView: React.FC = () => {
  const { suppliers, isLoading } = useSuppliers();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierEntity | null>(null);
  const [deleting, setDeleting] = useState<SupplierEntity | null>(null);

  const filtered = useMemo(() => filterSuppliers(suppliers, searchTerm), [suppliers, searchTerm]);

  const openCreate = () => {
    setEditing(null);
    setIsFormOpen(true);
  };
  const openEdit = (supplier: SupplierEntity) => {
    setEditing(supplier);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card className="border border-border/80 shadow-xs">
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">{filtered.length} {filtered.length === 1 ? 'proveedor' : 'proveedores'}</p>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <SearchInput value={searchTerm} onValueChange={setSearchTerm} placeholder="Buscar por nombre o RUC…" aria-label="Buscar proveedor" />

              <Button onClick={openCreate}>
                <Plus />
                Nuevo proveedor
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-xs text-muted-foreground">Cargando directorio de proveedores...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
              <Truck className="w-10 h-10 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground">No se encontraron proveedores registrados.</p>
              {searchTerm && (
                <Button variant="link" size="sm" onClick={() => setSearchTerm('')} className="text-xs">
                  Limpiar búsqueda
                </Button>
              )}
            </div>
          ) : (
            <SuppliersTable suppliers={filtered} onEdit={openEdit} onDelete={setDeleting} />
          )}
        </CardContent>
      </Card>

      <SupplierFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} supplier={editing} />
      <DeleteSupplierDialog supplier={deleting} onClose={() => setDeleting(null)} />
    </div>
  );
};
export default SuppliersView;
