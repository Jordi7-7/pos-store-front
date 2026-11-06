/** Cliente. Solo datos del negocio: las iniciales y las fechas formateadas son del view-model. */
export interface CustomerEntity {
  id: string;
  identityNumber: string;
  name: string;
  email: string;
  phone: string;
  createdAt?: string;
  isFinalConsumer: boolean;
  hasContactInfo: boolean;
}

/** El comprador por defecto cuando no se identifica al cliente. */
export const DEFAULT_CUSTOMER = {
  IDENTITY_NUMBER: '9999999999',
  NAME: 'Consumidor Final',
} as const;
