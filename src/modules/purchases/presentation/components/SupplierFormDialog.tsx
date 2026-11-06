import React, { useEffect, useState } from 'react';
import { IdCard, Building, Loader2, Mail, MapPin, Phone, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { getErrorMessage } from '@/shared/presentation/formatting/error-messages';
import type { SupplierEntity } from '../../domain/entities/supplier.entity';
import { emptySupplierForm, supplierToForm, toSupplierInput, validateSupplierForm, type SupplierFormValues } from '../../domain/rules/supplier-form';
import { useCreateSupplier, useUpdateSupplier } from '../hooks/useSuppliers';

interface SupplierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Proveedor que se edita; `null` para dar de alta uno nuevo. */
  supplier: SupplierEntity | null;
}

/** Alta y edición de un proveedor. Guarda aquí su propio formulario: la vista de la lista no lo conoce. */
export const SupplierFormDialog: React.FC<SupplierFormDialogProps> = ({ open, onOpenChange, supplier }) => {
  const { createSupplier, isCreating } = useCreateSupplier();
  const { updateSupplier, isUpdating } = useUpdateSupplier();
  const [values, setValues] = useState<SupplierFormValues>(emptySupplierForm);

  useEffect(() => {
    if (open) setValues(supplier ? supplierToForm(supplier) : emptySupplierForm());
  }, [open, supplier]);

  const set = (field: keyof SupplierFormValues, value: string) => setValues((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validateSupplierForm(values);
    if (problem) {
      toast.warning(problem);
      return;
    }
    try {
      if (supplier) {
        await updateSupplier({ id: supplier.id, input: toSupplierInput(values) });
        toast.success('Proveedor actualizado correctamente');
      } else {
        await createSupplier(toSupplierInput(values));
        toast.success('Proveedor creado correctamente');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Error al guardar el proveedor'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card border border-border rounded-2xl shadow-xl p-6 text-foreground">
        <DialogHeader className="border-b border-border pb-3">
 <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <Truck className="w-4 h-4 text-primary" />
            {supplier ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral mt-1">
            {supplier ? 'Modifica los datos del proveedor seleccionado.' : 'Llena los campos para añadir un nuevo proveedor comercial.'}
          </DialogDescription>
        </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <Field>
 <FieldLabel htmlFor="sup-id" className="text-xs font-bold text-secondary">
                RUC / Identificación *
              </FieldLabel>
              <div className="relative mt-1">
                <IdCard className="absolute left-3 top-2.5 w-4 h-4 text-neutral" />
                <Input 
                  id="sup-id" 
                  value={values.identityNumber}
                  onChange={(e) => set('identityNumber', e.target.value)}
                  placeholder="Ej: 1792348592001"
                  className="pl-9 text-xs"
                  required
                />
              </div>
            </Field>

            <Field>
 <FieldLabel htmlFor="sup-name" className="text-xs font-bold text-secondary">
                Nombre / Razón Social *
              </FieldLabel>
              <div className="relative mt-1">
                <Building className="absolute left-3 top-2.5 w-4 h-4 text-neutral" />
                <Input 
                  id="sup-name" 
                  value={values.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="Ej: Distribuidora Nacional S.A."
                  className="pl-9 text-xs"
                  required
                />
              </div>
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
 <FieldLabel htmlFor="sup-phone" className="text-xs font-bold text-secondary">
                  Teléfono / Celular
                </FieldLabel>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-neutral" />
                  <Input 
                    id="sup-phone" 
                    value={values.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    placeholder="Ej: 0998765432"
                    className="pl-9 text-xs"
                  />
                </div>
              </Field>

              <Field>
 <FieldLabel htmlFor="sup-email" className="text-xs font-bold text-secondary">
                  Correo Electrónico
                </FieldLabel>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-neutral" />
                  <Input 
                    id="sup-email" 
                    type="email"
                    value={values.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="Ej: compras@proveedor.com"
                    className="pl-9 text-xs"
                  />
                </div>
              </Field>
            </div>

            <Field>
 <FieldLabel htmlFor="sup-address" className="text-xs font-bold text-secondary">
                Dirección / Ubicación
              </FieldLabel>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-neutral" />
                <Input 
                  id="sup-address" 
                  value={values.address}
                  onChange={(e) => set('address', e.target.value)}
                  placeholder="Ej: Av. Amazonas y República"
                  className="pl-9 text-xs"
                />
              </div>
            </Field>

            <div className="flex justify-end gap-2 border-t border-border pt-4 mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
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
                  supplier ? 'Guardar Cambios' : 'Registrar Proveedor'
                )}
              </Button>
            </div>
          </form>
      </DialogContent>
    </Dialog>
  );
};
