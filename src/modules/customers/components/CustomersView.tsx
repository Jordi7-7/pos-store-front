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
import { Card } from '@/components/ui/card';
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
      
      {/* Top Banner & Action */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-primary/5 to-bg-card p-6 rounded-2xl border border-primary/10 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-secondary flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Directorio de Clientes
          </h2>
          <p className="text-xs text-neutral">Administra y organiza el registro de tus clientes frecuentes para ventas y reportes.</p>
        </div>
        <Button 
          onClick={handleOpenCreate} 
          className="flex items-center gap-1.5 text-xs font-semibold h-9 rounded-xl shadow-md shadow-primary/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border border-border-card bg-bg-card flex items-center gap-4 rounded-2xl shadow-sm">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-neutral font-bold uppercase tracking-wider block">Clientes Registrados</span>
            <span className="text-xl font-bold text-secondary font-mono">{customers.length}</span>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-3 bg-bg-card border border-border-card rounded-2xl px-3 py-1.5 shadow-sm max-w-md">
        <Search className="w-4 h-4 text-neutral" />
        <input 
          type="text" 
          placeholder="Buscar por nombre o identificación..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent text-xs text-secondary focus:outline-none w-full placeholder-neutral font-medium"
        />
      </div>

      {/* Customers Table */}
      <Card className="border border-border-card bg-bg-card rounded-2xl shadow-sm p-6 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-neutral">Cargando directorio de clientes...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-16 text-neutral text-xs italic">
            No se encontraron clientes registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="uppercase tracking-wider text-[10px] font-bold">
                  <TableHead className="pr-2">ID / Cédula</TableHead>
                  <TableHead className="px-2">Nombre Completo</TableHead>
                  <TableHead className="px-2">Teléfono</TableHead>
                  <TableHead className="px-2">Correo Electrónico</TableHead>
                  <TableHead className="pl-2 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((c) => (
                  <TableRow key={c.id} className="text-secondary hover:bg-muted/10 transition-colors">
                    <TableCell className="py-3 pr-2 font-mono font-bold text-primary">{c.identityNumber}</TableCell>
                    <TableCell className="py-3 px-2 uppercase font-medium">{c.name}</TableCell>
                    <TableCell className="py-3 px-2 font-mono font-medium">
                      {c.phone ? (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-neutral" />
                          {c.phone}
                        </span>
                      ) : (
                        <span className="text-neutral italic text-[11px]">-</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-2 font-medium">
                      {c.email ? (
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-neutral" />
                          {c.email}
                        </span>
                      ) : (
                        <span className="text-neutral italic text-[11px]">-</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 pl-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(c)}
                          title="Editar Cliente"
                          className="flex items-center justify-center bg-bg-dark border border-border-card hover:bg-muted text-secondary w-8 h-8 rounded-xl transition-all cursor-pointer shadow-sm"
                        >
                          <Edit className="w-3.5 h-3.5 text-primary" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(c)}
                          title="Eliminar Cliente"
                          className="flex items-center justify-center bg-bg-dark border border-border-card hover:bg-muted text-secondary w-8 h-8 rounded-xl transition-all cursor-pointer shadow-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
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
