import { createFileRoute } from '@tanstack/react-router';
import { POSView } from '@/modules/sales/components/POSView';
import { useLayoutContext } from '@/providers/LayoutContext';

export const Route = createFileRoute('/_layout/pos')({
  component: POSRoute,
});

function POSRoute() {
  const { selectedBranchId, activeSession, setActiveSession } = useLayoutContext();

  return (
    <POSView
      selectedBranchId={selectedBranchId || ''}
      activeSession={activeSession}
      setActiveSession={setActiveSession}
    />
  );
}
