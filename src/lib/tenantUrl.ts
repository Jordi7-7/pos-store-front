const RESERVED_PATHS = new Set(['', 'onboard', 'api', 'assets', 'favicon.ico', 'login', 'portal']);

export function getTenantSlugFromPath(): string | null {
  if (typeof window === 'undefined') return null;
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  if (!path) return null;

  const parts = path.split('/');
  const firstSegment = parts[0]?.toLowerCase().trim();

  if (!firstSegment || RESERVED_PATHS.has(firstSegment)) {
    return null;
  }

  return firstSegment;
}

export function setTenantUrlPath(slug: string, subpath = '') {
  if (typeof window === 'undefined') return;
  const target = `/${slug}${subpath ? (subpath.startsWith('/') ? subpath : `/${subpath}`) : ''}`;
  if (window.location.pathname !== target) {
    window.history.pushState(null, '', target);
  }
}
