import React from 'react';
import { Package, Sparkles, Tag as TagIcon } from 'lucide-react';
import { useAttributes } from '../hooks/useAttributes';
import { useCategories } from '../hooks/useCategories';
import { useVariableProductWizard } from '../hooks/useVariableProductWizard';
import { ImageUploadModal } from './forms/ImageUploadModal';
import { MediaGallerySelectorModal } from './forms/MediaGallerySelectorModal';
import { StepAttributeSelection, StepGeneralInfo, StepVariantsMatrix, WizardProgressBar } from './variable-wizard';

interface ProductCreateVariableTabProps {
  selectedBranchId: string;
  onSuccess?: () => void;
  onNavigateToAttributes?: () => void;
}

const WIZARD_STEPS = [
  {
    number: 1,
    title: 'Información General',
    description: 'Nombre, categoría y fotografías',
    icon: Package,
  },
  {
    number: 2,
    title: 'Atributos y Opciones',
    description: 'Tallas, colores, dimensiones',
    icon: TagIcon,
  },
  {
    number: 3,
    title: 'Matriz y Precios',
    description: 'SKU, costos y stock por variante',
    icon: Sparkles,
  },
];

/**
 * Asistente de alta de producto compuesto en tres pasos. El estado, los pasos y la petición final viven en
 * `useVariableProductWizard`; las reglas (combinaciones, SKU, valores en bloque) en `domain/rules/variable-wizard`.
 */
export const ProductCreateVariableTab: React.FC<ProductCreateVariableTabProps> = ({ selectedBranchId, onSuccess, onNavigateToAttributes }) => {
  const { categories, createCategory, isCreating: isCreatingCategory } = useCategories();
  const { attributes, isLoading: isLoadingAttributes, createAttribute, isCreatingAttribute, createAttributeValue, isCreatingValue } = useAttributes();
  const wizard = useVariableProductWizard({ branchId: selectedBranchId, attributes, onSuccess });
  const { images, bulk, setBulkField } = wizard;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <WizardProgressBar steps={WIZARD_STEPS} currentStep={wizard.step} onStepClick={(step) => step < wizard.step && wizard.setStep(step)} />

      {wizard.step === 1 && (
        <StepGeneralInfo
          control={wizard.form.control}
          errors={wizard.form.formState.errors}
          categories={categories}
          createCategory={createCategory}
          isCreatingCategory={isCreatingCategory}
          selectedImages={images.productImages}
          onRemoveImage={images.removeProductImage}
          onOpenGalleryModal={images.openGalleryForProduct}
          onOpenUploadModal={images.openUploadForProduct}
          onNext={wizard.goToAttributes}
        />
      )}

      {wizard.step === 2 && (
        <StepAttributeSelection
          attributes={attributes}
          isLoadingAttributes={isLoadingAttributes}
          selectedAttributeValues={wizard.selectedValues}
          onToggleValue={wizard.toggleValue}
          createAttribute={createAttribute}
          isCreatingAttribute={isCreatingAttribute}
          createAttributeValue={createAttributeValue}
          isCreatingValue={isCreatingValue}
          onNavigateToAttributes={onNavigateToAttributes}
          onBack={() => wizard.setStep(1)}
          onGenerateAndProceed={wizard.generateVariants}
        />
      )}

      {wizard.step === 3 && (
        <StepVariantsMatrix
          variants={wizard.rows}
          baseSkuPrefix={wizard.baseSkuHeader || bulk.skuPrefix}
          onUpdateVariantField={wizard.updateField}
          onRemoveVariantRow={wizard.removeRow}
          onClearVariants={wizard.clearRows}
          onOpenVariantGallery={images.openGalleryForVariant}
          bulkSkuPrefix={bulk.skuPrefix}
          setBulkSkuPrefix={setBulkField('skuPrefix')}
          bulkPurchasePrice={bulk.purchasePrice}
          setBulkPurchasePrice={setBulkField('purchasePrice')}
          bulkSalePrice={bulk.salePrice}
          setBulkSalePrice={setBulkField('salePrice')}
          bulkWholesalePrice={bulk.wholesalePrice}
          setBulkWholesalePrice={setBulkField('wholesalePrice')}
          bulkStock={bulk.stock}
          setBulkStock={setBulkField('stock')}
          onApplyBulk={wizard.applyBulk}
          isSubmitting={wizard.isSubmitting}
          isAllBranches={!selectedBranchId}
          onBack={() => wizard.setStep(2)}
          onSubmit={wizard.submit}
        />
      )}

      <MediaGallerySelectorModal
        open={images.isGalleryOpen}
        onOpenChange={images.setGalleryOpen}
        selectedImages={images.selectedInGallery}
        onToggleImage={images.toggleImage}
        onOpenUploadModal={() => images.setUploadOpen(true)}
      />
      <ImageUploadModal open={images.isUploadOpen} onOpenChange={images.setUploadOpen} onImageSaved={images.addUploaded} />
    </div>
  );
};

export default ProductCreateVariableTab;
