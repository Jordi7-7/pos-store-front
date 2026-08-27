import React, { useState, useRef, useCallback } from 'react';
import {
  ArrowLeftRight,
  RotateCcw,
  Search,
  ArrowLeft,
  Minus,
  Plus,
  Loader2,
  CheckCircle,
  AlertCircle,
  Barcode,
  Trash2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useProcessRefund, useProcessSale, useSaleByInvoice } from '../../hooks/useSales';
import { useAuthStore } from '@/modules/auth';
import { productsService } from '@/modules/products/services/products.service';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ExchangeReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSession: any | null;
  branchId: string;
  cashSessionId: string;
}

type ModalStep = 'search' | 'select-items' | 'choose-mode' | 'exchange' | 'confirm-refund';

interface SaleItemRow {
  saleItemId: string;
  variantId: string;
  productName: string;
  sku: string;
  attributes: string;
  quantity: number;       // original quantity purchased
  refundedQty: number;    // already refunded in previous operations
  refundableQty: number;  // remaining available to refund
  price: number;          // unit price
  cost: number;
  discountAmount: number;
}

interface NewExchangeItem {
  variantId: string;
  productName: string;
  sku: string;
  attributes: string;
  quantity: number;
  price: number;  // salePrice from POS endpoint
  cost: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatMoney(n: number) {
  return `$${Number(n).toFixed(2)}`;
}

function StepIndicator({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="flex items-center gap-1 mb-4">
      {steps.map((label, i) => (
        <React.Fragment key={i}>
          <div className={`flex items-center gap-1.5 ${i === current ? 'opacity-100' : i < current ? 'opacity-60' : 'opacity-30'}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
              ${i < current ? 'bg-emerald-500 text-white' : i === current ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className="text-[10px] font-medium text-muted-foreground hidden sm:inline">{label}</span>
          </div>
          {i < steps.length - 1 && <div className="flex-1 h-px bg-border mx-1" />}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ExchangeReturnModal({
  isOpen,
  onClose,
  activeSession,
  branchId,
  cashSessionId,
}: ExchangeReturnModalProps) {
  const { tenantId } = useAuthStore();
  const { fetchSale } = useSaleByInvoice();
  const { processRefund, isProcessing: isRefunding } = useProcessRefund();
  const { processSale, isProcessing: isSelling } = useProcessSale();

  // ── State ──
  const [step, setStep] = useState<ModalStep>('search');
  const [invoiceInput, setInvoiceInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundSale, setFoundSale] = useState<any | null>(null);

  // Map variantId → qty to return
  const [returnQtyMap, setReturnQtyMap] = useState<Record<string, number>>({});

  // Reason for refund/exchange
  const [reason, setReason] = useState('');

  // New items to exchange for (mode = 'exchange')
  const [newItems, setNewItems] = useState<NewExchangeItem[]>([]);
  const [scanInput, setScanInput] = useState('');
  const [isScanLoading, setIsScanLoading] = useState(false);
  const scanRef = useRef<HTMLInputElement>(null);

  // ── Reset ──
  const reset = () => {
    setStep('search');
    setInvoiceInput('');
    setFoundSale(null);
    setReturnQtyMap({});
    setReason('');
    setNewItems([]);
    setScanInput('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // ── Step 1: Search by invoice ──
  const handleSearch = async () => {
    const inv = invoiceInput.trim();
    if (!inv) return;
    setIsSearching(true);
    try {
      const sale = await fetchSale(inv);
      setFoundSale(sale);
      // Initialize return qty map to 0 for each item
      const qtyMap: Record<string, number> = {};
      for (const item of sale.items) {
        qtyMap[item.variantId] = 0;
      }
      setReturnQtyMap(qtyMap);
      setStep('select-items');
    } catch (err: any) {
      toast.error(err?.message || `No se encontró la venta con folio "${inv}"`);
    } finally {
      setIsSearching(false);
    }
  };

  // ── Step 2: Qty controls ──
  const adjustReturnQty = (variantId: string, delta: number, max: number) => {
    setReturnQtyMap((prev) => ({
      ...prev,
      [variantId]: Math.min(max, Math.max(0, (prev[variantId] ?? 0) + delta)),
    }));
  };

  const selectedReturnItems = foundSale?.items?.filter(
    (item: SaleItemRow) => (returnQtyMap[item.variantId] ?? 0) > 0,
  ) ?? [];

  // True when NO item has any refundable qty left
  const allItemsFullyRefunded = foundSale?.isFullyRefunded === true ||
    (foundSale?.items?.length > 0 &&
      foundSale.items.every((item: SaleItemRow) => item.refundableQty === 0));

  const totalToReturn = selectedReturnItems.reduce(
    (acc: number, item: SaleItemRow) => acc + item.price * (returnQtyMap[item.variantId] ?? 0),
    0,
  );

  // ── Step 3: Mode choose ──

  // ── Exchange: scan new products ──
  const handleScanKeyPress = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Enter') return;
      const code = scanInput.trim();
      if (!code) return;
      setScanInput('');
      setIsScanLoading(true);
      try {
        const variant = await productsService.getPosVariantBySku(code, branchId);
        if (!variant) {
          toast.error(`Producto no encontrado: ${code}`);
          return;
        }
        // Build attributes string from attributeValues array
        const attrsString = (variant.attributeValues ?? [])
          .map((av: any) => `${av.attribute?.name ?? ''}: ${av.value}`)
          .filter(Boolean)
          .join(' / ');

        setNewItems((prev) => {
          const existing = prev.find((x) => x.variantId === variant.id);
          if (existing) {
            return prev.map((x) =>
              x.variantId === variant.id ? { ...x, quantity: x.quantity + 1 } : x,
            );
          }
          return [
            ...prev,
            {
              variantId: variant.id,          // use .id, not .variantId
              productName: variant.productName,
              sku: variant.sku,
              attributes: attrsString,
              quantity: 1,
              price: variant.salePrice,
              cost: variant.purchasePrice,   // cost = purchase price from backend
            },
          ];
        });
        toast.success(`${variant.productName} agregado`);
      } catch {
        toast.error(`Producto no encontrado: ${code}`);
      } finally {
        setIsScanLoading(false);
        setTimeout(() => scanRef.current?.focus(), 100);
      }
    },
    [scanInput, branchId],
  );

  const adjustNewItemQty = (variantId: string, delta: number) => {
    setNewItems((prev) =>
      prev
        .map((x) => (x.variantId === variantId ? { ...x, quantity: x.quantity + delta } : x))
        .filter((x) => x.quantity > 0),
    );
  };

  const totalNewItems = newItems.reduce((acc, x) => acc + x.price * x.quantity, 0);
  const exchangeDiff = totalNewItems - totalToReturn; // positive = customer pays, negative = refund extra

  // ── Confirm Refund (pure devolution) ──
  const handleConfirmRefund = async () => {
    if (!foundSale || selectedReturnItems.length === 0) return;
    try {
      await processRefund({
        branchId,
        saleId: foundSale.id,
        cashSessionId,
        reason: reason.trim() || 'Devolución desde POS',
        items: selectedReturnItems.map((item: SaleItemRow) => ({
          variantId: item.variantId,
          quantity: returnQtyMap[item.variantId],
        })),
      });
      toast.success(`Devolución procesada: ${formatMoney(totalToReturn)}`);
      handleClose();
    } catch (err: any) {
      toast.error(err?.message || 'Error al procesar la devolución');
    }
  };

  // ── Confirm Exchange (refund + new sale) ──
  const handleConfirmExchange = async () => {
    if (!foundSale || selectedReturnItems.length === 0 || newItems.length === 0) return;
    try {
      // 1. Process refund of returned items
      await processRefund({
        branchId,
        saleId: foundSale.id,
        cashSessionId,
        reason: reason.trim() || 'Cambio de prenda',
        items: selectedReturnItems.map((item: SaleItemRow) => ({
          variantId: item.variantId,
          quantity: returnQtyMap[item.variantId],
        })),
      });

      // 2. Process new sale for the new items
      // The payment amount must always equal the total of the new items.
      // When diff <= 0, the refund credit covers the new sale and the rest is returned to the customer.
      await processSale({
        branchId,
        cashSessionId,
        items: newItems.map((x) => ({
          variantId: x.variantId,
          quantity: x.quantity,
          price: x.price,
        })),
        payments: [
          {
            paymentMethod: 'EFECTIVO',
            amount: totalNewItems,  // always cover full amount of new sale
          },
        ],
        discountAmount: 0,
      });

      const msg =
        exchangeDiff > 0
          ? `Cambio completado. Cliente paga diferencia: ${formatMoney(exchangeDiff)}`
          : exchangeDiff < 0
          ? `Cambio completado. Devolver al cliente: ${formatMoney(Math.abs(exchangeDiff))}`
          : 'Cambio completado. Sin diferencia.';
      toast.success(msg);
      handleClose();
    } catch (err: any) {
      toast.error(err?.message || 'Error al procesar el cambio');
    }
  };

  const isProcessing = isRefunding || isSelling;

  // ─────────────── Render ───────────────────────────────────────────────────

  const REFUND_STEPS = ['Buscar Folio', 'Seleccionar', 'Confirmar'];
  const EXCHANGE_STEPS = ['Buscar Folio', 'Seleccionar', 'Modo', 'Artículos Nuevos'];

  const currentStepIndex =
    step === 'search' ? 0
    : step === 'select-items' ? 1
    : step === 'choose-mode' ? 2
    : step === 'confirm-refund' ? 2
    : 3; // exchange

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0">
        {/* ── Header ── */}
        <DialogHeader className="px-5 pt-5 pb-0 shrink-0">
          <DialogTitle className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2 mb-1">
            {step === 'search' || step === 'select-items' || step === 'choose-mode' ? (
              <ArrowLeftRight className="w-4 h-4 text-primary" />
            ) : step === 'confirm-refund' ? (
              <RotateCcw className="w-4 h-4 text-rose-500" />
            ) : (
              <ArrowLeftRight className="w-4 h-4 text-indigo-400" />
            )}
            {step === 'confirm-refund' ? 'Devolución' : 'Cambios y Devoluciones'}
          </DialogTitle>

          {/* Back button */}
          {step !== 'search' && (
            <button
              onClick={() => {
                if (step === 'select-items') { setStep('search'); setFoundSale(null); }
                else if (step === 'choose-mode') setStep('select-items');
                else if (step === 'confirm-refund') setStep('choose-mode');
                else if (step === 'exchange') setStep('choose-mode');
              }}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors mt-1"
            >
              <ArrowLeft className="w-3 h-3" /> Volver
            </button>
          )}

          <div className="mt-3">
            <StepIndicator
              current={currentStepIndex}
              steps={step === 'exchange' || step === 'choose-mode' ? EXCHANGE_STEPS : REFUND_STEPS}
            />
          </div>
        </DialogHeader>

        {/* ── Scrollable Content ── */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 pt-3">

          {/* ══════ STEP: Search ══════ */}
          {step === 'search' && (
            <div className="flex flex-col gap-4 pt-2">
              <p className="text-xs text-muted-foreground">
                Ingresa el número de folio de la venta original para ver las prendas disponibles para devolución o cambio.
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    autoFocus
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-muted border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Ej: 001-001-000000005"
                    value={invoiceInput}
                    onChange={(e) => setInvoiceInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isSearching || !invoiceInput.trim()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 transition-all hover:bg-primary/90 active:scale-95"
                >
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Buscar
                </button>
              </div>
            </div>
          )}

          {/* ══════ STEP: Select Items ══════ */}
          {step === 'select-items' && foundSale && (
            <div className="flex flex-col gap-3">
              {/* Sale header */}
              <div className="rounded-xl bg-muted/50 border border-border px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Folio</p>
                  <p className="text-sm font-bold text-foreground font-mono">{foundSale.invoiceNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total original</p>
                  <p className="text-sm font-bold text-foreground">{formatMoney(foundSale.total)}</p>
                </div>
                <div>
                  <Badge
                    className={`text-[9px] font-bold px-2 py-0.5 ${
                      foundSale.status === 'COMPLETED' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 border' :
                      foundSale.status === 'REFUNDED' ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 border' :
                      'bg-amber-500/15 text-amber-400 border-amber-500/30 border'
                    }`}
                  >
                    {foundSale.status === 'COMPLETED' ? 'Completada' :
                     foundSale.status === 'REFUNDED' ? 'Reembolsada' : 'Parcial'}
                  </Badge>
                </div>
              </div>

              {/* Fully refunded banner */}
              {allItemsFullyRefunded && (
                <div className="flex items-center gap-2 text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Esta venta ya fue completamente reembolsada. No hay prendas disponibles para devolver.</span>
                </div>
              )}

              {/* Items list */}
              {!allItemsFullyRefunded && (
                <p className="text-xs text-muted-foreground">Selecciona la cantidad de cada prenda a devolver:</p>
              )}
              <div className="flex flex-col gap-2">
                {foundSale.items.map((item: SaleItemRow) => {
                  const qty = returnQtyMap[item.variantId] ?? 0;
                  const isFullyRefunded = item.refundableQty === 0;
                  return (
                    <div key={item.variantId} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                      isFullyRefunded ? 'bg-muted/20 border-border/50 opacity-60' : 'bg-muted/40 border-border'
                    }`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm font-medium truncate ${isFullyRefunded ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                            {item.productName}
                          </p>
                          {item.refundedQty > 0 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/25 shrink-0">
                              {isFullyRefunded ? 'Reembolsada' : `${item.refundedQty} reembolsada(s)`}
                            </span>
                          )}
                        </div>
                        {item.attributes && (
                          <p className="text-[10px] text-muted-foreground">{item.attributes}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground font-mono">{item.sku}</p>
                        <p className="text-xs text-foreground font-semibold mt-0.5">
                          {formatMoney(item.price)} × {item.quantity}
                          {item.refundableQty < item.quantity && !isFullyRefunded && (
                            <span className="text-muted-foreground font-normal"> (disponibles: {item.refundableQty})</span>
                          )}
                        </p>
                      </div>
                      {/* Qty stepper — disabled entirely if no qty to refund */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => adjustReturnQty(item.variantId, -1, item.refundableQty)}
                          disabled={qty === 0 || isFullyRefunded}
                          className="w-7 h-7 rounded-lg bg-background border border-border flex items-center justify-center disabled:opacity-30 hover:bg-muted transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className={`w-6 text-center text-sm font-bold tabular-nums ${qty > 0 ? 'text-rose-500' : 'text-muted-foreground'}`}>
                          {qty}
                        </span>
                        <button
                          onClick={() => adjustReturnQty(item.variantId, +1, item.refundableQty)}
                          disabled={qty >= item.refundableQty || isFullyRefunded}
                          className="w-7 h-7 rounded-lg bg-background border border-border flex items-center justify-center disabled:opacity-30 hover:bg-muted transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary + Next */}
              {selectedReturnItems.length > 0 && (
                <div className="mt-1 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-rose-400 uppercase tracking-wider">A devolver</p>
                    <p className="text-base font-bold text-rose-500">{formatMoney(totalToReturn)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{selectedReturnItems.length} prenda(s)</p>
                </div>
              )}

              <button
                disabled={selectedReturnItems.length === 0 || allItemsFullyRefunded}
                onClick={() => setStep('choose-mode')}
                className="w-full mt-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 transition-all active:scale-[0.98]"
              >
                Continuar →
              </button>
            </div>
          )}

          {/* ══════ STEP: Choose Mode ══════ */}
          {step === 'choose-mode' && (
            <div className="flex flex-col gap-4 pt-2">
              <p className="text-xs text-muted-foreground">
                ¿Qué deseas hacer con las <strong>{selectedReturnItems.length}</strong> prenda(s) seleccionadas?
              </p>

              {/* Refund only */}
              <button
                onClick={() => setStep('confirm-refund')}
                className="group flex items-start gap-4 rounded-xl border border-border bg-muted/30 hover:bg-rose-500/8 hover:border-rose-500/30 p-4 text-left transition-all active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center shrink-0 group-hover:bg-rose-500/25 transition-colors">
                  <RotateCcw className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Solo Devolución</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Reembolso directo de {formatMoney(totalToReturn)} al cliente. Las prendas vuelven al inventario.
                  </p>
                </div>
              </button>

              {/* Exchange */}
              <button
                onClick={() => setStep('exchange')}
                className="group flex items-start gap-4 rounded-xl border border-border bg-muted/30 hover:bg-indigo-500/8 hover:border-indigo-500/30 p-4 text-left transition-all active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/25 transition-colors">
                  <ArrowLeftRight className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Cambio de Prenda</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Devuelve las prendas seleccionadas y escanea las nuevas. Se calcula la diferencia a cobrar o reembolsar.
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* ══════ STEP: Confirm Refund ══════ */}
          {step === 'confirm-refund' && (
            <div className="flex flex-col gap-3">
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3">
                <p className="text-xs text-rose-400 uppercase tracking-wider font-semibold mb-1">Resumen de Devolución</p>
                <p className="text-xs text-muted-foreground">Folio: <span className="text-foreground font-mono">{foundSale?.invoiceNumber}</span></p>
              </div>

              <div className="flex flex-col gap-2">
                {selectedReturnItems.map((item: SaleItemRow) => (
                  <div key={item.variantId} className="flex items-center justify-between rounded-lg bg-muted/40 border border-border px-4 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.productName}</p>
                      {item.attributes && <p className="text-[10px] text-muted-foreground">{item.attributes}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">×{returnQtyMap[item.variantId]}</p>
                      <p className="text-sm font-semibold text-rose-500">-{formatMoney(item.price * returnQtyMap[item.variantId])}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-rose-500/15 border border-rose-500/25 px-4 py-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-rose-400">Total a reembolsar</p>
                <p className="text-xl font-bold text-rose-500">{formatMoney(totalToReturn)}</p>
              </div>

              {/* Reason input */}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1.5">
                  Razón de devolución
                </label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-rose-400 resize-none"
                  placeholder="Ej: Talla incorrecta, defecto de fábrica…"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <button
                onClick={handleConfirmRefund}
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Confirmar Devolución
              </button>
            </div>
          )}

          {/* ══════ STEP: Exchange ══════ */}
          {step === 'exchange' && (
            <div className="flex flex-col gap-3">
              {/* Returned items (negative) */}
              <div>
                <p className="text-[10px] text-rose-400 uppercase tracking-wider font-semibold mb-1.5">Prendas que devuelve</p>
                <div className="flex flex-col gap-1.5">
                  {selectedReturnItems.map((item: SaleItemRow) => (
                    <div key={item.variantId} className="flex items-center justify-between rounded-lg bg-rose-500/8 border border-rose-500/20 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.productName}</p>
                        {item.attributes && <p className="text-[10px] text-muted-foreground">{item.attributes}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground">×{returnQtyMap[item.variantId]}</p>
                        <p className="text-sm font-semibold text-rose-500">-{formatMoney(item.price * returnQtyMap[item.variantId])}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* New items scanner */}
              <div>
                <p className="text-[10px] text-indigo-400 uppercase tracking-wider font-semibold mb-1.5">Prendas que lleva</p>
                <div className="relative flex gap-2 mb-2">
                  <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    ref={scanRef}
                    autoFocus
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-muted border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    placeholder="Escanear código de barras…"
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    onKeyDown={handleScanKeyPress}
                  />
                  {isScanLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
                </div>

                {newItems.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {newItems.map((item) => (
                      <div key={item.variantId} className="flex items-center gap-2 rounded-lg bg-indigo-500/8 border border-indigo-500/20 px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{item.productName}</p>
                          {item.attributes && <p className="text-[10px] text-muted-foreground">{item.attributes}</p>}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={() => adjustNewItemQty(item.variantId, -1)} className="w-6 h-6 rounded bg-background border border-border flex items-center justify-center hover:bg-muted">
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="w-5 text-center text-sm font-bold tabular-nums text-indigo-400">{item.quantity}</span>
                          <button onClick={() => adjustNewItemQty(item.variantId, +1)} className="w-6 h-6 rounded bg-background border border-border flex items-center justify-center hover:bg-muted">
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                        <p className="text-sm font-semibold text-indigo-400 shrink-0 w-16 text-right">+{formatMoney(item.price * item.quantity)}</p>
                        <button onClick={() => setNewItems((prev) => prev.filter((x) => x.variantId !== item.variantId))} className="text-muted-foreground hover:text-rose-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {newItems.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border py-6 flex flex-col items-center gap-1.5 text-muted-foreground">
                    <Barcode className="w-5 h-5 opacity-40" />
                    <p className="text-xs">Escanea los nuevos artículos</p>
                  </div>
                )}
              </div>

              {/* Difference summary */}
              {newItems.length > 0 && (
                <div className={`rounded-xl px-4 py-3 border ${
                  exchangeDiff > 0
                    ? 'bg-emerald-500/10 border-emerald-500/25'
                    : exchangeDiff < 0
                    ? 'bg-rose-500/10 border-rose-500/25'
                    : 'bg-muted/50 border-border'
                }`}>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Devuelto</span>
                    <span className="text-rose-500 font-medium">-{formatMoney(totalToReturn)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-2">
                    <span>Nuevos artículos</span>
                    <span className="text-indigo-400 font-medium">+{formatMoney(totalNewItems)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-border pt-2">
                    <p className="text-sm font-semibold text-foreground">
                      {exchangeDiff > 0 ? 'Cliente paga' : exchangeDiff < 0 ? 'Reembolsar al cliente' : 'Sin diferencia'}
                    </p>
                    <p className={`text-lg font-bold ${
                      exchangeDiff > 0 ? 'text-emerald-500' : exchangeDiff < 0 ? 'text-rose-500' : 'text-foreground'
                    }`}>
                      {exchangeDiff === 0 ? '$0.00' : formatMoney(Math.abs(exchangeDiff))}
                    </p>
                  </div>
                </div>
              )}

              {newItems.length === 0 && (
                <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Escanea al menos una prenda nueva para completar el cambio.
                </div>
              )}

              {/* Reason input for exchange */}
              {newItems.length > 0 && (
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1.5">
                    Razón del cambio
                  </label>
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
                    placeholder="Ej: Cambio de talla, cambio de color…"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
              )}

              <button
                onClick={handleConfirmExchange}
                disabled={isProcessing || newItems.length === 0}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Confirmar Cambio
              </button>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
