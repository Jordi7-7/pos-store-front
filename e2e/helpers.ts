import { expect, type APIRequestContext, type Page } from '@playwright/test';

export const creds = {
  slug: process.env.E2E_TENANT_SLUG ?? '',
  user: process.env.E2E_USERNAME ?? '',
  pass: process.env.E2E_PASSWORD ?? '',
};

export async function login(page: Page): Promise<void> {
  await page.goto(`/login/${creds.slug}`);
  await page.getByRole('tab', { name: /Usuario \/ Clave/ }).click();
  await page.getByPlaceholder('cajero1 o admin@tienda.com').fill(creds.user);
  await page.getByPlaceholder('••••••••').fill(creds.pass);
  await page.getByRole('button', { name: /Acceder al Sistema/ }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

/** Recoge errores de consola y respuestas HTTP >= 400 de la API mientras dura la prueba. */
export function watchProblems(page: Page) {
  const consoleErrors: string[] = [];
  const badResponses: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200));
  });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message.slice(0, 200)}`));
  page.on('response', (r) => {
    if (r.status() >= 400 && r.url().includes('localhost:3000')) {
      badResponses.push(`${r.status()} ${r.request().method()} ${new URL(r.url()).pathname}`);
    }
  });
  return { consoleErrors, badResponses };
}

export const cashier = { pin: process.env.E2E_PIN ?? '' };
export const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3000';

/** Entra por la pantalla de PIN (teclado numérico) y espera a que el POS termine de cargar. */
export async function pinLogin(page: Page, pin: string = cashier.pin): Promise<void> {
  await page.goto(`/login/${creds.slug}`);
  await page.waitForLoadState('networkidle');
  for (const digit of pin.split('')) await page.keyboard.press(digit);
  await page.keyboard.press('Enter');
  await page.waitForURL(/\/pos/, { timeout: 10_000 });
  await page.getByText('Digita tu PIN').waitFor({ state: 'detached', timeout: 10_000 });
}

interface AdminSession {
  token: string;
  call: <T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown) => Promise<{ status: number; data: T }>;
}

/** Sesión de la propietaria por API, para preparar y verificar datos sin pasar por la interfaz. */
export async function adminApi(request: APIRequestContext): Promise<AdminSession> {
  const login = await request.post(`${API_URL}/auth/login`, {
    data: { email: creds.user, password: creds.pass, tenantSlug: creds.slug },
  });
  const { accessToken } = (await login.json()) as { accessToken: string };
  return {
    token: accessToken,
    call: async <T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown) => {
      const response = await request.fetch(`${API_URL}${path}`, {
        method,
        headers: { Authorization: `Bearer ${accessToken}` },
        ...(body === undefined ? {} : { data: body }),
      });
      return { status: response.status(), data: (await response.json().catch(() => null)) as T };
    },
  };
}

interface Profile {
  cashRegisters: Array<{ id: string; name: string; branchId: string }>;
}
interface ActiveSession {
  id: string;
}
interface SessionDetails {
  session: { expectedBalance: number };
}

/** Deja la caja sin turno abierto (cierra con el efectivo esperado) para que el test parta de cero. */
export async function resetCashRegister(request: APIRequestContext, registerName: string): Promise<{ id: string; branchId: string }> {
  const admin = await adminApi(request);
  const profile = (await admin.call<Profile>('GET', '/auth/profile')).data;
  const register = profile.cashRegisters.find((r) => r.name === registerName);
  if (!register) throw new Error(`No existe la caja "${registerName}" en el tenant de pruebas`);
  const active = (
    await admin.call<ActiveSession | ''>('GET', `/sales/cash-sessions/active?branchId=${register.branchId}&cashRegisterId=${register.id}`)
  ).data;
  if (active && typeof active === 'object' && active.id) {
    const details = (await admin.call<SessionDetails>('GET', `/sales/cash-sessions/${active.id}/details`)).data;
    await admin.call('POST', `/sales/cash-sessions/${active.id}/close`, { closingBalance: Math.max(0, details.session.expectedBalance) });
  }
  return { id: register.id, branchId: register.branchId };
}
