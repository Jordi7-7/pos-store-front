import React, { useState } from 'react';
import { FileSpreadsheet, Layers, Tag as TagIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';
import { APP_PERMISSIONS } from '@/constants/permissions';
import { useAttributes } from '../../hooks/useAttributes';
import { ProductCreateVariableTab } from '../ProductCreateVariableTab';
import { VariantImportModal } from '../VariantImportModal';
import { AttributeCatalogManager } from '../AttributeCatalogManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/shared/presentation/components/PageHeader';

export interface ProductCreateVariableViewProps {
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
  const [isImportOpen, setIsImportOpen] = useState(false);

  if (!canCreate) {
    return (
      <div className="p-8 text-center bg-card/40 border border-border-card rounded-2xl">
        <h4 className="text-sm font-semibold text-rose-400">Acceso restringido</h4>
        <p className="text-xs text-neutral mt-1">No tienes permiso para crear productos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Crear con variantes"
        description="Un producto con variantes (tallas, colores…), cada una con su SKU, precios y stock."
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => setIsImportOpen(true)} className="cursor-pointer gap-1.5 text-xs font-semibold">
            <FileSpreadsheet className="h-4 w-4" />
            Importar desde Excel
          </Button>
        }
      />

      {/* Tabs navigation */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'create' | 'attributes')}>
        <TabsList className="mb-2 h-auto max-w-full justify-start overflow-x-auto bg-muted/40 p-1">
          <TabsTrigger value="create" className="gap-2 text-xs font-semibold">
            <Layers className="w-4 h-4" />
            Crear producto
          </TabsTrigger>
          <TabsTrigger value="attributes" className="gap-2 text-xs font-semibold">
            <TagIcon className="w-4 h-4" />
            Catálogo de atributos ({attributes.length})
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
      <VariantImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} selectedBranchId={selectedBranchId} />
    </div>
  );
};

export default ProductCreateVariableView;
