import React, { useState } from 'react';
import { PurchaseForm } from './PurchaseForm';
import { PurchaseHistory } from './PurchaseHistory';
import { ClipboardList, History } from 'lucide-react';

export const PurchasesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'register' | 'history'>('register');

  return (
    <div className="space-y-6">
      
      {/* Navigation tabs */}
      <div className="flex gap-2 border-b border-border pb-1 overflow-x-auto max-w-full">
        <button
          onClick={() => setActiveTab('register')}
          className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'register'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          <span>Registrar Ingreso</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'history'
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Historial de Ingresos</span>
        </button>
      </div>

      {/* Tab contents */}
      {activeTab === 'register' && (
        <PurchaseForm onSuccess={() => setActiveTab('history')} />
      )}

      {activeTab === 'history' && (
        <PurchaseHistory />
      )}

    </div>
  );
};
export default PurchasesView;
