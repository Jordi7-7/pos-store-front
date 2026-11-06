import { DEFAULT_CUSTOMER, type CustomerEntity } from '../../domain/customer.entity';
import type { CustomerDTO } from '../dtos/customer.dto';

export const toCustomerEntity = (dto: CustomerDTO): CustomerEntity => ({
  id: dto.id,
  identityNumber: dto.identityNumber || '',
  name: dto.name || '',
  email: dto.email || '',
  phone: dto.phone || '',
  createdAt: dto.createdAt,
  isFinalConsumer:
    dto.identityNumber === DEFAULT_CUSTOMER.IDENTITY_NUMBER || dto.name?.trim().toLowerCase() === DEFAULT_CUSTOMER.NAME.toLowerCase(),
  hasContactInfo: Boolean(dto.email || dto.phone),
});

export const toCustomerEntities = (dtos: CustomerDTO[]): CustomerEntity[] => (dtos || []).map(toCustomerEntity);
