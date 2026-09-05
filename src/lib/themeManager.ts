export interface TenantThemeColors {
  primary: string;
  secondary: string;
}

export const DEFAULT_THEME: TenantThemeColors = {
  primary: '#121212',
  secondary: '#f4ece1',
};

const THEME_STORAGE_KEY = 'aura_tenant_theme';

// Helper to determine if a hex color is dark
export function isDarkColor(hexColor: string): boolean {
  const clean = hexColor.replace('#', '');
  const r = parseInt(clean.substring(0, 2) || '00', 16);
  const g = parseInt(clean.substring(2, 4) || '00', 16);
  const b = parseInt(clean.substring(4, 6) || '00', 16);
  // Perceived brightness formula (YIQ)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq < 128;
}

// Adjust lightness of hex for hover states
export function adjustHexBrightness(hexColor: string, percent: number): string {
  const clean = hexColor.replace('#', '');
  let r = parseInt(clean.substring(0, 2) || '00', 16);
  let g = parseInt(clean.substring(2, 4) || '00', 16);
  let b = parseInt(clean.substring(4, 6) || '00', 16);

  r = Math.min(255, Math.max(0, Math.round(r + (r * percent) / 100)));
  g = Math.min(255, Math.max(0, Math.round(g + (g * percent) / 100)));
  b = Math.min(255, Math.max(0, Math.round(b + (b * percent) / 100)));

  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Applies tenant theme colors to DOM root variables
 */
export function applyTheme(theme: TenantThemeColors) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const primary = theme.primary || DEFAULT_THEME.primary;
  const secondary = theme.secondary || DEFAULT_THEME.secondary;

  const isPrimaryDark = isDarkColor(primary);
  const isSecondaryDark = isDarkColor(secondary);

  const primaryForeground = isPrimaryDark ? '#f4ece1' : '#121212';
  const secondaryForeground = isSecondaryDark ? '#ffffff' : '#18181b';

  const primaryHover = isPrimaryDark 
    ? adjustHexBrightness(primary, 20) 
    : adjustHexBrightness(primary, -15);

  const secondaryHover = isSecondaryDark 
    ? adjustHexBrightness(secondary, 15) 
    : adjustHexBrightness(secondary, -8);

  const secondaryBorder = isSecondaryDark
    ? adjustHexBrightness(secondary, 25)
    : adjustHexBrightness(secondary, -12);

  // Set brand variables
  root.style.setProperty('--brand-primary', primary);
  root.style.setProperty('--brand-primary-hover', primaryHover);
  root.style.setProperty('--brand-primary-foreground', primaryForeground);

  root.style.setProperty('--brand-secondary', secondary);
  root.style.setProperty('--brand-secondary-hover', secondaryHover);
  root.style.setProperty('--brand-secondary-foreground', secondaryForeground);
  root.style.setProperty('--brand-secondary-border', secondaryBorder);

  // Sidebar dynamic mapping
  root.style.setProperty('--sidebar', primary);
  root.style.setProperty('--sidebar-primary', secondary);
  root.style.setProperty('--sidebar-primary-foreground', secondaryForeground);
  root.style.setProperty('--sidebar-accent', isPrimaryDark ? adjustHexBrightness(primary, 15) : adjustHexBrightness(primary, -10));
  root.style.setProperty('--sidebar-border', isPrimaryDark ? adjustHexBrightness(primary, 20) : adjustHexBrightness(primary, -15));
}

/**
 * Gets saved theme from localStorage for current tenant (or global default)
 */
export function getSavedTheme(tenantId?: string | null): TenantThemeColors {
  if (typeof window === 'undefined') return DEFAULT_THEME;

  try {
    const key = tenantId ? `${THEME_STORAGE_KEY}_${tenantId}` : THEME_STORAGE_KEY;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.primary && parsed.secondary) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading theme from storage:', e);
  }

  return DEFAULT_THEME;
}

/**
 * Saves and applies theme in localStorage
 */
export function saveTheme(theme: TenantThemeColors, tenantId?: string | null) {
  if (typeof window === 'undefined') return;

  try {
    const key = tenantId ? `${THEME_STORAGE_KEY}_${tenantId}` : THEME_STORAGE_KEY;
    localStorage.setItem(key, JSON.stringify(theme));
    // Also save as fallback
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
  } catch (e) {
    console.error('Error saving theme to storage:', e);
  }

  applyTheme(theme);
}
