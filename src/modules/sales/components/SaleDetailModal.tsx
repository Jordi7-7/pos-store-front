import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Receipt, RotateCcw } from 'lucide-react';
import { useSaleByInvoice } from '../hooks/useSales';

interface SaleDetailModalProps {
  invoiceNumber?: string;
  isOpen: boolean;
  onClose: () => void;
}

const money = (value: number) => `$${Number(value || 0).toFixed(2)}`;

export const SaleDetailModal: React.FC<SaleDetailModalProps> = ({ invoiceNumber, isOpen, onClose }) => {
  const { sale, isLoading, isError } = useSaleByInvoice(invoiceNumber, isOpen);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:max-w-7xl! h-[calc(100vh-2rem)] max-h-225 flex flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border bg-muted/20 px-7 py-5">
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Receipt className="h-4 w-4 text-primary" />
            {sale ? `Venta ${sale.invoiceNumber}` : 'Detalle de venta'}
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-7 py-6">
          {isLoading && <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
          {isError && <p className="py-16 text-center text-sm text-destructive">No se pudo cargar el detalle de la venta.</p>}
          {sale && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-border p-3"><span className="block text-[10px] uppercase text-muted-foreground">Fecha</span><strong className="text-xs">{new Date(sale.createdAt).toLocaleString()}</strong></div>
                <div className="rounded-xl border border-border p-3"><span className="block text-[10px] uppercase text-muted-foreground">Cliente</span><strong className="text-xs">{sale.customer?.name || 'Consumidor Final'}</strong></div>
                <div className="rounded-xl border border-border p-3"><span className="block text-[10px] uppercase text-muted-foreground">Sucursal</span><strong className="text-xs">{sale.branch?.name || 'Sucursal General'}</strong></div>
                <div className="rounded-xl border border-border p-3"><span className="block text-[10px] uppercase text-muted-foreground">Estado</span><Badge variant={sale.status === 'COMPLETED' ? 'secondary' : 'destructive'}>{sale.status}</Badge></div>
              </div>

              <section className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-secondary">Artículos vendidos</h3>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50"><tr><th className="p-3">Producto</th><th className="p-3">SKU</th><th className="p-3 text-right">Cantidad</th><th className="p-3 text-right">Precio venta</th><th className="p-3 text-right">Descuento</th><th className="p-3 text-right">Total</th></tr></thead>
                    <tbody>
                      {sale.items.map((item) => {
                        const isFullyRefunded = item.refundedQty >= item.quantity;
                        const isPartiallyRefunded = item.refundedQty > 0 && !isFullyRefunded;
                        return <tr key={item.saleItemId} className={`border-t border-border/60 ${isFullyRefunded ? 'bg-rose-500/5' : isPartiallyRefunded ? 'bg-amber-500/5' : ''}`}>
                          <td className="p-3"><strong>{item.productName}</strong><span className="block text-[10px] text-muted-foreground">{item.attributes || 'Estándar'}</span>{isFullyRefunded && <Badge variant="destructive" className="mt-1 text-[9px]">DEVUELTO</Badge>}{isPartiallyRefunded && <Badge className="mt-1 text-[9px] bg-amber-500/15 text-amber-600">PARCIAL: {item.refundedQty} de {item.quantity}</Badge>}</td>
                          <td className="p-3 font-mono text-primary">{item.sku || 'S/SKU'}</td>
                          <td className="p-3 text-right font-mono">{item.quantity}</td>
                          <td className="p-3 text-right font-mono">{money(item.price)}</td>
                          <td className="p-3 text-right font-mono">-{money(item.discountAmount)}</td>
                          <td className="p-3 text-right font-mono font-bold">{money(item.lineTotal)}</td>
                        </tr>;
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              <div className="grid gap-4 md:grid-cols-2">
                <section className="rounded-xl border border-border p-4"><h3 className="mb-3 text-xs font-bold uppercase tracking-wider">Métodos de pago</h3><div className="space-y-2">{sale.payments.map((payment) => <div key={payment.id || `${payment.paymentMethod}-${payment.amount}`} className="flex justify-between text-xs"><span>{payment.paymentMethod}</span><strong className="font-mono">{money(payment.amount)}</strong></div>)}</div></section>
                <section className="rounded-xl border border-border p-4"><h3 className="mb-3 text-xs font-bold uppercase tracking-wider">Resumen</h3><div className="space-y-2 text-xs"><div className="flex justify-between"><span>Subtotal</span><strong>{money(sale.subtotal)}</strong></div><div className="flex justify-between text-emerald-600"><span>Descuento</span><strong>-{money(sale.discountAmount)}</strong></div><div className="flex justify-between border-t border-border pt-2 text-sm"><span>Total</span><strong>{money(sale.total)}</strong></div></div></section>
              </div>

              {sale.refunds.length > 0 && <section className="space-y-3"><h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-600"><RotateCcw className="h-4 w-4" />Historial de devoluciones</h3>{sale.refunds.map((refund) => <div key={refund.id} className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4"><div className="flex justify-between text-xs"><strong>{new Date(refund.createdAt).toLocaleString()}</strong><strong>{money(refund.totalRefunded)}</strong></div><p className="mt-1 text-xs text-muted-foreground">{refund.reason}</p><div className="mt-3 space-y-1">{refund.items.map((item) => <div key={item.id} className="flex justify-between text-[11px]"><span>{item.productName} · {item.sku} x{item.quantity}</span><span className="font-mono">{money(item.priceRefunded)}</span></div>)}</div></div>)}</section>}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaleDetailModal;
