import { useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/shared/presentation/formatting/error-messages';
import type { PosVariantEntity } from '../../domain/entities/catalog.entity';
import { matchSku } from '../../domain/rules/variant-lookup';
import { useVariantSearch } from './useVariantSearch';

/**
 * Busca un SKU (o código de barras) en una sucursal y devuelve la variante, o `null` avisando por qué no
 * (producto con variantes, no existe, varias coincidencias). `action` completa el aviso: «mover», «contar»…
 * Para las pantallas de inventario: agrega el costo de compra de referencia, que el escaneo del POS no trae.
 */
export function useSkuLookup(branchId: string) {
  const { searchPos, findVariantBySku } = useVariantSearch();
  const [isSearching, setIsSearching] = useState(false);

  /** Es solo una sugerencia en la casilla de costo: si no se puede consultar, el producto se agrega sin ella. */
  const referenceCostOf = (sku: string): Promise<number | undefined> =>
    findVariantBySku(sku).then(
      (variant) => Number(variant.purchasePrice),
      () => undefined,
    );

  const find = async (rawSku: string, action: string): Promise<(PosVariantEntity & { referenceCost: number | undefined }) | null> => {
    const sku = rawSku.trim();
    if (!sku) return null;
    setIsSearching(true);
    try {
      const result = await searchPos(sku, branchId);
      if (result.kind === 'variable-product') {
        toast.warning(`"${sku}" es un producto con variantes. Escribe el SKU de la variante que quieres ${action}.`);
        return null;
      }
      const match = matchSku(result.variants, sku);
      if (match.kind === 'found') return { ...match.variant, referenceCost: await referenceCostOf(match.variant.sku) };
      toast.error(match.kind === 'not-found' ? `El SKU "${sku}" no se encuentra en el catálogo.` : `"${sku}" coincide con varios productos. Escribe el SKU completo.`);
      return null;
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo buscar el producto.'));
      return null;
    } finally {
      setIsSearching(false);
    }
  };

  return { find, isSearching };
}
