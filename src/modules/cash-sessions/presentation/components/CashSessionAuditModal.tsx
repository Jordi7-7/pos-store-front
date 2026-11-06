import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useCashSessionDetailsQuery } from '../hooks/useCashSessions';
import { useAuditReprint } from '../hooks/useAuditReprint';
import { useTenant } from '../../../auth/presentation/hooks/useSession';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ThermalTicketModal } from '../../../printing/presentation/components/ThermalTicketModal';
import { ThermalClosingTicketModal } from '../../../printing/presentation/components/ThermalClosingTicketModal';
import { AuditHeader } from './audit/AuditHeader';
import { AuditFormulasGuide } from './audit/AuditFormulasGuide';
import { AuditReconciliation } from './audit/AuditReconciliation';
import { AuditMovements } from './audit/AuditMovements';

interface CashSessionAuditModalProps {
  sessionId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

/** Arqueo y auditoría de un turno de caja: cifras, movimientos y reimpresión de tickets. */
export const CashSessionAuditModal: React.FC<CashSessionAuditModalProps> = ({ sessionId, isOpen, onClose }) => {
  const publicTenant = useTenant();
  const { details, entity, isLoading } = useCashSessionDetailsQuery(sessionId);
  const reprint = useAuditReprint(details, entity);
  const [showFormulasGuide, setShowFormulasGuide] = useState(false);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent className="max-h-[92vh] w-[96vw] max-w-[96vw] overflow-x-hidden overflow-y-auto p-5 text-foreground sm:max-w-4xl sm:p-6 lg:max-w-6xl">
          {isLoading || !details ? (
            <div className="flex flex-col items-center justify-center py-28 space-y-3">
              <Loader2 className="w-9 h-9 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Cargando el desglose del turno…</p>
            </div>
          ) : (
            <div className="min-w-0 space-y-6">
              <AuditHeader
                details={details}
                showFormulasGuide={showFormulasGuide}
                onToggleFormulasGuide={() => setShowFormulasGuide((prev) => !prev)}
                onPrintSessionTicket={reprint.printSession}
              />
              {showFormulasGuide && <AuditFormulasGuide details={details} onClose={() => setShowFormulasGuide(false)} />}
              <AuditReconciliation details={details} />
              <AuditMovements details={details} onPrintSale={reprint.printSale} />

            </div>
          )}
        </DialogContent>
      </Dialog>

      {reprint.saleTicket && (
        <ThermalTicketModal isOpen onClose={reprint.closeSaleTicket} saleData={reprint.saleTicket} tenantRuc={publicTenant?.ruc || ''} />
      )}

      {reprint.closingTicket && (
        <ThermalClosingTicketModal
          isOpen
          onClose={reprint.closeClosingTicket}
          sessionData={reprint.closingTicket}
          tenantRuc={publicTenant?.ruc || ''}
          tenantName={publicTenant?.name || ''}
        />
      )}
    </>
  );
};
export default CashSessionAuditModal;
