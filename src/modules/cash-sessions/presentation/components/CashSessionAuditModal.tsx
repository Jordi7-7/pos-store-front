import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useCashSessionDetailsQuery } from '../hooks/useCashSessions';
import { useAuditReprint } from '../hooks/useAuditReprint';
import { useTenant } from '../../../auth/hooks/useSession';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ThermalTicketModal } from '../../../printing/presentation/components/ThermalTicketModal';
import { ThermalClosingTicketModal } from '../../../printing/presentation/components/ThermalClosingTicketModal';
import { AuditHeader } from './audit/AuditHeader';
import { AuditFormulasGuide } from './audit/AuditFormulasGuide';
import { AuditKpis } from './audit/AuditKpis';
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
        <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-5xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl bg-card border border-border rounded-3xl shadow-2xl p-6 sm:p-8 text-foreground max-h-[92vh] overflow-y-auto">
          {isLoading || !details ? (
            <div className="flex flex-col items-center justify-center py-28 space-y-3">
              <Loader2 className="w-9 h-9 text-primary animate-spin" />
              <p className="text-xs text-neutral font-medium">Cargando desglose financiero de la sesión...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <AuditHeader
                details={details}
                showFormulasGuide={showFormulasGuide}
                onToggleFormulasGuide={() => setShowFormulasGuide((prev) => !prev)}
                onPrintSessionTicket={reprint.printSession}
              />
              {showFormulasGuide && <AuditFormulasGuide details={details} onClose={() => setShowFormulasGuide(false)} />}
              <AuditKpis details={details} />
              <AuditMovements details={details} onPrintSale={reprint.printSale} />

              <div className="flex justify-end pt-3">
                <Button onClick={onClose} className="text-xs font-semibold h-9 px-5 rounded-xl cursor-pointer shadow-xs">
                  Cerrar Auditoría
                </Button>
              </div>
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
