export interface CountryOption {
  code: string;
  name: string;
}

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

export interface TimezoneOption {
  name: string;
  utcOffsetStr: string;
  /** Códigos de los países donde rige esta zona horaria. */
  countries: string[];
}

/** Opciones que el backend ofrece para configurar el negocio. */
export interface TenantMetadata {
  countries: CountryOption[];
  currencies: CurrencyOption[];
  timezones: TimezoneOption[];
}

/** Configuración del negocio (la que se edita en Configuración Negocio). */
export interface TenantSettings {
  id: string;
  name: string;
  slug?: string;
  logoUrl?: string | null;
  ruc: string;
  country: string;
  currencyCode: string;
  currencySymbol: string;
  timezone: string;
}
