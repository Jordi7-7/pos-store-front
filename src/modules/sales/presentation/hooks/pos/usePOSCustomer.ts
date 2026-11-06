import { useEffect, useState } from 'react';
import { useCustomerList } from '@/modules/customers';

const FINAL_CONSUMER_IDENTITIES = ['9999999999999', '9999999999'];

/** Cliente de la venta; por defecto, CONSUMIDOR FINAL cuando existe. */
export function usePOSCustomer() {
  const { customers } = useCustomerList();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  useEffect(() => {
    if (customers && customers.length > 0 && !selectedCustomerId) {
      const finalConsumer = customers.find(
        (c) => c.name.toUpperCase() === 'CONSUMIDOR FINAL' || FINAL_CONSUMER_IDENTITIES.includes(c.identityNumber ?? ''),
      );
      if (finalConsumer) setSelectedCustomerId(finalConsumer.id);
    }
  }, [customers, selectedCustomerId]);

  return { customers, selectedCustomerId, setSelectedCustomerId };
}
