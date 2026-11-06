import React, { useMemo, useState } from 'react';
import { Loader2, Plus, Search, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { SupplierEntity } from '../../domain/entities/supplier.entity';
import { filterSuppliers } from '../../domain/rules/supplier-form';
import { useSuppliers } from '../hooks/useSuppliers';
import { DeleteSupplierDialog } from './DeleteSupplierDialog';
import { SupplierFormDialog } from './SupplierFormDialog';
import { SuppliersTable } from './SuppliersTable';

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
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary" />
                  Directorio de Proveedores ({filtered.length})
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Gestiona tus proveedores comerciales para el abastecimiento e ingreso de compras al inventario.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-neutral absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o RUC..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-bg-dark border border-border-card rounded-xl text-xs text-secondary placeholder:text-neutral/60 focus:outline-none focus:border-primary/50"
                />
              </div>

              <Button
                onClick={openCreate}
                size="sm"
                className="flex items-center gap-1.5 text-xs font-semibold h-8 rounded-xl shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Nuevo Proveedor
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
