import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Banknote, CreditCard, Loader2, Printer, RotateCcw } from 'lucide-react';
import { useSaleByInvoice } from '../hooks/useSaleDetail';
import { ThermalTicketModal } from '../../../printing/presentation/components/ThermalTicketModal';
import { useTenant } from '@/modules/auth/presentation/hooks/useSession';
import { PAYMENT_METHOD_LABEL, SALE_STATUS_BADGE, toTicketSaleData, type SaleDetailItemVM, type SaleDetailVM, type SaleRefundVM } from '../view-models/sale.vm';
import { useFormatters } from '@/modules/auth/presentation/hooks/useFormatters';
import { useIsMobile } from '@/hooks/use-mobile';
import { PaymentMethod } from '@/shared/domain/enums/payments';

interface SaleDetailModalProps {
  invoiceNumber?: string;
  isOpen: boolean;
  onClose: () => void;
}

const Fact: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="min-w-0">
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="mt-0.5 truncate text-sm font-medium text-secondary">{children}</dd>
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => <h3 className="text-base font-semibold text-secondary">{children}</h3>;

const ItemTag: React.FC<{ item: SaleDetailItemVM }> = ({ item }) => {
  if (item.refundedQty <= 0) return null;
  const full = item.refundedQty >= item.quantity;
  return (
    <span className={`mt-1 inline-flex h-5 items-center rounded-full px-2 text-xs font-medium ${full ? 'bg-rose-500/10 text-rose-700' : 'bg-amber-500/10 text-amber-700'}`}>
      {full ? 'Devuelto' : `Devuelto ${item.refundedQty} de ${item.quantity}`}
    </span>
  );
};

const ItemsTable: React.FC<{ items: SaleDetailItemVM[]; discount: (n: number) => string }> = ({ items, discount }) => (
  <div className="overflow-x-auto rounded-lg border border-border-card">
    <table className="w-full text-left text-[13px]">
      <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
        <tr>
          <th className="px-3 py-2.5 font-medium">Producto</th>
          <th className="px-3 py-2.5 font-medium">SKU</th>
          <th className="px-3 py-2.5 text-right font-medium">Cant.</th>
          <th className="px-3 py-2.5 text-right font-medium">Precio</th>
          <th className="px-3 py-2.5 text-right font-medium">Descuento</th>
          <th className="px-3 py-2.5 text-right font-medium">Total</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.saleItemId} className="border-t border-border-card/70 align-top">
            <td className="px-3 py-2.5">
              <span className="block font-medium text-secondary">{item.productName}</span>
              <span className="block text-xs text-muted-foreground">{item.attributes || 'Estándar'}</span>
              <ItemTag item={item} />
            </td>
            <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{item.sku || 'S/SKU'}</td>
            <td className="px-3 py-2.5 text-right tabular-nums">{item.quantity}</td>
            <td className="px-3 py-2.5 text-right tabular-nums">{item.priceFormatted}</td>
            <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{item.discountAmount > 0 ? `−${discount(item.discountAmount)}` : '—'}</td>
            <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-secondary">{item.lineTotalFormatted}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ItemsCards: React.FC<{ items: SaleDetailItemVM[]; discount: (n: number) => string }> = ({ items, discount }) => (
  <ul className="divide-y divide-border-card/70 rounded-lg border border-border-card">
    {items.map((item) => (
      <li key={item.saleItemId} className="space-y-1 p-3 text-[13px]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="block font-medium text-secondary">{item.productName}</span>
            <span className="block text-xs text-muted-foreground">
              {item.attributes || 'Estándar'} · <span className="font-mono">{item.sku || 'S/SKU'}</span>
            </span>
            <ItemTag item={item} />
          </div>
          <span className="shrink-0 font-semibold tabular-nums text-secondary">{item.lineTotalFormatted}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {item.quantity} × {item.priceFormatted}
          {item.discountAmount > 0 ? ` · descuento −${discount(item.discountAmount)}` : ''}
        </p>
      </li>
    ))}
  </ul>
);

const Row: React.FC<{ label: string; value: string; tone?: string }> = ({ label, value, tone }) => (
  <div className={`flex items-center justify-between gap-3 text-sm ${tone ?? ''}`}>
    <span className={tone ? '' : 'text-muted-foreground'}>{label}</span>
    <span className="font-medium tabular-nums">{value}</span>
  </div>
);

