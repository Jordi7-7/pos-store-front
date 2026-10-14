import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  User, 
  IdCard, 
  Loader2,
  Users
} from 'lucide-react';
import { useCustomers } from '../hooks/useCustomers';
import type { Customer } from '../types/customers.types';
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

export const CustomersView: React.FC = () => {
  const { 
    customers, 
    isLoading, 
    createCustomer, 
    updateCustomer, 
    deleteCustomer,
    isCreating,
    isUpdating,
    isDeleting 
  } = useCustomers();

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [identityNumber, setIdentityNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchName = c.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchId = c.identityNumber.toLowerCase().includes(searchTerm.toLowerCase());
      return matchName || matchId;
    });
  }, [customers, searchTerm]);

  // Open create form
  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setName('');
    setIdentityNumber('');
    setEmail('');
    setPhone('');
    setIsFormOpen(true);
  };

  // Open edit form
  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setIdentityNumber(customer.identityNumber);
    setEmail(customer.email || '');
    setPhone(customer.phone || '');
    setIsFormOpen(true);
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      return;
    }
    if (!identityNumber.trim()) {
      return;
    }

    try {
      if (editingCustomer) {
        await updateCustomer({
          id: editingCustomer.id,
          dto: { name, identityNumber, email, phone }
        });
      } else {
        await createCustomer({ name, identityNumber, email, phone });
      }
      setIsFormOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  // Open delete confirm
  const handleOpenDelete = (customer: Customer) => {
    setDeletingCustomer(customer);
    setIsDeleteOpen(true);
  };

  // Execute delete
  const handleDelete = async () => {
    if (!deletingCustomer) return;
    try {
      await deleteCustomer(deletingCustomer.id);
      setIsDeleteOpen(false);
      setDeletingCustomer(null);
    } catch (error) {
      console.error(error);
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
                  <Users className="w-4 h-4 text-primary" />
                  Directorio de Clientes ({filteredCustomers.length})
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Administra y organiza el registro de tus clientes frecuentes para ventas y reportes.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-neutral absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o cédula..."
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
                Nuevo Cliente
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">Cargando directorio de clientes...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
            <Users className="w-10 h-10 text-muted-foreground opacity-40" />
            <p className="text-sm text-muted-foreground">No se encontraron clientes registrados.</p>
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
                  <TableHead className="font-semibold text-xs">Cédula / RUC</TableHead>
                  <TableHead className="font-semibold text-xs">Cliente</TableHead>
                  <TableHead className="font-semibold text-xs">Teléfono</TableHead>
                  <TableHead className="font-semibold text-xs">Correo Electrónico</TableHead>
                  <TableHead className="w-[90px] text-center font-semibold text-xs">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((c) => (
                  <TableRow key={c.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors">
                    {/* Avatar / Icon */}
                    <TableCell className="py-2.5 pl-4 pr-1">
                      <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground shrink-0 font-bold text-xs uppercase">
                        {c.name ? c.name.charAt(0) : <User className="w-4 h-4" />}
                      </div>
                    </TableCell>

                    {/* ID / Cédula */}
                    <TableCell className="py-2.5 font-mono text-[11px] font-bold text-primary">
                      {c.identityNumber}
                    </TableCell>

                    {/* Name */}
                    <TableCell className="py-2.5">
                      <div className="font-semibold text-xs text-foreground leading-tight" title={c.name}>
                        {c.name}
                      </div>
                    </TableCell>

                    {/* Phone */}
                    <TableCell className="py-2.5 font-mono text-xs text-foreground/90">
                      {c.phone ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                          {c.phone}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50 text-xs">—</span>
                      )}
                    </TableCell>

                    {/* Email */}
                    <TableCell className="py-2.5 text-xs text-foreground/90">
                      {c.email ? (
                        <span className="inline-flex items-center gap-1.5 truncate max-w-[260px]" title={c.email}>
                          <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate">{c.email}</span>
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
                          onClick={() => handleOpenEdit(c)}
                          title="Editar Cliente"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDelete(c)}
                          title="Eliminar Cliente"
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
              <User className="w-4 h-4 text-primary" />
              {editingCustomer ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral mt-1">
              {editingCustomer ? 'Modifica los datos del cliente seleccionado.' : 'Llena los campos para añadir un nuevo cliente al directorio.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <Field>
              <FieldLabel htmlFor="cust-id" className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                Identificación / RUC / Cédula *
              </FieldLabel>
              <div className="relative mt-1">
                <IdCard className="absolute left-3 top-2.5 w-4 h-4 text-neutral" />
                <Input 
                  id="cust-id" 
                  value={identityNumber}
                  onChange={(e) => setIdentityNumber(e.target.value)}
                  placeholder="Ej: 1712345678"
                  className="pl-9 text-xs"
                  required
                />
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="cust-name" className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                Nombre Completo / Razón Social *
              </FieldLabel>
              <div className="relative mt-1">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-neutral" />
                <Input 
                  id="cust-name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="pl-9 text-xs uppercase"
                  required
                />
              </div>
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="cust-phone" className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                  Teléfono / Celular
                </FieldLabel>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-neutral" />
                  <Input 
                    id="cust-phone" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej: 0998765432"
                    className="pl-9 text-xs"
                  />
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="cust-email" className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                  Correo Electrónico
                </FieldLabel>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-neutral" />
                  <Input 
                    id="cust-email" 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ej: cliente@correo.com"
                    className="pl-9 text-xs"
                  />
                </div>
              </Field>
            </div>

            <div className="flex justify-end gap-2 border-t border-border pt-4 mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsFormOpen(false)}
                className="text-xs font-semibold h-9 rounded-xl"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isCreating || isUpdating}
                className="text-xs font-semibold h-9 rounded-xl"
              >
                {(isCreating || isUpdating) && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                Guardar Cliente
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-sm bg-card border border-border rounded-2xl shadow-xl p-6 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              Eliminar Cliente
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral mt-1">
              ¿Estás seguro de que deseas eliminar a <strong className="text-secondary uppercase">{deletingCustomer?.name}</strong>? Esta acción no se puede deshacer y desvinculará sus datos directos del directorio.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2 border-t border-border pt-4 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteOpen(false)}
              className="text-xs font-semibold h-9 rounded-xl"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold h-9 rounded-xl border-none cursor-pointer"
            >
              {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Confirmar Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};
