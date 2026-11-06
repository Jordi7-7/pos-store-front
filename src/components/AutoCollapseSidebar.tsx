import { useEffect } from 'react';
import { useSidebar } from '@/components/ui/sidebar';

/** En pantallas medianas (tablet) el menú arranca recogido para dejar sitio al contenido; se puede abrir con el botón. */
export function AutoCollapseSidebar() {
  const { setOpen, isMobile } = useSidebar();
  useEffect(() => {
    if (isMobile) return;
    const query = window.matchMedia('(max-width: 1023px)');
    const apply = () => query.matches && setOpen(false);
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, [isMobile, setOpen]);
  return null;
}
