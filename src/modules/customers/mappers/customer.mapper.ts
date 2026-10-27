import type { CustomerDTO } from '../types/customer.types';
import type { CustomerEntity } from '../entities/customer.entity';
import { DEFAULT_CUSTOMER } from '../enums/customer.enums';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';

export const getCustomerInitials = (name?: string): string => {
  if (!name || !name.trim()) return 'CL';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

export const formatCustomerDateTime = (dateVal?: string | Date | null): string => {
  if (!dateVal) return '-';
  const tz = useAuthStore.getState().timezone || 'America/Guayaquil';
  const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (!isNaN(d.getTime())) {
    try {
      return d.toLocaleString('es-EC', {
        timeZone: tz,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return d.toLocaleString();
    }
  }
  return String(dateVal);
};

export const toCustomerEntity = (dto: CustomerDTO): CustomerEntity => {
  const isFinalConsumer =
    dto.identityNumber === DEFAULT_CUSTOMER.IDENTITY_NUMBER ||
    dto.name?.trim().toLowerCase() === DEFAULT_CUSTOMER.NAME.toLowerCase();

  return {
    id: dto.id,
    identityNumber: dto.identityNumber || '',
    name: dto.name || '',
    email: dto.email || '',
    phone: dto.phone || '',
    createdAt: dto.createdAt,
    createdAtFormatted: formatCustomerDateTime(dto.createdAt),
    initials: getCustomerInitials(dto.name),
    isFinalConsumer,
    hasContactInfo: Boolean(dto.email || dto.phone),
  };
};

export const toCustomerEntities = (dtos: CustomerDTO[]): CustomerEntity[] => {
  return (dtos || []).map(toCustomerEntity);
};
