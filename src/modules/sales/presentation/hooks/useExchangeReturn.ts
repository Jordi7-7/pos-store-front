import { DiscountType } from '@/modules/sales/domain/enums';
import React, { useState, useRef, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useSaleByInvoice } from './useSaleDetail';
import { useProcessRefund, useProcessSale } from './useSalesMutations';
import { productsService } from '@/modules/products/services/products.service';
import { PaymentMethod } from '../../domain/enums';
import type {
  ModalStep,
  SaleItemRow,
  NewExchangeItem,
} from '../components/pos/exchange-return/exchange-return.types';
import { formatMoney } from '../components/pos/exchange-return/exchange-return.types';
import { computeLineDiscount } from '../../domain/rules/cart-rules';
import { exchangeDifference, newItemsTotal, returnTotal } from '../../domain/rules/exchange-rules';

interface UseExchangeReturnProps {
  branchId: string;
  cashSessionId: string;
  onClose: () => void;
}

export function useExchangeReturn({
  branchId,
  cashSessionId,
  onClose,
}: UseExchangeReturnProps) {
  const { fetchSale } = useSaleByInvoice();
  const { processRefund, isProcessing: isRefunding } = useProcessRefund();
  const { processSale, isProcessing: isSelling } = useProcessSale();

  // Modal flow state
  const [step, setStep] = useState<ModalStep>('search');
  const [invoiceInput, setInvoiceInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundSale, setFoundSale] = useState<any | null>(null);

  // Map variantId -> qty to return
  const [returnQtyMap, setReturnQtyMap] = useState<Record<string, number>>({});

  // Reason
  const [reason, setReason] = useState('');

  // Exchange items
  const [newItems, setNewItems] = useState<NewExchangeItem[]>([]);
  const [scanInput, setScanInput] = useState('');
  const [isScanLoading, setIsScanLoading] = useState(false);
  const scanRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep('search');
    setInvoiceInput('');
    setFoundSale(null);
    setReturnQtyMap({});
    setReason('');
    setNewItems([]);
    setScanInput('');
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  // Search by invoice
  const handleSearch = useCallback(async () => {
    const inv = invoiceInput.trim();
    if (!inv) return;
    setIsSearching(true);
    try {
      const sale = await fetchSale(inv);
      setFoundSale(sale);
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
  }, [invoiceInput, fetchSale]);

  // Adjust return qty
  const adjustReturnQty = useCallback((variantId: string, delta: number, max: number) => {
    setReturnQtyMap((prev) => ({
      ...prev,
      [variantId]: Math.min(max, Math.max(0, (prev[variantId] ?? 0) + delta)),
    }));
  }, []);

  const selectedReturnItems: SaleItemRow[] = useMemo(
    () => foundSale?.items?.filter((item: SaleItemRow) => (returnQtyMap[item.variantId] ?? 0) > 0) ?? [],
    [foundSale, returnQtyMap],
  );

  const allItemsFullyRefunded =
    foundSale?.isFullyRefunded === true ||
    (foundSale?.items?.length > 0 &&
      foundSale.items.every((item: SaleItemRow) => item.refundableQty === 0));

  // Lo que se devuelve es lo que el cliente pagó por la línea (misma regla que el servidor)
  const totalToReturn = returnTotal(selectedReturnItems, returnQtyMap);

  // Scan new items
  const handleScanKeyPress = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Enter') return;
      const code = scanInput.trim();
      if (!code) return;
      setScanInput('');
      setIsScanLoading(true);
      try {
        const variants = await productsService.getPosVariantBySku(code, branchId);
        if (!variants || variants.length === 0) {
          toast.error(`Producto no encontrado: ${code}`);
          return;
        }
        const variant = variants[0];
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
              variantId: variant.id,
              productName: variant.productName,
              sku: variant.sku,
              attributes: attrsString,
              quantity: 1,
              price: variant.salePrice,
              cost: variant.purchasePrice,
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

  const adjustNewItemQty = useCallback((variantId: string, delta: number) => {
    setNewItems((prev) =>
      prev
        .map((x) => (x.variantId === variantId ? { ...x, quantity: x.quantity + delta } : x))
        .filter((x) => x.quantity > 0),
    );
  }, []);

  const removeNewItem = useCallback((variantId: string) => {
    setNewItems((prev) => prev.filter((x) => x.variantId !== variantId));
  }, []);

  const handleUpdateNewItemDiscount = useCallback((variantId: string, type: DiscountType, inputVal: number) => {
    const target = newItems.find((item) => item.variantId === variantId);
    if (!target) return;

    const result = computeLineDiscount(target.price, type, inputVal);
    if (result.clamped === 'MAX_PERCENT') toast.warning('El descuento por producto no puede superar el 100%');
    if (result.clamped === 'ABOVE_PRICE') {
      toast.warning(`El precio de venta no puede superar el precio original (${formatMoney(target.price)})`);
    }
    setNewItems((prev) =>
      prev.map((item) =>
        item.variantId === variantId
          ? { ...item, discountType: result.discountType, discountRate: result.discountRate, discountAmount: result.discountAmount }
          : item,
      ),
    );
  }, [newItems]);

  const totalNewItems = newItemsTotal(newItems);
  const exchangeDiff = exchangeDifference(totalNewItems, totalToReturn);

  // Confirm Refund
  const handleConfirmRefund = useCallback(async () => {
    if (!foundSale || selectedReturnItems.length === 0) return;
    try {
      await processRefund({
        branchId,
        saleId: foundSale.id,
        cashSessionId,
        reason: reason.trim() || 'Devolución desde POS',
        items: selectedReturnItems.map((item: SaleItemRow) => ({
          variantId: item.variantId,
          quantity: returnQtyMap[item.variantId] ?? 0,
        })),
      });
      toast.success(`Devolución procesada: ${formatMoney(totalToReturn)}`);
      handleClose();
    } catch (err: any) {
      toast.error(err?.message || 'Error al procesar la devolución');
    }
  }, [foundSale, selectedReturnItems, branchId, cashSessionId, reason, returnQtyMap, totalToReturn, processRefund, handleClose]);

  // Confirm Exchange
  const handleConfirmExchange = useCallback(async () => {
    if (!foundSale || selectedReturnItems.length === 0 || newItems.length === 0) return;
    try {
      await processRefund({
        branchId,
        saleId: foundSale.id,
        cashSessionId,
        reason: reason.trim() || 'Cambio de prenda',
        items: selectedReturnItems.map((item: SaleItemRow) => ({
          variantId: item.variantId,
          quantity: returnQtyMap[item.variantId] ?? 0,
        })),
      });

      const exchangeCustomerId = foundSale.customer?.id || undefined;

      await processSale({
        branchId,
        cashSessionId,
        customerId: exchangeCustomerId,
        lines: newItems,
        payments: [{ paymentMethod: PaymentMethod.EFECTIVO, amount: totalNewItems }],
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
  }, [
    foundSale,
    selectedReturnItems,
    newItems,
    branchId,
    cashSessionId,
    reason,
    returnQtyMap,
    totalNewItems,
    exchangeDiff,
    processRefund,
    processSale,
    handleClose,
  ]);

  const isProcessing = isRefunding || isSelling;

  return {
    step,
    setStep,
    invoiceInput,
    setInvoiceInput,
    isSearching,
    foundSale,
    setFoundSale,
    returnQtyMap,
    adjustReturnQty,
    selectedReturnItems,
    allItemsFullyRefunded,
    totalToReturn,
    reason,
    setReason,
    newItems,
    scanInput,
    setScanInput,
    isScanLoading,
    scanRef,
    handleScanKeyPress,
    adjustNewItemQty,
    removeNewItem,
    handleUpdateNewItemDiscount,
    totalNewItems,
    exchangeDiff,
    handleSearch,
    handleConfirmRefund,
    handleConfirmExchange,
    handleClose,
    isProcessing,
  };
}
