import React, { useState, useEffect } from 'react';
import { User, IdCard, Phone, Mail, Loader2 } from 'lucide-react';
import type { CustomerEntity } from '../entities/customer.entity';
import type { CustomerFormData } from '../types/customer.types';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerEntity | null;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  isSubmitting: boolean;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSubmit,
  isSubmitting,
}) => {
  const [identityNumber, setIdentityNumber] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (customer) {
      setIdentityNumber(customer.identityNumber || '');
      setName(customer.name || '');
      setEmail(customer.email || '');
      setPhone(customer.phone || '');
    } else {
      setIdentityNumber('');
      setName('');
      setEmail('');
      setPhone('');
    }
  }, [customer, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !identityNumber.trim()) {
      return;
    }
    await onSubmit({
      identityNumber: identityNumber.trim(),
      name: name.trim(),
      email: email.trim() ? email.trim() : null,
      phone: phone.trim() ? phone.trim() : null,
    });
  };

  const isEditing = Boolean(customer);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border border-border rounded-2xl shadow-xl p-6 text-foreground">
        <DialogHeader className="border-b border-border pb-3">
          <DialogTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            {isEditing ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral mt-1">
            {isEditing
              ? 'Modifica los datos del cliente seleccionado.'
              : 'Llena los campos para añadir un nuevo cliente al directorio.'}
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
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs font-semibold h-9 rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="text-xs font-semibold h-9 rounded-xl"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Guardar Cliente
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
