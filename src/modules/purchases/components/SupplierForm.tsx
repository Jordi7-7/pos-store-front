import React, { useState } from 'react';
import { useSuppliers, useCreateSupplier } from '../hooks/usePurchases';
import { Truck, Plus, Mail, Phone, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const SupplierForm: React.FC = () => {
  const { suppliers, isLoading } = useSuppliers();
  const { createSupplier, isCreating } = useCreateSupplier();

  // Local inputs
  const [supIdentity, setSupIdentity] = useState('');
  const [supName, setSupName] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supAddress, setSupAddress] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim() || !supIdentity.trim()) {
      toast.warning('Por favor completa los campos de identidad y nombre.');
      return;
    }
    try {
      await createSupplier({
        identityNumber: supIdentity.trim(),
        name: supName.trim(),
        email: supEmail.trim(),
        phone: supPhone.trim(),
        address: supAddress.trim()
      });
      toast.success('¡Proveedor registrado con éxito!');
      setSupIdentity('');
      setSupName('');
      setSupEmail('');
      setSupPhone('');
      setSupAddress('');
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar el proveedor.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      
      {/* Create Supplier Panel */}
      <div className="lg:col-span-1 bg-bg-card border border-border-card rounded-2xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
        <div className="space-y-4">
          <div className="border-b border-border-card pb-3">
            <h4 className="text-xs font-bold text-secondary uppercase tracking-wide flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-primary" />
              <span>Nuevo Proveedor</span>
            </h4>
            <p className="text-[10px] text-neutral mt-0.5">Ingresa los datos fiscales y de contacto.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[9px] text-neutral mb-1 uppercase tracking-wider font-bold">RUC / Cédula *</label>
              <input 
                type="text" 
                required
                placeholder="Ej. 1792348592001" 
                value={supIdentity}
                onChange={(e) => setSupIdentity(e.target.value)}
                className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none placeholder-neutral" 
              />
            </div>

            <div>
              <label className="block text-[9px] text-neutral mb-1 uppercase tracking-wider font-bold">Razón Social / Nombre *</label>
              <input 
                type="text" 
                required
                placeholder="Ej. Corporación Favorita S.A." 
                value={supName}
                onChange={(e) => setSupName(e.target.value)}
                className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none placeholder-neutral" 
              />
            </div>

            <div>
              <label className="block text-[9px] text-neutral mb-1 uppercase tracking-wider font-bold">Correo Electrónico</label>
              <input 
                type="email" 
                placeholder="Ej. compras@proveedor.com" 
                value={supEmail}
                onChange={(e) => setSupEmail(e.target.value)}
                className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none placeholder-neutral" 
              />
            </div>

            <div>
              <label className="block text-[9px] text-neutral mb-1 uppercase tracking-wider font-bold">Teléfono de Contacto</label>
              <input 
                type="text" 
                placeholder="Ej. +593 999 999 999" 
                value={supPhone}
                onChange={(e) => setSupPhone(e.target.value)}
                className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none placeholder-neutral" 
              />
            </div>

            <div>
              <label className="block text-[9px] text-neutral mb-1 uppercase tracking-wider font-bold">Dirección Física</label>
              <input 
                type="text" 
                placeholder="Ej. Av. de los Shyris y Portugal" 
                value={supAddress}
                onChange={(e) => setSupAddress(e.target.value)}
                className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none placeholder-neutral" 
              />
            </div>

            <button 
              type="submit" 
              disabled={isCreating}
              className="w-full py-2.5 bg-primary hover:bg-primary-hover disabled:bg-neutral/20 disabled:text-neutral/60 text-white text-xs font-bold rounded-xl transition-all shadow flex items-center justify-center gap-1.5"
            >
              {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Registrar Proveedor</span>
            </button>
          </form>
        </div>
      </div>

      {/* Directory of Suppliers */}
      <div className="lg:col-span-2 bg-bg-card border border-border-card rounded-2xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
        <div className="space-y-4">
          <div className="border-b border-border-card pb-3">
            <h4 className="text-xs font-bold text-secondary uppercase tracking-wide flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-primary" />
              <span>Directorio de Proveedores Activos</span>
            </h4>
            <p className="text-[10px] text-neutral mt-0.5 font-medium">Listado detallado de contacto de proveedores registrados.</p>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-xs text-neutral flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span>Cargando proveedores...</span>
            </div>
          ) : suppliers.length === 0 ? (
            <div className="py-16 text-center text-xs text-neutral italic border-2 border-dashed border-border-card rounded-2xl">
              No hay proveedores registrados todavía.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
              {suppliers.map((sup: any) => (
                <div key={sup.id} className="p-4 bg-bg-dark border border-border-card hover:border-primary/30 rounded-2xl text-secondary space-y-2.5 transition-all shadow-sm">
                  <div className="flex justify-between items-start gap-2 border-b border-border-card/50 pb-1.5">
                    <span className="text-xs font-bold block truncate max-w-[170px]">{sup.name}</span>
                    <span className="text-[9px] font-bold text-primary font-mono bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                      RUC: {sup.identityNumber}
                    </span>
                  </div>
                  
                  <div className="space-y-1.5 text-[10.5px] text-neutral">
                    {sup.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-neutral" />
                        <span className="truncate">{sup.email}</span>
                      </div>
                    )}
                    {sup.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-neutral" />
                        <span>{sup.phone}</span>
                      </div>
                    )}
                    {sup.address && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-neutral" />
                        <span className="truncate">{sup.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
export default SupplierForm;
