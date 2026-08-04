import React from 'react';
import { Printer } from 'lucide-react';
import { PaymentMethod } from '../../services/sales.service';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

interface ThermalTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleData: {
    invoiceNumber: string;
    createdAt: string;
    branchName: string;
    clientName: string;
    clientIdentity: string;
    items: any[];
    paymentMethod: PaymentMethod;
    total: number;
  } | null;
}

export const ThermalTicketModal: React.FC<ThermalTicketModalProps> = ({
  isOpen,
  onClose,
  saleData
}) => {
  if (!saleData) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent showCloseButton={false} className="sm:max-w-sm max-h-[95vh] overflow-y-auto bg-white text-black p-6 border border-gray-200 print:border-none print:shadow-none print:p-0 print:w-full print:bg-white">
        
        {/* Embedded styles for printing */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body * {
              visibility: hidden;
            }
            .print-container, .print-container * {
              visibility: visible;
            }
            .print-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 80mm;
              margin: 0;
              padding: 2mm;
              font-family: monospace;
              font-size: 11px;
              color: #000;
              background-color: #fff;
            }
            .print-hidden {
              display: none !important;
            }
          }
        `}} />

        {/* Ticket Content Container */}
        <div className="print-container space-y-4 text-center font-mono text-xs text-gray-800">
          
          {/* Header */}
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-gray-900 uppercase">POS STORE SYSTEM</h4>
            <p className="text-[10px] text-gray-500">{saleData.branchName}</p>
            <div className="border-b border-dashed border-gray-300 my-2" />
          </div>

          {/* Invoice details */}
          <div className="text-left text-[10px] space-y-1">
            <div className="flex justify-between">
              <span>TICKET:</span>
              <span className="font-bold">{saleData.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>FECHA:</span>
              <span>{new Date(saleData.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>CLIENTE:</span>
              <span className="truncate max-w-[150px]">{saleData.clientName}</span>
            </div>
            <div className="flex justify-between">
              <span>RUT/CÉDULA:</span>
              <span>{saleData.clientIdentity}</span>
            </div>
            <div className="border-b border-dashed border-gray-300 my-2" />
          </div>

          {/* Items Table */}
          <div className="text-left text-[10px] space-y-2">
            <div className="grid grid-cols-12 font-bold border-b border-gray-200 pb-1 text-gray-900">
              <span className="col-span-6">DESCRIPCIÓN</span>
              <span className="col-span-2 text-center">CANT</span>
              <span className="col-span-4 text-right">TOTAL</span>
            </div>
            
            {saleData.items.map((item: any) => (
              <div key={item.variantId} className="grid grid-cols-12 leading-snug">
                <div className="col-span-6">
                  <div className="truncate font-semibold">{item.productName}</div>
                  <div className="text-[9px] text-gray-500 truncate">{item.combinationText}</div>
                </div>
                <span className="col-span-2 text-center">{item.quantity}</span>
                <span className="col-span-4 text-right">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            
            <div className="border-b border-dashed border-gray-300 my-2" />
          </div>

          {/* Summary Totals */}
          <div className="text-[11px] space-y-1">
            <div className="flex justify-between">
              <span>PAGO CON:</span>
              <span className="font-bold uppercase">{
                saleData.paymentMethod === PaymentMethod.EFECTIVO ? 'EFECTIVO' :
                saleData.paymentMethod === PaymentMethod.TARJETA ? 'TARJETA' : 'TRANSFERENCIA'
              }</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-gray-900 pt-1">
              <span>TOTAL A PAGAR:</span>
              <span>${Number(saleData.total || 0).toFixed(2)}</span>
            </div>
          </div>

          {/* Footer messages */}
          <div className="text-center text-[9px] text-gray-500 pt-3 border-t border-dashed border-gray-200">
            <p>¡Gracias por tu compra!</p>
            <p>Conserva tu ticket para cualquier cambio.</p>
          </div>

        </div>

        {/* Action buttons (Hidden in Print) */}
        <div className="flex gap-3 mt-6 print-hidden">
          <button
            onClick={handlePrint}
            className="flex-1 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Ticket</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold py-2.5 rounded-xl border border-gray-200 transition-colors cursor-pointer"
          >
            Finalizar
          </button>
        </div>

      </DialogContent>
    </Dialog>
  );
};
export default ThermalTicketModal;
