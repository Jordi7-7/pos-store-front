import React, { useState } from 'react';
import { Calendar as CalendarIcon, Loader2, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { type DateRange } from 'react-day-picker';
import { usePaginatedSales } from '../hooks/useSales';
import { SaleDetailModal } from './SaleDetailModal';
import { ProductPagination } from '@/modules/products/components/ProductPagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Field } from '@/components/ui/field';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

export const SalesView: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedInvoice, setSelectedInvoice] = useState<string>();
  const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined;
  const endDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined;
  const { sales, meta, isLoading } = usePaginatedSales({ startDate, endDate, page, limit });

  const updateDateRange = (range: DateRange | undefined) => {
    setDateRange(range);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-secondary">Ventas</h3>
        <p className="text-xs text-neutral mt-0.5">Consulta las ventas registradas en el período seleccionado.</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2"><Receipt className="w-4 h-4 text-primary" />Historial de ventas</CardTitle>
            <Field className="w-64">
              <Popover>
                <PopoverTrigger render={
                  <Button
                    variant="outline"
                    id="sales-date-picker-range"
                    className="w-full justify-start px-3 py-2 text-xs font-semibold bg-bg-dark border border-border-card rounded-xl h-9 hover:bg-muted text-secondary"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-neutral" />
                    {dateRange?.from ? (
                      dateRange.to ? `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}` : format(dateRange.from, 'dd/MM/yyyy')
                    ) : <span>Selecciona un rango</span>}
                  </Button>
                } />
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={updateDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </Field>
          </div>
        </CardHeader>
        <CardContent>
          <ProductPagination meta={meta} onPageChange={setPage} onLimitChange={(nextLimit) => { setLimit(nextLimit); setPage(1); }} />
          {isLoading ? <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : sales.length === 0 ? <div className="py-16 text-center text-sm text-muted-foreground">No hay ventas en el período seleccionado.</div> : <div className="overflow-x-auto rounded-xl border border-border"><table className="w-full text-left text-xs"><thead><tr className="bg-muted/50 border-b border-border"><th className="p-3">Factura</th><th className="p-3">Fecha</th><th className="p-3">Cliente</th><th className="p-3 text-right">Total</th><th className="p-3">Estado</th></tr></thead><tbody>{sales.map((sale) => <tr key={sale.id} onClick={() => sale.invoiceNumber && setSelectedInvoice(sale.invoiceNumber)} className="border-b border-border/60 last:border-0 hover:bg-muted/30 cursor-pointer"><td className="p-3 font-mono font-semibold text-primary">{sale.invoiceNumber || 'S/Ref'}</td><td className="p-3 text-muted-foreground"><span className="inline-flex items-center gap-1"><CalendarIcon className="w-3.5 h-3.5" />{new Date(sale.createdAt).toLocaleString()}</span></td><td className="p-3">{sale.customer?.name || 'Consumidor Final'}</td><td className="p-3 text-right font-mono font-bold">${Number(sale.total || 0).toFixed(2)}</td><td className="p-3">{sale.status === 'REFUNDED' ? <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-semibold border border-rose-200">Devuelta</span> : sale.status === 'PARTIALLY_REFUNDED' ? <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold border border-amber-200">Parcialmente devuelta</span> : <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold border border-emerald-200">Completada</span>}</td></tr>)}</tbody></table></div>}
        </CardContent>
      </Card>
      <SaleDetailModal invoiceNumber={selectedInvoice} isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(undefined)} />
    </div>
  );
};

export default SalesView;