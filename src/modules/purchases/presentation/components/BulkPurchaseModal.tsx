import React, { useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLayoutContext } from '@/providers/LayoutContext';
import { useDefaultSupplier } from '../hooks/useDefaultSupplier';
import { usePurchaseSheetImport } from '../hooks/usePurchaseSheetImport';
import { useSuppliers } from '../hooks/useSuppliers';
import { BulkPreviewStep } from './BulkPreviewStep';
import { BulkUploadStep } from './BulkUploadStep';

interface BulkPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Ingreso masivo desde Excel en dos pasos: subir el archivo y revisar la vista previa. El flujo vive en `usePurchaseSheetImport`. */
export const BulkPurchaseModal: React.FC<BulkPurchaseModalProps> = ({ isOpen, onClose }) => {
  const { selectedBranchId, selectedBranchName } = useLayoutContext();
  const { suppliers } = useSuppliers();
  const { supplierId, setSupplierId } = useDefaultSupplier(suppliers);
  const [invoiceNumber, setInvoiceNumber] = useState('');

  const sheet = usePurchaseSheetImport({
    branchId: selectedBranchId || undefined,
    supplierId,
    invoiceNumber,
    onImported: () => {
      setInvoiceNumber('');
      onClose();
    },
  });

  const resetAll = () => {
    setInvoiceNumber('');
    sheet.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-4xl w-full bg-card border border-border rounded-2xl shadow-2xl p-6 text-foreground">
        <DialogHeader className="border-b border-border pb-3">
          <DialogTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            <span>Ingreso Masivo de Mercancía (Excel)</span>
          </DialogTitle>
        </DialogHeader>

        {sheet.items.length === 0 ? (
          <BulkUploadStep
            branchId={selectedBranchId || undefined}
            branchName={selectedBranchName}
            suppliers={suppliers}
            supplierId={supplierId}
            onSupplierChange={setSupplierId}
            invoiceNumber={invoiceNumber}
            onInvoiceChange={setInvoiceNumber}
            fileInputRef={sheet.fileInputRef}
            onPickFile={sheet.pickFile}
            onFileSelected={sheet.onFileSelected}
          />
        ) : (
          <BulkPreviewStep
            fileName={sheet.fileName}
            items={sheet.items}
            errors={sheet.errors}
            names={sheet.names}
            errorCount={sheet.errorCount}
            invoiceNumber={invoiceNumber}
            branchId={selectedBranchId || undefined}
            branchName={selectedBranchName}
            globalError={sheet.globalError}
            isValidating={sheet.isValidating}
            isValidated={sheet.isValidated}
            isImporting={sheet.isImporting}
            canConfirm={sheet.canConfirm}
            onReset={resetAll}
            onConfirm={sheet.confirm}
            onCancel={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
export default BulkPurchaseModal;
