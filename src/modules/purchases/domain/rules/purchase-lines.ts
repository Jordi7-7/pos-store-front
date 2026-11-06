import { roundMoney } from '@/shared/domain/value-objects/money';

/** Datos para registrar el ingreso; el puerto de compras acepta esta misma forma. */
export interface PurchaseRequest {
  supplierId?: string;
  branchId: string;
  invoiceNumber?: string;
  items: { variantId: string; quantity: number; purchasePrice: number }[];
}

/** Una fila del formulario de ingreso: vacía hasta que se elige un producto por su SKU. */
export interface PurchaseLine {
  variantId: string;
  variantSku: string;
  productName: string;
  quantity: number;
  unitCost: number;
}

export const emptyPurchaseLine = (): PurchaseLine => ({ variantId: '', variantSku: '', productName: '', quantity: 1, unitCost: 0 });

export const lineSubtotal = (line: PurchaseLine): number => roundMoney((line.quantity || 0) * (line.unitCost || 0));

export const purchaseTotal = (lines: PurchaseLine[]): number => roundMoney(lines.reduce((sum, line) => sum + lineSubtotal(line), 0));

/** Solo cuentan las filas con producto elegido. */
export const filledLines = (lines: PurchaseLine[]): PurchaseLine[] => lines.filter((line) => line.variantId !== '');

/** Quita una fila; si era la única, la deja vacía en vez de borrarla. */
export function removeLine(lines: PurchaseLine[], index: number): PurchaseLine[] {
  if (lines.length === 1) return [emptyPurchaseLine()];
  return lines.filter((_, i) => i !== index);
}

/** Pone un producto en la fila `index`; si era la última, añade otra vacía para seguir escribiendo. */
export function assignProduct(lines: PurchaseLine[], index: number, product: { id: string; sku: string; productName: string; purchasePrice: number }): PurchaseLine[] {
  const current = lines[index];
  if (!current) return lines;
  const next = [...lines];
  next[index] = { ...current, variantId: product.id, variantSku: product.sku, productName: product.productName, unitCost: Number(product.purchasePrice || 0) };
  if (index === next.length - 1) next.push(emptyPurchaseLine());
  return next;
}

export function toPurchaseRequest(lines: PurchaseLine[], branchId: string, supplierId: string, invoiceNumber: string): PurchaseRequest {
  return {
    branchId,
    supplierId: supplierId || undefined,
    invoiceNumber: invoiceNumber.trim() || undefined,
    items: filledLines(lines).map((line) => ({ variantId: line.variantId, quantity: line.quantity, purchasePrice: line.unitCost })),
  };
}
