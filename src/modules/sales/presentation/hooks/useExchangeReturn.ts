import { DiscountType } from '@/modules/sales/domain/enums';
import React, { useState, useRef, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useSaleByInvoice } from './useSaleDetail';
import { useExchangeProducts, useRefundSale } from './useSalesMutations';
import { getErrorMessage } from '@/shared/presentation/formatting/error-messages';
import { ExchangeError } from '../../application/use-cases/exchange-products';
import { RefundSaleError } from '../../application/use-cases/refund-sale';
import type { SaleDetailEntity } from '../../domain/entities/sale.entity';
import { useVariantSearch, type PosVariableProductEntity } from '@/modules/products';
import type {
  ModalStep,
  SaleItemRow,
  NewExchangeItem,
} from '../components/pos/exchange-return/exchange-return.types';
import { formatMoney } from '../components/pos/exchange-return/exchange-return.types';
import { computeLineDiscount } from '../../domain/rules/cart-rules';
import { combinationLabel, readExchangeScan } from '../../domain/rules/exchange-scan';
import type { CartProductRef, CartVariantRef } from '../../domain/entities/cart-item';
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
  const { refundSale, isRefunding } = useRefundSale();
  const { exchangeProducts, isExchanging } = useExchangeProducts();
  const { searchPos } = useVariantSearch();

  // Modal flow state
  const [step, setStep] = useState<ModalStep>('search');
  const [invoiceInput, setInvoiceInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundSale, setFoundSale] = useState<SaleDetailEntity | null>(null);

  // Map saleItemId -> qty (una misma variante puede estar en varias líneas con precios distintos) to return
  const [returnQtyMap, setReturnQtyMap] = useState<Record<string, number>>({});

  // Reason
  const [reason, setReason] = useState('');

  // Exchange items
  const [newItems, setNewItems] = useState<NewExchangeItem[]>([]);
  const [scanInput, setScanInput] = useState('');
  const [isScanLoading, setIsScanLoading] = useState(false);
  const scanRef = useRef<HTMLInputElement>(null);
  /** Producto escaneado por su SKU base, a la espera de que se elija la variante. */
  const [variantChoice, setVariantChoice] = useState<PosVariableProductEntity | null>(null);

  const reset = useCallback(() => {
    setStep('search');
    setInvoiceInput('');
    setFoundSale(null);
    setReturnQtyMap({});
    setReason('');
    setNewItems([]);
    setScanInput('');
    setVariantChoice(null);
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
        qtyMap[item.saleItemId] = 0;
      }
      setReturnQtyMap(qtyMap);
      setStep('select-items');
    } catch (err) {
      toast.error(getErrorMessage(err, `No se encontró la venta con folio "${inv}"`));
    } finally {
      setIsSearching(false);
    }
  }, [invoiceInput, fetchSale]);

  // Adjust return qty
  const adjustReturnQty = useCallback((saleItemId: string, delta: number, max: number) => {
    setReturnQtyMap((prev) => ({
      ...prev,
      [saleItemId]: Math.min(max, Math.max(0, (prev[saleItemId] ?? 0) + delta)),
    }));
  }, []);

  const selectedReturnItems: SaleItemRow[] = useMemo(
    () => foundSale?.items?.filter((item: SaleItemRow) => (returnQtyMap[item.saleItemId] ?? 0) > 0) ?? [],
    [foundSale, returnQtyMap],
  );

  const allItemsFullyRefunded = !!foundSale && foundSale.items.length > 0 && foundSale.items.every((item) => item.refundableQty === 0);

  const totalToReturn = returnTotal(selectedReturnItems, returnQtyMap);

  const focusScan = useCallback(() => {
    setTimeout(() => scanRef.current?.focus(), 100);
  }, []);

  const addNewItem = useCallback((item: Omit<NewExchangeItem, 'quantity'>) => {
    setNewItems((prev) => {
      const existing = prev.find((x) => x.variantId === item.variantId);
      if (existing) {
        return prev.map((x) => (x.variantId === item.variantId ? { ...x, quantity: x.quantity + 1 } : x));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`${item.productName} agregado`);
  }, []);

  // Scan new items
  const handleScanKeyPress = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Enter') return;
      const code = scanInput.trim();
      if (!code) return;
      setScanInput('');
      setIsScanLoading(true);
      let choosing = false;
      try {
        const scan = readExchangeScan(await searchPos(code, branchId), code);
        if (scan.kind === 'choose') {
          choosing = true;
          setVariantChoice(scan.product);
        } else if (scan.kind === 'variant') {
          const { variant } = scan;
          addNewItem({
            variantId: variant.id,
            productName: variant.productName,
            sku: variant.sku,
            attributes: combinationLabel(variant.attributes),
            price: variant.salePrice,
          });
        } else {
          toast.error(scan.kind === 'ambiguous' ? `El código "${code}" es de varios productos. Escribe el SKU de la prenda.` : `Producto no encontrado: ${code}`);
        }
      } catch (error) {
        toast.error(getErrorMessage(error, `No se pudo buscar el código "${code}".`));
      } finally {
        setIsScanLoading(false);
        // Con la elección abierta el foco es suyo
        if (!choosing) focusScan();
      }
    },
    [scanInput, branchId, searchPos, addNewItem, focusScan],
  );

  /** La variante elegida de un producto escaneado por su SKU base. */
  const handleChooseVariant = useCallback(
    (product: CartProductRef, variant: CartVariantRef) => {
      addNewItem({
        variantId: variant.id,
        productName: product.name,
        sku: variant.sku,
        attributes: combinationLabel(variant.attributes),
        price: variant.salePrice,
      });
    },
    [addNewItem],
  );

  const closeVariantChoice = useCallback(() => {
    setVariantChoice(null);
    focusScan();
  }, [focusScan]);

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

  const returnedItems = useMemo(
    () => selectedReturnItems.map((item: SaleItemRow) => ({ variantId: item.variantId, saleItemId: item.saleItemId, quantity: returnQtyMap[item.saleItemId] ?? 0 })),
    [selectedReturnItems, returnQtyMap],
  );

  /** Los avisos de las reglas del caso de uso se muestran tal cual; el resto, por su código de error. */
  const failureMessage = (err: unknown, fallback: string): string =>
    err instanceof RefundSaleError || err instanceof ExchangeError ? err.message : getErrorMessage(err, fallback);

  // Confirm Refund
  const handleConfirmRefund = useCallback(async () => {
    if (!foundSale || selectedReturnItems.length === 0) return;
    try {
      await refundSale({ branchId, saleId: foundSale.id, cashSessionId, reason, defaultReason: 'Devolución desde POS', items: returnedItems });
      toast.success(`Devolución procesada: ${formatMoney(totalToReturn)}`);
      handleClose();
    } catch (err) {
      toast.error(failureMessage(err, 'Error al procesar la devolución'));
    }
  }, [foundSale, selectedReturnItems, branchId, cashSessionId, reason, returnedItems, totalToReturn, refundSale, handleClose]);

  // Confirm Exchange
  const handleConfirmExchange = useCallback(async () => {
    if (!foundSale || selectedReturnItems.length === 0 || newItems.length === 0) return;
    try {
      await exchangeProducts({
        branchId,
        cashSessionId,
        saleId: foundSale.id,
        customerId: foundSale.customerId,
        returned: returnedItems,
        reason,
        newLines: newItems,
      });

      const msg =
        exchangeDiff > 0
          ? `Cambio completado. Cliente paga diferencia: ${formatMoney(exchangeDiff)}`
          : exchangeDiff < 0
          ? `Cambio completado. Devolver al cliente: ${formatMoney(Math.abs(exchangeDiff))}`
          : 'Cambio completado. Sin diferencia.';
      toast.success(msg);
      handleClose();
    } catch (err) {
      toast.error(failureMessage(err, 'Error al procesar el cambio'), { duration: 10000 });
      // Si la devolución ya se registró, esta venta ya no tiene esas unidades por devolver
      if (err instanceof ExchangeError && err.code === 'REFUND_DONE_SALE_FAILED') handleClose();
    }
  }, [foundSale, selectedReturnItems, newItems, branchId, cashSessionId, reason, returnedItems, exchangeDiff, exchangeProducts, handleClose]);

  const isProcessing = isRefunding || isExchanging;

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
    variantChoice,
    handleChooseVariant,
    closeVariantChoice,
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
