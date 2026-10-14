import React, { useState } from 'react';
import { Layers, Tag as TagIcon } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { APP_PERMISSIONS } from '@/constants/permissions';
import { useAttributes } from '../hooks/useAttributes';
import { ProductCreateVariableTab } from './ProductCreateVariableTab';
import { AttributeCatalogManager } from './AttributeCatalogManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProductCreateVariableViewProps {
  selectedBranchId: string;
  onSuccess?: () => void;
}

export const ProductCreateVariableView: React.FC<ProductCreateVariableViewProps> = ({
  selectedBranchId,
  onSuccess,
}) => {
  const { can } = usePermissions();
  const canCreate = can(APP_PERMISSIONS.PRODUCTS_CREATE);
  const { attributes } = useAttributes();
  const [activeTab, setActiveTab] = useState<'create' | 'attributes'>('create');

  if (!canCreate) {
    return (
      <div className="p-8 text-center bg-card/40 border border-border-card rounded-2xl">
        <h4 className="text-sm font-semibold text-rose-400">Acceso Restringido</h4>
        <p className="text-xs text-neutral mt-1">No posees permisos para registrar productos compuestos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info - consistent with the rest of the app */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-secondary">Registrar Producto Compuesto</h3>
          <p className="text-xs text-neutral mt-0.5">
            Crea un nuevo artículo con variantes (tallas, colores), códigos de barras y capas de costo independientes.
          </p>
        </div>
      </div>

      {/* Tabs navigation */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'create' | 'attributes')}>
        <TabsList className="bg-muted/40 p-1 mb-2">
          <TabsTrigger value="create" className="gap-2 text-xs font-semibold">
            <Layers className="w-4 h-4" />
            Crear Producto Compuesto
          </TabsTrigger>
          <TabsTrigger value="attributes" className="gap-2 text-xs font-semibold">
            <TagIcon className="w-4 h-4" />
            Catálogo Global de Atributos ({attributes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-4">
          <ProductCreateVariableTab
            selectedBranchId={selectedBranchId}
            onSuccess={onSuccess}
            onNavigateToAttributes={() => setActiveTab('attributes')}
          />
        </TabsContent>

        <TabsContent value="attributes" className="mt-4">
          <AttributeCatalogManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductCreateVariableView;
