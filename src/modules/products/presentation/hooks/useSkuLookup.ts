import { useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/shared/presentation/formatting/error-messages';
import type { PosVariantEntity } from '../../domain/entities/catalog.entity';
import { matchSku } from '../../domain/rules/variant-lookup';
import { useVariantSearch } from './useVariantSearch';

/**
 * Busca un SKU (o código de barras) en una sucursal y devuelve la variante, o `null` avisando por qué no
 * (producto con variantes, no existe, varias coincidencias). `action` completa el aviso: «mover», «contar»…
 */
export function useSkuLookup(branchId: string) {
  const { searchPos } = useVariantSearch();
  const [isSearching, setIsSearching] = useState(false);

  const find = async (rawSku: string, action: string): Promise<PosVariantEntity | null> => {
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
      if (match.kind === 'found') return match.variant;
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
