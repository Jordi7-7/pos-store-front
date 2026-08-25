import { useEffect } from 'react';

interface UsePOSHotkeysProps {
  onSearchFocus: () => void;
  onCompletePayment: () => void;
}

export const usePOSHotkeys = ({
  onSearchFocus,
  onCompletePayment,
}: UsePOSHotkeysProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F5 key: Focuses on the search input
      if (e.key === 'F5') {
        e.preventDefault();
        onSearchFocus();
      }

      // F12 key: Completes/processes the sale
      if (e.key === 'F12') {
        e.preventDefault();
        onCompletePayment();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onSearchFocus, onCompletePayment]);
};
