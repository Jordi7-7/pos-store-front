import React, { useState } from 'react';
import { PurchaseForm } from './PurchaseForm';
import { SupplierForm } from './SupplierForm';
import { PurchaseHistory } from './PurchaseHistory';
import { ClipboardList, Truck, History } from 'lucide-react';

export const PurchasesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'register' | 'suppliers' | 'history'>('register');

  return (
    <div className="space-y-6">
      
      {/* Navigation tabs */}
      <div className="flex gap-2 border-b border-border-card pb-1 overflow-x-auto max-w-full">
        <button
          onClick={() => setActiveTab('register')}
          className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'register'
              ? 'border-primary text-secondary'
              : 'border-transparent text-neutral hover:text-secondary'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          <span>Registrar Compra</span>
        </button>
        
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'suppliers'
              ? 'border-primary text-secondary'
              : 'border-transparent text-neutral hover:text-secondary'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Proveedores</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'history'
              ? 'border-primary text-secondary'
              : 'border-transparent text-neutral hover:text-secondary'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Historial de Compras</span>
        </button>
      </div>

      {/* Tab contents */}
      {activeTab === 'register' && (
        <PurchaseForm onSuccess={() => setActiveTab('history')} />
      )}

      {activeTab === 'suppliers' && (
        <SupplierForm />
      )}

      {activeTab === 'history' && (
        <PurchaseHistory />
      )}

    </div>
  );
};
export default PurchasesView;
