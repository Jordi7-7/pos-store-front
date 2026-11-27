import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTenantId } from '@/modules/auth/presentation/hooks/useSession';
import { targetsOfProducts } from '../../domain/rules/bulk-images';
import { productsRepository } from '../../infrastructure/dependencies';

/** Busca a mano a qué producto o variante poner una foto. */
export function useImageTargetSearch() {
  const tenantId = useTenantId();
  const [term, setTerm] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setSearch(term.trim()), 300);
    return () => clearTimeout(timer);
  }, [term]);

  const query = useQuery({
    queryKey: ['products', tenantId, 'image-targets', search],
    queryFn: () => productsRepository.list({ search, limit: 10 }),
    enabled: !!tenantId && search.length >= 2,
  });

  return { term, setTerm, targets: targetsOfProducts(query.data?.data ?? []), isSearching: query.isFetching, hasSearched: search.length >= 2 };
}
