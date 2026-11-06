import { useEffect } from 'react';

interface UsePOSHotkeysProps {
  onSearchFocus: () => void;
  onCompletePayment: () => void;
  onPaymentFocus: () => void;
}

export const usePOSHotkeys = ({
  onSearchFocus,
  onCompletePayment,
  onPaymentFocus,
}: UsePOSHotkeysProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F5 key: Focuses on the search input
      if (e.key === 'F5') {
        e.preventDefault();
        onSearchFocus();
      }

      // F7 key: Focuses on the payment input
      if (e.key === 'F7') {
        e.preventDefault();
        onPaymentFocus();
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
  }, [onSearchFocus, onCompletePayment, onPaymentFocus]);
};
