import type { Supplier } from '../types/purchases.types';
import type { SupplierEntity } from '../entities/supplier.entity';

export const toSupplierEntity = (dto: Supplier): SupplierEntity => ({
  id: dto.id || '',
  identityNumber: dto.identityNumber || '',
  name: dto.name || 'Sin Nombre',
  email: dto.email || '',
  phone: dto.phone || '',
  address: dto.address || '',
  displayText: `${dto.name || 'Sin Nombre'} (${dto.identityNumber || 'S/N'})`,
});

export const toSupplierEntities = (dtos: Supplier[]): SupplierEntity[] =>
  (dtos || []).map(toSupplierEntity);
