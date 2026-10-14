import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  IdCard, 
  Loader2,
  Truck,
  Building
} from 'lucide-react';
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from '../hooks/usePurchases';
import type { Supplier } from '../services/purchases.service';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export const SuppliersView: React.FC = () => {
  const { suppliers, isLoading } = useSuppliers();
  const { createSupplier, isCreating } = useCreateSupplier();
  const { updateSupplier, isUpdating } = useUpdateSupplier();
  const { deleteSupplier, isDeleting } = useDeleteSupplier();

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [identityNumber, setIdentityNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const matchName = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchId = (s.identityNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchName || matchId;
    });
  }, [suppliers, searchTerm]);

  // Open create form
  const handleOpenCreate = () => {
    setEditingSupplier(null);
    setName('');
    setIdentityNumber('');
    setEmail('');
    setPhone('');
    setAddress('');
    setIsFormOpen(true);
  };

  // Open edit form
  const handleOpenEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setName(supplier.name);
    setIdentityNumber(supplier.identityNumber);
    setEmail(supplier.email || '');
    setPhone(supplier.phone || '');
    setAddress(supplier.address || '');
    setIsFormOpen(true);
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning('Ingresa el nombre o razón social');
      return;
    }
    if (!identityNumber.trim()) {
      toast.warning('Ingresa el RUC o identificación');
      return;
    }

    try {
      if (editingSupplier) {
        await updateSupplier({
          id: editingSupplier.id,
          input: {
            name: name.trim(),
            identityNumber: identityNumber.trim(),
            email: email.trim() || undefined,
            phone: phone.trim() || undefined,
            address: address.trim() || undefined,
          },
        });
        toast.success('Proveedor actualizado correctamente');
      } else {
        await createSupplier({
          name: name.trim(),
          identityNumber: identityNumber.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
        });
        toast.success('Proveedor creado correctamente');
      }
      setIsFormOpen(false);
    } catch (error: any) {
      toast.error(error?.message || 'Error al guardar el proveedor');
    }
  };

  // Open delete confirm
  const handleOpenDelete = (supplier: Supplier) => {
    setDeletingSupplier(supplier);
    setIsDeleteOpen(true);
  };

  // Execute delete
  const handleDelete = async () => {
    if (!deletingSupplier) return;
    try {
      await deleteSupplier(deletingSupplier.id);
      toast.success('Proveedor eliminado correctamente');
      setIsDeleteOpen(false);
      setDeletingSupplier(null);
    } catch (error: any) {
      toast.error(error?.message || 'No se pudo eliminar el proveedor');
    }
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
                  Directorio de Proveedores ({filteredSuppliers.length})
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
                onClick={handleOpenCreate}
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
          ) : filteredSuppliers.length === 0 ? (
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
            <div className="overflow-x-auto rounded-b-xl border-t border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead className="font-semibold text-xs">RUC / Identificación</TableHead>
                    <TableHead className="font-semibold text-xs">Razón Social</TableHead>
                    <TableHead className="font-semibold text-xs">Teléfono</TableHead>
                    <TableHead className="font-semibold text-xs">Correo Electrónico</TableHead>
                    <TableHead className="font-semibold text-xs">Dirección</TableHead>
                    <TableHead className="w-[90px] text-center font-semibold text-xs">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((sup) => (
                    <TableRow key={sup.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors">
                      {/* Avatar / Icon */}
                      <TableCell className="py-2.5 pl-4 pr-1">
                        <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground shrink-0 font-bold text-xs uppercase">
                          {sup.name ? sup.name.charAt(0) : <Truck className="w-4 h-4" />}
                        </div>
                      </TableCell>

                      {/* ID / RUC */}
                      <TableCell className="py-2.5 font-mono text-[11px] font-bold text-primary">
                        {sup.identityNumber}
                      </TableCell>

                      {/* Name */}
                      <TableCell className="py-2.5">
                        <div className="font-semibold text-xs text-foreground leading-tight" title={sup.name}>
                          {sup.name}
                        </div>
                      </TableCell>

                      {/* Phone */}
                      <TableCell className="py-2.5 font-mono text-xs text-foreground/90">
                        {sup.phone ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                            {sup.phone}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50 text-xs">—</span>
                        )}
                      </TableCell>

                      {/* Email */}
                      <TableCell className="py-2.5 text-xs text-foreground/90">
                        {sup.email ? (
                          <span className="inline-flex items-center gap-1.5 truncate max-w-[200px]" title={sup.email}>
                            <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{sup.email}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50 text-xs">—</span>
                        )}
                      </TableCell>

                      {/* Address */}
                      <TableCell className="py-2.5 text-xs text-foreground/90">
                        {sup.address ? (
                          <span className="inline-flex items-center gap-1.5 truncate max-w-[200px]" title={sup.address}>
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{sup.address}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50 text-xs">—</span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(sup)}
                            title="Editar Proveedor"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDelete(sup)}
                            title="Eliminar Proveedor"
                            className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog (Create / Edit) */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md bg-card border border-border rounded-2xl shadow-xl p-6 text-foreground">
          <DialogHeader className="border-b border-border pb-3">
            <DialogTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" />
              {editingSupplier ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral mt-1">
              {editingSupplier ? 'Modifica los datos del proveedor seleccionado.' : 'Llena los campos para añadir un nuevo proveedor comercial.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <Field>
              <FieldLabel htmlFor="sup-id" className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                RUC / Identificación *
              </FieldLabel>
              <div className="relative mt-1">
                <IdCard className="absolute left-3 top-2.5 w-4 h-4 text-neutral" />
                <Input 
                  id="sup-id" 
                  value={identityNumber}
                  onChange={(e) => setIdentityNumber(e.target.value)}
                  placeholder="Ej: 1792348592001"
                  className="pl-9 text-xs"
                  required
                />
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="sup-name" className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                Nombre / Razón Social *
              </FieldLabel>
              <div className="relative mt-1">
                <Building className="absolute left-3 top-2.5 w-4 h-4 text-neutral" />
                <Input 
                  id="sup-name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Distribuidora Nacional S.A."
                  className="pl-9 text-xs"
                  required
                />
              </div>
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="sup-phone" className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                  Teléfono / Celular
                </FieldLabel>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-neutral" />
                  <Input 
                    id="sup-phone" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej: 0998765432"
                    className="pl-9 text-xs"
                  />
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="sup-email" className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                  Correo Electrónico
                </FieldLabel>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-neutral" />
                  <Input 
                    id="sup-email" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ej: compras@proveedor.com"
                    className="pl-9 text-xs"
                  />
                </div>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="sup-address" className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                Dirección / Ubicación
              </FieldLabel>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-neutral" />
                <Input 
                  id="sup-address" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej: Av. Amazonas y República"
                  className="pl-9 text-xs"
                />
              </div>
            </Field>

            <div className="flex justify-end gap-2 border-t border-border pt-4 mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsFormOpen(false)}
                className="text-xs font-semibold h-8 rounded-xl cursor-pointer"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isCreating || isUpdating}
                className="text-xs font-semibold h-8 rounded-xl shadow-xs cursor-pointer"
              >
                {isCreating || isUpdating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Guardando...
                  </>
                ) : (
                  editingSupplier ? 'Guardar Cambios' : 'Registrar Proveedor'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-sm bg-card border border-border rounded-2xl shadow-xl p-6 text-foreground">
          <DialogHeader className="border-b border-border pb-3">
            <DialogTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-rose-500">
              <Trash2 className="w-4 h-4 text-rose-500" />
              Eliminar Proveedor
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral mt-2">
              ¿Estás seguro de que deseas eliminar al proveedor <strong className="text-foreground">{deletingSupplier?.name}</strong>?
              Esta acción no se puede deshacer si no posee compras históricas asociadas.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteOpen(false)}
              className="text-xs font-semibold h-8 rounded-xl cursor-pointer"
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-xs font-semibold h-8 rounded-xl cursor-pointer"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Eliminando...
                </>
              ) : (
                'Eliminar'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default SuppliersView;
