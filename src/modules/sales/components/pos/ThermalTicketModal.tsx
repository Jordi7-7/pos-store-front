import React from 'react';
import { Printer } from 'lucide-react';
import { numeroALetras } from 'numero-a-letras-es';
import { PaymentMethod } from '../../services/sales.service';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { useAuthStore } from '../../../auth/hooks/useAuthStore';

interface ThermalTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleData: {
    invoiceNumber: string;
    createdAt: string;
    branchName: string;
    branchAddress?: string;
    clientName: string;
    clientIdentity: string;
    items: any[];
    paymentMethod: PaymentMethod;
    total: number;
    discountAmount?: number;
    userName?: string;
  } | null;
  tenantRuc?: string;
  tenantName?: string;
  currencyCode?: string;
}



export const ThermalTicketModal: React.FC<ThermalTicketModalProps> = ({
  isOpen,
  onClose,
  saleData,
  tenantRuc,
  tenantName,
  currencyCode
}) => {
  const timezone = useAuthStore((state) => state.timezone) || 'America/Guayaquil';
  if (!saleData) return null;

  let moneda = 'PESOS';
  let sufijo = 'M.N.';

  if (currencyCode === 'USD') {
    moneda = 'DÓLARES';
    sufijo = 'C.T.V.'; // Centavos en formato bancario / estándar
  } else if (currencyCode === 'MXN') {
    moneda = 'PESOS';
    sufijo = 'M.N.';
  } else if (currencyCode) {
    moneda = currencyCode.toUpperCase();
    sufijo = '';
  }

  const totalPieces = saleData.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const lettersText = `Son: ${numeroALetras(saleData.total, {
    moneda,
    sufijo,
    mayusculas: true,
  })}`;

  const handlePrint = () => {
    // 1. Create temporary iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const itemsHtml = saleData.items.map((item: any) => {
      const itemDiscount = item.discountAmount || 0;
      const lineTotal = (item.price - itemDiscount) * item.quantity;
      return `
        <div style="margin-bottom: 5px;">
          <div style="display: flex; justify-content: space-between; font-weight: bold;">
            <span>${item.variantSku || 'SKU'}</span>
            <span style="text-align: right; text-transform: uppercase;">${item.productName}</span>
          </div>
          <div style="display: flex; justify-content: space-between; color: #222;">
            <span style="padding-left: 20px;">${item.quantity}</span>
            <span>${Number(item.price).toFixed(2)}</span>
            <span>${lineTotal.toFixed(2)}</span>
          </div>
        </div>
      `;
    }).join('');

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Imprimir Ticket</title>
          <style>
            @page {
              margin: 0;
              size: 58mm auto;
            }
            body {
              margin: 0;
              padding: 4mm;
              width: 50mm;
              font-family: 'Courier New', Courier, monospace;
              font-size: 9.5px;
              line-height: 1.3;
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
              margin: 5px 0;
            }
          </style>
        </head>
        <body>
          <div class="text-center" style="margin-bottom: 8px;">
            <div class="font-bold" style="font-size: 11px; text-transform: uppercase;">${tenantName || 'leAO'}</div>
            ${tenantRuc ? `<div>RFC: ${tenantRuc}</div>` : ''}
            ${saleData.branchAddress ? `<div style="text-transform: uppercase; font-size: 8.5px; margin-top: 2px;">${saleData.branchAddress}</div>` : '<div>AV. 20 DE NOVIEMBRE</div>'}
            <div>TLF: 967 6316359</div>
          </div>

          <div class="border-dashed"></div>

          <div style="font-size: 9px; line-height: 1.25;">
            <div class="flex justify-between">
              <span>FOLIO:</span>
              <span class="font-bold">${saleData.invoiceNumber}</span>
            </div>
            <div class="flex justify-between">
              <span>VENDEDOR:</span>
              <span class="uppercase">${saleData.userName || '01000001'}</span>
            </div>
            <div class="flex justify-between">
              <span>FECHA:</span>
              <span>${new Date(saleData.createdAt).toLocaleString(undefined, { timeZone: timezone })}</span>
            </div>
            <div class="flex justify-between">
              <span>CLIENTE:</span>
              <span class="uppercase">${saleData.clientName}</span>
            </div>
          </div>

          <div class="border-dashed"></div>

          <div>
            ${itemsHtml}
          </div>

          <div class="border-dashed"></div>

          <div style="font-size: 9px; line-height: 1.25;">
            <div class="flex justify-between">
              <span>Piezas</span>
              <span>${totalPieces}</span>
            </div>
            ${saleData.discountAmount && saleData.discountAmount > 0 ? `
              <div class="flex justify-between">
                <span>DESC. GLOBAL:</span>
                <span>-${Number(saleData.discountAmount).toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="flex justify-between font-bold" style="border-top: 1px dashed #000; padding-top: 3px; font-size: 10px; margin-top: 2px;">
              <span>Total</span>
              <span>$${Number(saleData.total || 0).toFixed(2)}</span>
            </div>
            <div style="font-size: 8px; text-align: center; margin-top: 6px; font-style: italic;">
              ${lettersText}
            </div>
          </div>

          <div class="border-dashed"></div>

          <div class="text-center font-bold" style="font-size: 9px; line-height: 1.35; margin-top: 4px;">
            <div>SALIDA LA MERCANCIA</div>
            <div>NO HAY CAMBIOS</div>
            <div>NI DEVOLUCIONES</div>
            <div style="margin-top: 4px;">^ GRACIAS POR SU COMPRA ^</div>
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Print after content mounts
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      // Remove element
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 200);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent showCloseButton={false} className="sm:max-w-sm max-h-[95vh] overflow-y-auto bg-white text-black p-6 border border-gray-200 rounded-2xl shadow-2xl">
        
        {/* On screen modal representation (Aesthetic White Ticket representation) */}
        <div className="space-y-4 font-mono text-xs text-gray-800">
          <div className="text-center space-y-1 pb-2 border-b border-gray-200">
            <h4 className="text-sm font-bold uppercase text-black">{tenantName || 'leAO'}</h4>
            {tenantRuc && <p className="text-[10px] text-gray-500">RFC: {tenantRuc}</p>}
            <p className="text-[10px] text-gray-500 uppercase truncate">{saleData.branchAddress || 'AV. 20 DE NOVIEMBRE'}</p>
            <p className="text-[10px] text-gray-500">TLF: 967 6316359</p>
          </div>

          <div className="space-y-1 text-[11px] text-gray-700">
            <div className="flex justify-between">
              <span>FOLIO:</span>
              <span className="text-black font-bold">{saleData.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>VENDEDOR:</span>
              <span className="uppercase text-black">{saleData.userName || '01000001'}</span>
            </div>
            <div className="flex justify-between">
              <span>FECHA:</span>
              <span className="text-black">{new Date(saleData.createdAt).toLocaleString(undefined, { timeZone: timezone })}</span>
            </div>
            <div className="flex justify-between">
              <span>CLIENTE:</span>
              <span className="uppercase text-black truncate max-w-[170px]">{saleData.clientName}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-200 pt-3 space-y-2">
            {saleData.items.map((item: any, idx: number) => {
              const itemDiscount = item.discountAmount || 0;
              const lineTotal = (item.price - itemDiscount) * item.quantity;
              return (
                <div key={item.variantId || idx} className="space-y-0.5 text-[11px]">
                  <div className="flex justify-between font-semibold text-black">
                    <span>{item.variantSku || 'SKU'}</span>
                    <span className="uppercase truncate max-w-[140px]">{item.productName}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span className="pl-4">{item.quantity}</span>
                    <span>${Number(item.price).toFixed(2)}</span>
                    <span className="text-black">${lineTotal.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-dashed border-gray-200 pt-3 space-y-1 text-[11px] text-gray-700">
            <div className="flex justify-between">
              <span>Piezas</span>
              <span className="text-black">{totalPieces}</span>
            </div>
            {saleData.discountAmount !== undefined && saleData.discountAmount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>DESC. GLOBAL:</span>
                <span>-${Number(saleData.discountAmount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-black text-xs pt-1.5 border-t border-dashed border-gray-200">
              <span>Total</span>
              <span className="text-black font-extrabold text-sm">${Number(saleData.total || 0).toFixed(2)}</span>
            </div>
            <p className="text-[9px] text-gray-500 italic text-center mt-2 leading-relaxed">
              {lettersText}
            </p>
          </div>

          <div className="text-center text-[10px] text-gray-600 pt-3 border-t border-gray-200 space-y-0.5">
            <p className="font-bold text-black">SALIDA LA MERCANCIA</p>
            <p className="font-bold text-black">NO HAY CAMBIOS</p>
            <p className="font-bold text-black">NI DEVOLUCIONES</p>
          </div>
        </div>

        {/* Action buttons */}
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

export default ThermalTicketModal;
