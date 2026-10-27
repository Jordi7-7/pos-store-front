import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useCustomerList } from '../hooks/useCustomerList';
import { useCustomerMutations } from '../hooks/useCustomerMutations';
import type { CustomerEntity } from '../entities/customer.entity';
import type { CustomerFormData } from '../types/customer.types';
import { CustomersToolbar } from './CustomersToolbar';
import { CustomersTable } from './CustomersTable';
import { CustomerFormModal } from './CustomerFormModal';
import { CustomerDeleteDialog } from './CustomerDeleteDialog';

export const CustomersView: React.FC = () => {
  const { customers, isLoading } = useCustomerList();
  const {
    createCustomer,
    updateCustomer,
    deleteCustomer,
    isCreating,
    isUpdating,
    isDeleting,
  } = useCustomerMutations();

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerEntity | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<CustomerEntity | null>(null);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return customers;
    return customers.filter((c) => {
      const matchName = c.name.toLowerCase().includes(term);
      const matchId = c.identityNumber.toLowerCase().includes(term);
      const matchEmail = c.email.toLowerCase().includes(term);
      const matchPhone = c.phone.toLowerCase().includes(term);
      return matchName || matchId || matchEmail || matchPhone;
    });
  }, [customers, searchTerm]);

  // Handlers
  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (customer: CustomerEntity) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (customer: CustomerEntity) => {
    setDeletingCustomer(customer);
    setIsDeleteOpen(true);
  };

  const handleSubmitForm = async (formData: CustomerFormData) => {
    try {
      if (editingCustomer) {
        await updateCustomer({
          id: editingCustomer.id,
          dto: formData,
        });
      } else {
        await createCustomer(formData);
      }
      setIsFormOpen(false);
      setEditingCustomer(null);
    } catch {
      // Error handled in hook toast
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCustomer) return;
    try {
      await deleteCustomer(deletingCustomer.id);
      setIsDeleteOpen(false);
      setDeletingCustomer(null);
    } catch {
      // Error handled in hook toast
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border border-border/80 shadow-xs">
        <CustomersToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          totalCount={filteredCustomers.length}
          onOpenCreate={handleOpenCreate}
        />
        <CardContent className="p-0">
          <CustomersTable
            customers={filteredCustomers}
            isLoading={isLoading}
            searchTerm={searchTerm}
            onClearSearch={() => setSearchTerm('')}
            onEdit={handleOpenEdit}
            onDelete={handleOpenDelete}
          />
        </CardContent>
      </Card>

      <CustomerFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCustomer(null);
        }}
        customer={editingCustomer}
        onSubmit={handleSubmitForm}
        isSubmitting={isCreating || isUpdating}
      />

      <CustomerDeleteDialog
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeletingCustomer(null);
        }}
        customer={deletingCustomer}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};
