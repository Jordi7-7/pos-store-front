const RESERVED_PATHS = new Set(['', 'onboard', 'api', 'assets', 'favicon.ico', 'login', 'portal']);

export function getTenantSlugFromPath(): string | null {
  if (typeof window === 'undefined') return null;

  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  if (!path) return null;

  const parts = path.split('/');

  // Case A: /login/:slug
  if (parts[0]?.toLowerCase() === 'login' && parts[1]) {
    return parts[1].toLowerCase().trim();
  }

  // Case B: /:slug
  const firstSegment = parts[0]?.toLowerCase().trim();
  if (!firstSegment || RESERVED_PATHS.has(firstSegment)) {
    return null;
  }

  return firstSegment;
}

export function parseTenantUrl(): { slug: string | null; subpath: string } {
  if (typeof window === 'undefined') return { slug: null, subpath: '' };
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  if (!path) return { slug: null, subpath: '' };

  const parts = path.split('/');
  const firstSegment = parts[0]?.toLowerCase().trim();

  if (!firstSegment || RESERVED_PATHS.has(firstSegment)) {
    return { slug: null, subpath: '' };
  }

  const subpath = parts.slice(1).join('/');
  return { slug: firstSegment, subpath };
}

export function setTenantUrlPath(slug: string, subpath = '') {
  if (typeof window === 'undefined') return;
  const cleanSubpath = subpath.replace(/^\/+/, '');
  const target = cleanSubpath ? `/login/${slug}/${cleanSubpath}` : `/login/${slug}`;
  if (window.location.pathname !== target) {
    window.history.pushState(null, '', target);
  }
}

