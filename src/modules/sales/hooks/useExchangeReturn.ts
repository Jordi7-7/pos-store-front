import React, { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useSaleByInvoice, useProcessRefund, useProcessSale } from './useSales';
import { productsService } from '@/modules/products/services/products.service';
import type {
  ModalStep,
  SaleItemRow,
  NewExchangeItem,
} from '../components/pos/exchange-return/exchange-return.types';
import {
  getNetUnitPrice,
  formatMoney,
} from '../components/pos/exchange-return/exchange-return.types';

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

  const selectedReturnItems: SaleItemRow[] =
    foundSale?.items?.filter((item: SaleItemRow) => (returnQtyMap[item.variantId] ?? 0) > 0) ?? [];

  const allItemsFullyRefunded =
    foundSale?.isFullyRefunded === true ||
    (foundSale?.items?.length > 0 &&
      foundSale.items.every((item: SaleItemRow) => item.refundableQty === 0));

  const totalToReturn = selectedReturnItems.reduce(
    (acc: number, item: SaleItemRow) =>
      acc + getNetUnitPrice(item) * (returnQtyMap[item.variantId] ?? 0),
    0,
  );

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

  const handleUpdateNewItemDiscount = useCallback(
    (variantId: string, type: 'PERCENTAGE' | 'AMOUNT', inputVal: number) => {
      setNewItems((prev) =>
        prev.map((item) => {
          if (item.variantId !== variantId) return item;

          let val = Number(inputVal.toFixed(2));
          if (isNaN(val) || val < 0) val = 0;

          let calculatedAmount = 0;
          let displayRate = val;

          if (type === 'PERCENTAGE') {
            if (val > 100) {
              val = 100;
              displayRate = 100;
              toast.warning('El descuento por producto no puede superar el 100%');
            }
            calculatedAmount = Number(((item.price * val) / 100).toFixed(2));
          } else {
            if (val > item.price) {
              val = item.price;
              displayRate = item.price;
              toast.warning(
                `El precio de venta no puede superar el precio original ($${item.price.toFixed(2)})`,
              );
            }
            calculatedAmount = Number((item.price - val).toFixed(2));
          }
          calculatedAmount = Math.max(0, Math.min(item.price, calculatedAmount));

          return {
            ...item,
            discountType: type,
            discountRate: displayRate,
            discountAmount: calculatedAmount,
          };
        }),
      );
    },
    [],
  );

  const totalNewItems = newItems.reduce((acc, x) => {
    const unitDiscount = Number(x.discountAmount || 0);
    const lineTotal = Math.max(0, (x.price - unitDiscount) * x.quantity);
    return acc + lineTotal;
  }, 0);

  const exchangeDiff = Number((totalNewItems - totalToReturn).toFixed(2));

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
          quantity: returnQtyMap[item.variantId],
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
          quantity: returnQtyMap[item.variantId],
        })),
      });

      const exchangeCustomerId = foundSale.customer?.id || undefined;

      await processSale({
        branchId,
        cashSessionId,
        customerId: exchangeCustomerId,
        items: newItems.map((x) => {
          const unitDiscount = Number(x.discountAmount || 0);
          const hasDiscount = unitDiscount > 0;
          const totalLineDiscount = Number((unitDiscount * x.quantity).toFixed(2));
          return {
            variantId: x.variantId,
            quantity: x.quantity,
            price: x.price,
            discountType: hasDiscount ? x.discountType : undefined,
            discountRate: hasDiscount ? x.discountRate : undefined,
            discountAmount: totalLineDiscount,
          };
        }),
        payments: [
          {
            paymentMethod: 'EFECTIVO',
            amount: totalNewItems,
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
