export interface CustomerDTO {
  id: string;
  identityNumber: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCustomerDTO {
  identityNumber: string;
  name: string;
  email?: string | null;
  phone?: string | null;
}

export type UpdateCustomerDTO = Partial<CreateCustomerDTO>;

export interface CustomerFormData {
  identityNumber: string;
  name: string;
  email?: string | null;
  phone?: string | null;
}
