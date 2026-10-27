export interface CustomerEntity {
  id: string;
  identityNumber: string;
  name: string;
  email: string;
  phone: string;
  createdAt?: string;
  createdAtFormatted?: string;
  initials: string;
  isFinalConsumer: boolean;
  hasContactInfo: boolean;
}
