declare module 'numero-a-letras-es' {
  export function numeroALetras(
    numero: number,
    opciones?: {
      moneda?: string;
      mayusculas?: boolean;
      sufijo?: string;
      femenino?: boolean;
    }
  ): string;
}
