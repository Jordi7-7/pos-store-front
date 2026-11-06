/** Sucursal de la tienda. */
export interface Branch {
  id: string;
  name: string;
  address: string;
  code?: number;
  isActive?: boolean;
  createdAt?: string;
}
