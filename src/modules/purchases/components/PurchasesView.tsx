import React, { useState } from 'react';
import { useSuppliers, useCreateSupplier, useRegisterPurchase } from '../hooks/usePurchases';
import { useBranches } from '../../branches/hooks/useBranches';
import { useProducts } from '../../products/hooks/useProducts';

interface PurchasesViewProps {
}

export const PurchasesView: React.FC<PurchasesViewProps> = () => {
  const { branches } = useBranches();
  const { products } = useProducts();
  const { suppliers } = useSuppliers();
  const { createSupplier } = useCreateSupplier();
  const { registerPurchase } = useRegisterPurchase();

  // Local Supplier inputs
  const [supIdentity, setSupIdentity] = useState('');
  const [supName, setSupName] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supplierSuccess, setSupplierSuccess] = useState('');

  // Local Purchase Order inputs
  const [purSupplier, setPurSupplier] = useState('');
  const [purBranch, setPurBranch] = useState('');
  const [purInvoice, setPurInvoice] = useState('');
  const [purQty, setPurQty] = useState('10');
  const [purCost, setPurCost] = useState('10.00');
  const [purSuccess, setPurSuccess] = useState('');

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName || !supIdentity) return;
    try {
      await createSupplier({
        identityNumber: supIdentity,
        name: supName,
        email: supEmail,
        phone: supPhone,
        address: supAddress
      });
      setSupplierSuccess('¡Proveedor registrado con éxito!');
      setSupIdentity('');
      setSupName('');
      setSupEmail('');
      setSupPhone('');
      setSupAddress('');
      setTimeout(() => setSupplierSuccess(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegisterPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    const sup = purSupplier || (suppliers[0] && suppliers[0].id);
    const branch = purBranch || (branches[0] && branches[0].id);
    if (!sup || !branch || !purInvoice) return;
    try {
      await registerPurchase({
        supplierId: sup,
        branchId: branch,
        invoiceNumber: purInvoice,
        items: []
      });
      setPurSuccess('¡Compra registrada en Kardex!');
      setPurInvoice('');
      setTimeout(() => setPurSuccess(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Directory of Suppliers */}
      <div className="lg:col-span-1 bg-bg-card border border-border-card rounded-2xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-secondary uppercase tracking-wide border-b border-border-card pb-2">Directorio de Proveedores</h4>
          
          {supplierSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
              {supplierSuccess}
            </div>
          )}

          {/* Crear Proveedor */}
          <form onSubmit={handleCreateSupplier} className="space-y-2.5">
            <input 
              type="text" 
              required
              placeholder="RUC / Cédula" 
              value={supIdentity}
              onChange={(e) => setSupIdentity(e.target.value)}
              className="w-full bg-bg-dark border border-border-card rounded-xl py-1.5 px-3 text-xs text-secondary focus:outline-none" 
            />
            <input 
              type="text" 
              required
              placeholder="Razón Social / Nombre" 
              value={supName}
              onChange={(e) => setSupName(e.target.value)}
              className="w-full bg-bg-dark border border-border-card rounded-xl py-1.5 px-3 text-xs text-secondary focus:outline-none" 
            />
            <input 
              type="email" 
              placeholder="Correo Electrónico" 
              value={supEmail}
              onChange={(e) => setSupEmail(e.target.value)}
              className="w-full bg-bg-dark border border-border-card rounded-xl py-1.5 px-3 text-xs text-secondary focus:outline-none" 
            />
            <input 
              type="text" 
              placeholder="Teléfono" 
              value={supPhone}
              onChange={(e) => setSupPhone(e.target.value)}
              className="w-full bg-bg-dark border border-border-card rounded-xl py-1.5 px-3 text-xs text-secondary focus:outline-none" 
            />
            <input 
              type="text" 
              placeholder="Dirección" 
              value={supAddress}
              onChange={(e) => setSupAddress(e.target.value)}
              className="w-full bg-bg-dark border border-border-card rounded-xl py-1.5 px-3 text-xs text-secondary focus:outline-none" 
            />
            <button type="submit" className="w-full py-1.5 bg-primary hover:bg-primary-hover text-white text-[11px] font-bold rounded-xl transition-colors">
              Registrar Proveedor
            </button>
          </form>

          <div className="border-t border-border-card pt-3 space-y-2">
            <span className="text-[10px] text-neutral uppercase font-bold block">Proveedores Registrados</span>
            {suppliers.length === 0 ? (
              <div className="text-[10px] text-neutral text-center">Sin proveedores registrados.</div>
            ) : (
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {suppliers.map((sup: any) => (
                  <div key={sup.id} className="p-2 bg-bg-dark border border-border-card rounded-xl">
                    <span className="text-xs font-bold text-secondary block">{sup.name}</span>
                    <span className="text-[9px] text-neutral block">{sup.email} | {sup.phone}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Purchase Order Stock Supply Panel */}
      <form onSubmit={handleRegisterPurchase} className="lg:col-span-2 bg-bg-card border border-border-card rounded-2xl p-6 space-y-5 shadow-sm">
        <h4 className="text-xs font-bold text-secondary uppercase tracking-wide border-b border-border-card pb-2">Registrar Orden de Compra (Abastecimiento)</h4>
        
        {purSuccess && (
          <div className="p-3 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-medium">
            {purSuccess}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] text-neutral mb-1">Seleccionar Proveedor</label>
            <select 
              value={purSupplier}
              onChange={(e) => setPurSupplier(e.target.value)}
              className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none"
            >
              <option value="">Seleccione proveedor</option>
              {suppliers.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-neutral mb-1">Sucursal de Destino</label>
            <select 
              value={purBranch}
              onChange={(e) => setPurBranch(e.target.value)}
              className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none"
            >
              <option value="">Seleccione sucursal</option>
              {branches.map((b: any) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-[11px] text-neutral mb-1">Número de Factura</label>
            <input 
              type="text" 
              required
              value={purInvoice}
              onChange={(e) => setPurInvoice(e.target.value)}
              placeholder="FAC-001-002-12345" 
              className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3.5 text-xs text-secondary placeholder-gray-400 focus:outline-none" 
            />
          </div>
        </div>

        <div className="border border-border-card rounded-xl p-4 bg-bg-dark space-y-3">
          <span className="text-[11px] font-semibold text-primary block">Detalles de Costos y Stock</span>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <span className="text-[10px] text-neutral block">Producto Base</span>
              <select className="w-full bg-bg-card border border-border-card rounded-lg py-1 px-2 text-xs text-secondary focus:outline-none">
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <span className="text-[10px] text-neutral block">Cantidad a Comprar</span>
              <input 
                type="number" 
                value={purQty} 
                onChange={(e) => setPurQty(e.target.value)}
                className="w-full bg-bg-card border border-border-card rounded-lg py-1 px-2 text-xs text-secondary focus:outline-none" 
              />
            </div>
            <div>
              <span className="text-[10px] text-neutral block">Costo Unitario ($)</span>
              <input 
                type="number" 
                step="0.01"
                value={purCost} 
                onChange={(e) => setPurCost(e.target.value)}
                className="w-full bg-bg-card border border-border-card rounded-lg py-1 px-2 text-xs text-secondary focus:outline-none" 
              />
            </div>
          </div>
        </div>

        <button type="submit" className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-lg transition-colors">
          Generar Orden y Cargar al Inventario (Kardex)
        </button>
      </form>
    </div>
  );
};
export default PurchasesView;