const PaymentsAndSummary: React.FC<{ sale: SaleDetailVM }> = ({ sale }) => (
  <div className="grid gap-6 md:grid-cols-2">
    <section className="space-y-3">
      <SectionTitle>Métodos de pago</SectionTitle>
      <ul className="space-y-2">
        {sale.payments.map((payment) => {
          const Icon = payment.paymentMethod === PaymentMethod.TARJETA ? CreditCard : Banknote;
          return (
            <li key={payment.id || `${payment.paymentMethod}-${payment.amount}`} className="flex items-center justify-between gap-3 rounded-lg border border-border-card px-3 py-2.5 text-sm">
              <span className="flex items-center gap-2 text-secondary">
                <Icon className="size-4 text-muted-foreground" />
                {PAYMENT_METHOD_LABEL[payment.paymentMethod]}
              </span>
              <span className="font-medium tabular-nums">{payment.amountFormatted}</span>
            </li>
          );
        })}
      </ul>
    </section>
    <section className="space-y-3">
      <SectionTitle>Resumen</SectionTitle>
      <div className="space-y-2 rounded-lg border border-border-card p-3">
        <Row label="Subtotal" value={sale.subtotalFormatted} />
        {sale.discountAmount > 0 && <Row label="Descuento" value={`−${sale.discountAmountFormatted}`} tone="text-emerald-700" />}
        <div className="flex items-center justify-between border-t border-border-card pt-3">
          <span className="text-sm font-medium text-secondary">Total</span>
          <span className="text-xl font-semibold tabular-nums text-secondary">{sale.totalFormatted}</span>
        </div>
      </div>
    </section>
  </div>
);

const Refunds: React.FC<{ refunds: SaleRefundVM[] }> = ({ refunds }) => (
  <section className="space-y-3">
    <h3 className="flex items-center gap-2 text-base font-semibold text-secondary">
      <RotateCcw className="size-4 text-rose-600" />
      Historial de devoluciones
    </h3>
    <ul className="space-y-3">
      {refunds.map((refund) => (
        <li key={refund.id} className="rounded-lg border border-border-card border-l-2 border-l-rose-400 p-3.5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="text-sm font-medium text-secondary">{refund.dateFormatted}</span>
            <span className="text-sm font-semibold tabular-nums text-rose-700">−{refund.totalRefundedFormatted}</span>
          </div>
          {refund.reason && <p className="mt-0.5 text-xs text-muted-foreground">Motivo: {refund.reason}</p>}
          <ul className="mt-2.5 space-y-1 border-t border-border-card/70 pt-2.5">
            {refund.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 text-[13px]">
                <span className="min-w-0 truncate text-muted-foreground">
                  {item.productName} · <span className="font-mono text-xs">{item.sku}</span> × {item.quantity}
                </span>
                <span className="tabular-nums">{item.priceRefundedFormatted}</span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  </section>
);

export const SaleDetailModal: React.FC<SaleDetailModalProps> = ({ invoiceNumber, isOpen, onClose }) => {
  const { sale, isLoading, isError } = useSaleByInvoice(invoiceNumber, isOpen);
  const publicTenant = useTenant();
  const fmt = useFormatters();
  const isMobile = useIsMobile();
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  const saleDataForTicket = useMemo(() => (sale ? toTicketSaleData(sale, fmt) : null), [sale, fmt]);
  const status = sale ? SALE_STATUS_BADGE[sale.status] : null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="flex max-h-[92vh] w-[96vw] max-w-[96vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl lg:max-w-4xl">
          <DialogHeader className="shrink-0 space-y-4 border-b border-border-card px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-3 pr-8">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <DialogTitle className="text-xl font-semibold tracking-tight text-secondary">{sale ? `Venta ${sale.invoiceNumber}` : 'Detalle de venta'}</DialogTitle>
                  {status && <span className={`inline-flex h-6 items-center rounded-full border px-2.5 text-xs font-medium ${status.className}`}>{status.label}</span>}
                </div>
                <DialogDescription className="mt-1 text-sm text-muted-foreground">{sale ? `${sale.dateFormatted} · ${sale.branchName}` : 'Cargando…'}</DialogDescription>
              </div>
              {sale && (
                <Button variant="outline" size="sm" onClick={() => setIsTicketModalOpen(true)} className="cursor-pointer gap-2">
                  <Printer className="size-4" />
                  Imprimir ticket
                </Button>
              )}
            </div>
            {sale && (
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                <Fact label="Cliente">{sale.customerName}</Fact>
                <Fact label="Atendido por">{sale.userName || '—'}</Fact>
              </dl>
            )}
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            {isLoading && (
              <div className="flex justify-center py-16">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            )}
            {isError && <p role="alert" className="py-16 text-center text-sm text-destructive">No se pudo cargar el detalle de la venta.</p>}
            {sale && (
              <div className="space-y-7">
                <section className="space-y-3">
                  <SectionTitle>Artículos vendidos</SectionTitle>
                  {isMobile ? <ItemsCards items={sale.items} discount={fmt.money} /> : <ItemsTable items={sale.items} discount={fmt.money} />}
                </section>
                <PaymentsAndSummary sale={sale} />
                {sale.refunds.length > 0 && <Refunds refunds={sale.refunds} />}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {isTicketModalOpen && <ThermalTicketModal isOpen={isTicketModalOpen} onClose={() => setIsTicketModalOpen(false)} saleData={saleDataForTicket} tenantRuc={publicTenant?.ruc || ''} />}
    </>
  );
};

export default SaleDetailModal;
