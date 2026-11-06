export interface CustomerDTO {
  id: string;
  identityNumber: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
