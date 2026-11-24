/** Las cantidades de inventario tienen 2 decimales (igual que el backend): se redondean para que 0.3 − 0.1 dé 0.2 y no 0.19999999999999998. */
export const roundQuantity = (value: number): number => Math.round(value * 100) / 100;
