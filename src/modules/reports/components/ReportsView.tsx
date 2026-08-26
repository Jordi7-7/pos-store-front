import React, { useState } from 'react';
import { Layers, FileText, Boxes } from 'lucide-react';
import { GeneralAnalyticsTab } from './GeneralAnalyticsTab';
import { CostSalesTab } from './CostSalesTab';
import { ValuedInventoryTab } from './ValuedInventoryTab';

export const ReportsView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'cost-sales' | 'valued-inventory'>('general');

  return (
    <div className="space-y-6">
      
      {/* Premium Sub Navigation Tabs */}
      <div className="flex gap-2 border-b border-border-card pb-2 shrink-0">
        <button
          onClick={() => setActiveSubTab('general')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-150 cursor-pointer ${
            activeSubTab === 'general'
              ? 'bg-primary text-white shadow-md shadow-primary/10'
              : 'text-neutral hover:text-secondary hover:bg-bg-card'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Análisis General</span>
        </button>
        <button
          onClick={() => setActiveSubTab('cost-sales')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-150 cursor-pointer ${
            activeSubTab === 'cost-sales'
              ? 'bg-primary text-white shadow-md shadow-primary/10'
              : 'text-neutral hover:text-secondary hover:bg-bg-card'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Costo de Ventas</span>
        </button>
        <button
          onClick={() => setActiveSubTab('valued-inventory')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-150 cursor-pointer ${
            activeSubTab === 'valued-inventory'
              ? 'bg-primary text-white shadow-md shadow-primary/10'
              : 'text-neutral hover:text-secondary hover:bg-bg-card'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Existencias Valuadas</span>
        </button>
      </div>

      {/* Dynamic Sub Tab Contents */}
      {activeSubTab === 'general' && (
        <GeneralAnalyticsTab />
      )}

      {activeSubTab === 'cost-sales' && (
        <CostSalesTab />
      )}

      {activeSubTab === 'valued-inventory' && (
        <ValuedInventoryTab />
      )}

    </div>
  );
};

export default ReportsView;
