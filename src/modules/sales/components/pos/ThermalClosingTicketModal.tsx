import React from 'react';
import { Printer } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { useAuthStore } from '../../../auth/hooks/useAuthStore';

interface ThermalClosingTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionData: {
    id: string;
    openedAt: string;
    closedAt?: string;
    openingBalance: number;
    closingBalance: number;
    expectedBalance: number;
    salesTotal: number;
    expensesTotal: number;
    expensesList: { description: string; amount: number; createdAt: string }[];
    productsList: { sku: string; name: string; quantity: number; total: number }[];
    paymentsBreakdown: { [method: string]: number };
    refundsList: { id: string; reason: string; items: { name: string; sku: string; quantity: number }[] }[];
    salesList: { invoiceNumber: string; createdAt: string; total: number; paymentMethods: string[] }[];
    userName?: string;
    branchName?: string;
    branchAddress?: string;
  } | null;
  tenantRuc?: string;
  tenantName?: string;
}

export const ThermalClosingTicketModal: React.FC<ThermalClosingTicketModalProps> = ({
  isOpen,
  onClose,
  sessionData,
  tenantRuc,
  tenantName,
}) => {
  const timezone = useAuthStore((state) => state.timezone) || 'America/Guayaquil';
  if (!sessionData) return null;

  const difference = sessionData.closingBalance - sessionData.expectedBalance;

  const handlePrint = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    // Build Products Sold HTML
    const productsHtml = sessionData.productsList.length > 0
      ? sessionData.productsList.map((prod) => `
        <div style="margin-bottom: 4px;">
          <div style="display: flex; justify-content: space-between; font-weight: bold;">
            <span>${prod.sku}</span>
            <span style="max-width: 65%; text-align: right; text-transform: uppercase;">${prod.name}</span>
          </div>
          <div style="display: flex; justify-content: space-between; color: #222;">
            <span style="padding-left: 10px;">Cant: x${prod.quantity}</span>
            <span>$${prod.total.toFixed(2)}</span>
          </div>
        </div>
      `).join('')
      : '<div style="font-style: italic;">Sin ventas registradas</div>';

    // Build Detailed Sales Chronology HTML
    const salesListHtml = sessionData.salesList.length > 0
      ? sessionData.salesList.map((s) => {
          const timeStr = new Date(s.createdAt).toLocaleTimeString(undefined, {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
          const methods = s.paymentMethods.join('/') || 'EFE';
          return `
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span>[${timeStr}] ${s.invoiceNumber} (${methods})</span>
              <span class="font-bold">$${s.total.toFixed(2)}</span>
            </div>
          `;
        }).join('')
      : '<div style="font-style: italic;">Sin transacciones de venta</div>';

    // Build Payments HTML
    const paymentsHtml = Object.entries(sessionData.paymentsBreakdown).map(([method, amount]) => `
      <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
        <span style="text-transform: uppercase;">${method}:</span>
        <span>$${amount.toFixed(2)}</span>
      </div>
    `).join('');

    // Build Expenses HTML
    const expensesHtml = sessionData.expensesList.length > 0 
      ? sessionData.expensesList.map((exp) => {
          const timeStr = new Date(exp.createdAt).toLocaleTimeString(undefined, {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
          return `
            <div style="display: flex; justify-content: space-between; margin-bottom: 2.5px;">
              <span style="max-width: 70%; text-transform: uppercase;">[${timeStr}] ${exp.description}</span>
              <span>$${Number(exp.amount).toFixed(2)}</span>
            </div>
          `;
        }).join('')
      : '<div style="font-style: italic;">Sin egresos registrados</div>';

    // Build Refunds HTML
    const refundsHtml = sessionData.refundsList.length > 0
      ? sessionData.refundsList.map((ref) => {
        const itemsList = ref.items.map(i => `${i.name} (x${i.quantity})`).join(', ');
        return `
          <div style="margin-bottom: 4px;">
            <div style="display: flex; justify-content: space-between; font-weight: bold;">
              <span>REF-${ref.id.substring(0, 5).toUpperCase()}</span>
              <span style="max-width: 60%; text-transform: uppercase; font-size: 8px;">Motivo: ${ref.reason || 'S/M'}</span>
            </div>
            <div style="font-size: 8px; color: #333; padding-left: 5px;">
              ${itemsList}
            </div>
          </div>
        `;
      }).join('')
      : '<div style="font-style: italic;">Sin devoluciones registradas</div>';

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Arqueo y Cierre de Caja</title>
          <style>
            @page {
              margin: 0;
              size: 80mm auto;
            }
            body {
              margin: 0;
              padding: 4mm;
              width: 72mm;
              font-family: 'Courier New', Courier, monospace;
              font-size: 10.5px;
              line-height: 1.4;
              color: #000;
              background-color: #fff;
            }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .border-dashed {
              border-bottom: 1px dashed #000;
              margin: 6px 0;
            }
            .title {
              font-size: 11px;
              font-weight: bold;
              text-transform: uppercase;
              text-align: center;
              margin-bottom: 2px;
            }
            .section-title {
              font-weight: bold;
              text-transform: uppercase;
              margin: 8px 0 4px 0;
              font-size: 9.5px;
              text-decoration: underline;
            }
          </style>
        </head>
        <body>
          <div class="text-center" style="margin-bottom: 8px;">
            <div class="title">${tenantName || 'NEGOCIO'}</div>
            ${tenantRuc ? `<div>RFC: ${tenantRuc}</div>` : ''}
            ${sessionData.branchAddress ? `<div style="text-transform: uppercase; font-size: 8px; margin-top: 2px;">${sessionData.branchAddress}</div>` : ''}
            <div class="font-bold" style="font-size: 10px; margin-top: 5px;">ARQUEO / RESUMEN DE CAJA</div>
          </div>

          <div class="border-dashed"></div>

          <div style="font-size: 8.5px; line-height: 1.25;">
            <div class="flex justify-between">
              <span>SESIÓN ID:</span>
              <span class="font-bold">${sessionData.id}</span>
            </div>
            <div class="flex justify-between">
              <span>CAJERO:</span>
              <span class="uppercase font-bold">${sessionData.userName || 'Usuario'}</span>
            </div>
            <div class="flex justify-between">
              <span>SUCURSAL:</span>
              <span class="uppercase">${sessionData.branchName || 'Principal'}</span>
            </div>
            <div class="flex justify-between">
              <span>APERTURA:</span>
              <span>${new Date(sessionData.openedAt).toLocaleString(undefined, { timeZone: timezone })}</span>
            </div>
            <div class="flex justify-between">
              <span>CIERRE:</span>
              <span>${sessionData.closedAt ? new Date(sessionData.closedAt).toLocaleString(undefined, { timeZone: timezone }) : new Date().toLocaleString(undefined, { timeZone: timezone })}</span>
            </div>
          </div>

          <div class="border-dashed"></div>

          {/* Finanzas */}
          <div style="font-size: 9px;">
            <div class="flex justify-between">
              <span>(+) SALDO INICIAL:</span>
              <span>$${Number(sessionData.openingBalance).toFixed(2)}</span>
            </div>
            <div class="flex justify-between">
              <span>(+) VENTAS TOTALES:</span>
              <span>$${Number(sessionData.salesTotal).toFixed(2)}</span>
            </div>
            <div class="flex justify-between">
              <span>(-) EGRESOS/GASTOS:</span>
              <span>$${Number(sessionData.expensesTotal).toFixed(2)}</span>
            </div>
            
            <div class="border-dashed"></div>
            
            <div class="flex justify-between font-bold">
              <span>(=) SALDO ESPERADO:</span>
              <span>$${Number(sessionData.expectedBalance).toFixed(2)}</span>
            </div>
            <div class="flex justify-between font-bold">
              <span>(=) SALDO DECLARADO:</span>
              <span>$${Number(sessionData.closingBalance).toFixed(2)}</span>
            </div>

            <div class="border-dashed"></div>

            <div class="flex justify-between font-bold" style="font-size: 10px;">
              <span>DIFERENCIA:</span>
              <span style="color: ${difference === 0 ? '#000' : difference < 0 ? '#b91c1c' : '#047857'}">
                ${difference === 0 ? '' : difference > 0 ? '+' : ''}$${difference.toFixed(2)}
              </span>
            </div>
            <div class="text-center font-bold" style="font-size: 8px; margin-top: 2px;">
              ${difference === 0 ? 'CAJA CUADRADA' : difference < 0 ? 'FALTANTE EN CAJA' : 'SOBRANTE EN CAJA'}
            </div>
          </div>

          <div class="border-dashed"></div>

          {/* Desglose Métodos Pago */}
          <div class="section-title">Ingresos por Método</div>
          <div style="font-size: 8.5px;">
            ${paymentsHtml || '<div style="font-style: italic;">Sin ingresos por métodos</div>'}
          </div>

          <div class="border-dashed"></div>

          {/* Cronologia Ventas */}
          <div class="section-title">Historial de Ventas</div>
          <div style="font-size: 8px; line-height: 1.35;">
            ${salesListHtml}
          </div>

          <div class="border-dashed"></div>

          {/* Ventas detalle */}
          <div class="section-title">Detalle de Productos Vendidos</div>
          <div style="font-size: 8.5px;">
            ${productsHtml}
          </div>

          <div class="border-dashed"></div>

          {/* Egresos */}
          <div class="section-title">Desglose de Egresos</div>
          <div style="font-size: 8.5px;">
            ${expensesHtml}
          </div>

          <div class="border-dashed"></div>

          {/* Reembolsos */}
          <div class="section-title">Desglose de Devoluciones</div>
          <div style="font-size: 8.5px;">
            ${refundsHtml}
          </div>

          <div class="border-dashed"></div>

          <div class="text-center font-bold" style="font-size: 8px; margin-top: 15px; border-top: 1px solid #000; padding-top: 12px;">
            FIRMA DEL CAJERO
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 200);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent showCloseButton={false} className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-white text-black p-6 border border-gray-200 rounded-2xl shadow-2xl">
        <div className="space-y-4 font-mono text-[11px] text-gray-800">
          <div className="text-center space-y-1 pb-2 border-b border-gray-200">
            <h4 className="text-sm font-bold uppercase text-black">{tenantName || 'NEGOCIO'}</h4>
            {tenantRuc && <p className="text-[10px] text-gray-500">RFC: {tenantRuc}</p>}
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">Ticket de Cierre de Caja</p>
          </div>

          <div className="space-y-1 text-gray-700">
            <div className="flex justify-between">
              <span>SESIÓN:</span>
              <span className="text-black font-bold truncate max-w-[160px]">{sessionData.id}</span>
            </div>
            <div className="flex justify-between">
              <span>CAJERO:</span>
              <span className="uppercase text-black font-semibold">{sessionData.userName || 'Usuario'}</span>
            </div>
            <div className="flex justify-between">
              <span>APERTURA:</span>
              <span className="text-black">{new Date(sessionData.openedAt).toLocaleString(undefined, { timeZone: timezone })}</span>
            </div>
            <div className="flex justify-between">
              <span>CIERRE:</span>
              <span className="text-black">{sessionData.closedAt ? new Date(sessionData.closedAt).toLocaleString(undefined, { timeZone: timezone }) : new Date().toLocaleString(undefined, { timeZone: timezone })}</span>
            </div>
          </div>

          {/* Finanzas */}
          <div className="border-t border-dashed border-gray-200 pt-3 space-y-1 text-gray-700">
            <div className="flex justify-between">
              <span>(+) Saldo Inicial:</span>
              <span className="text-black font-semibold">${Number(sessionData.openingBalance).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>(+) Ventas:</span>
              <span className="text-black font-semibold">${Number(sessionData.salesTotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>(-) Egresos:</span>
              <span className="text-black font-semibold">${Number(sessionData.expensesTotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-black font-bold border-t border-dashed border-gray-200 pt-1.5 mt-1.5">
              <span>(=) Total Esperado:</span>
              <span>${Number(sessionData.expectedBalance).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-black font-bold">
              <span>(=) Caja Declarado:</span>
              <span>${Number(sessionData.closingBalance).toFixed(2)}</span>
            </div>

            <div className="flex justify-between font-bold text-xs pt-1.5 border-t border-dashed border-gray-200">
              <span>Diferencia:</span>
              <span className={difference === 0 ? 'text-black' : difference < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                {difference === 0 ? '' : difference > 0 ? '+' : ''}${difference.toFixed(2)}
              </span>
            </div>
            <p className="text-[9px] text-gray-500 font-bold text-center mt-1 uppercase">
              {difference === 0 ? 'Caja Cuadrada' : difference < 0 ? 'Faltante en Caja' : 'Sobrante en Caja'}
            </p>
          </div>

          {/* Cronología de Ventas */}
          <div className="border-t border-dashed border-gray-200 pt-3">
            <span className="text-[10px] text-gray-500 font-bold block mb-1.5 uppercase">Cronología de Ventas:</span>
            <div className="space-y-1 text-[10.5px]">
              {sessionData.salesList.map((s, i) => {
                const timeStr = new Date(s.createdAt).toLocaleTimeString(undefined, {
                  timeZone: timezone,
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                });
                return (
                  <div key={i} className="flex justify-between">
                    <span>[${timeStr}] {s.invoiceNumber} ({s.paymentMethods.join('/')})</span>
                    <span className="text-black font-semibold">${s.total.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detalle Productos */}
          <div className="border-t border-dashed border-gray-200 pt-3">
            <span className="text-[10px] text-gray-500 font-bold block mb-1.5 uppercase">Productos Vendidos:</span>
            <div className="space-y-2">
              {sessionData.productsList.map((prod, i) => (
                <div key={i} className="text-[10.5px]">
                  <div className="flex justify-between text-black font-semibold">
                    <span>{prod.sku}</span>
                    <span className="truncate max-w-[170px] uppercase">{prod.name}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 pl-3">
                    <span>Cant: x{prod.quantity}</span>
                    <span className="text-black font-semibold">${prod.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Egresos */}
          {sessionData.expensesList.length > 0 && (
            <div className="border-t border-dashed border-gray-200 pt-3">
              <span className="text-[10px] text-gray-500 font-bold block mb-1 uppercase">Egresos:</span>
              <div className="space-y-1 text-gray-700">
                {sessionData.expensesList.map((exp, i) => (
                  <div key={i} className="flex justify-between gap-2">
                    <span className="truncate max-w-[150px] uppercase">- {exp.description}</span>
                    <span>${Number(exp.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Devoluciones */}
          {sessionData.refundsList.length > 0 && (
            <div className="border-t border-dashed border-gray-200 pt-3">
              <span className="text-[10px] text-gray-500 font-bold block mb-1 uppercase">Devoluciones:</span>
              <div className="space-y-2">
                {sessionData.refundsList.map((ref, i) => (
                  <div key={i} className="space-y-0.5">
                    <div className="flex justify-between text-black font-semibold">
                      <span>REF-{ref.id.substring(0, 5).toUpperCase()}</span>
                      <span className="truncate max-w-[150px] uppercase text-[9.5px] text-gray-500">{ref.reason || 'S/M'}</span>
                    </div>
                    <div className="pl-3 text-gray-600 text-[10px]">
                      {ref.items.map(item => `${item.name} (x${item.quantity})`).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handlePrint}
            className="flex-1 bg-black hover:bg-neutral-800 text-white text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Ticket</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer border border-gray-200"
          >
            Cerrar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default ThermalClosingTicketModal;
