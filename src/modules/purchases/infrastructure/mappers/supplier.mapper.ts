import type { SupplierDto } from '../dtos/purchase.dto';
import type { SupplierEntity } from '../../domain/entities/supplier.entity';

export const toSupplierEntity = (dto: SupplierDto): SupplierEntity => ({
  id: dto.id || '',
  identityNumber: dto.identityNumber || '',
  name: dto.name || '',
  email: dto.email || '',
  phone: dto.phone || '',
  address: dto.address || '',
});
