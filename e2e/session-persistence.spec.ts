import { test, expect } from '@playwright/test';
import { creds, login } from './helpers';

test.skip(!creds.slug || !creds.user || !creds.pass, 'Faltan credenciales E2E en .env.e2e.local');

const API = process.env.E2E_API_URL ?? 'http://localhost:3000';
const STORAGE_KEY = 'aura-pos-auth';
const COOKIE = 'pos_rt';

interface PersistedEnvelope {
  version: number;
  state: Record<string, unknown>;
}

const storageDump = (page: import('@playwright/test').Page) =>
  page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }));

test('tras el login el navegador guarda solo usuario y tienda; los tokens no están en ningún almacenamiento ni son legibles por JavaScript', async ({ page, context }) => {
  await login(page);

  const raw = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
  const saved = JSON.parse(raw ?? '{}') as PersistedEnvelope;
  expect(saved.version).toBe(2);
  expect(Object.keys(saved.state).sort()).toEqual(['tenant', 'user']);
  expect(await storageDump(page)).not.toMatch(/accessToken|refreshToken|eyJ[A-Za-z0-9_-]{10,}\./);

  // El refresh token está en una cookie HttpOnly (solo el navegador la manda) y la página no la ve
  const cookie = (await context.cookies()).find((c) => c.name === COOKIE);
  expect(cookie, 'el login web deja la cookie de renovación').toBeTruthy();
  expect(cookie).toMatchObject({ httpOnly: true, sameSite: 'Strict', path: '/auth/web' });
  expect(await page.evaluate(() => document.cookie)).not.toContain(COOKIE);

  // La selección se guarda aparte y solo cuando el usuario elige una sucursal en la cabecera.
  const branchSelect = page.locator('header select').first();
  await expect(branchSelect).toBeVisible();
  await branchSelect.selectOption({ index: 1 });
  const workspace = JSON.parse((await page.evaluate(() => localStorage.getItem('aura-pos-workspace'))) ?? '{}') as PersistedEnvelope;
  expect(workspace.version).toBe(1);
  expect(Object.keys(workspace.state).sort()).toEqual(['selectedBranchId', 'selectedCashRegisterId']);
});

test('al recargar, la sesión se recupera con la cookie sin volver a pedir contraseña', async ({ page }) => {
  await login(page);
  const refreshed = page.waitForResponse((r) => r.url().endsWith('/auth/web/refresh') && r.request().method() === 'POST');
  await page.reload();
  expect((await refreshed).status()).toBe(200);
  await expect(page).not.toHaveURL(/\/login/);
});

test('sin la cookie (vencida o borrada) la recarga lleva al login y limpia el usuario guardado', async ({ page, context }) => {
  await login(page);
  await context.clearCookies();
  await page.reload();
  await expect(page).toHaveURL(/\/login/);
  const raw = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
  const saved = JSON.parse(raw ?? '{}') as PersistedEnvelope;
  expect(saved.state.user).toBeNull();
});

test('una sesión guardada por la versión anterior (con tokens en localStorage) obliga a iniciar sesión y borra los tokens', async ({ page, request }) => {
  // Tokens reales de la API antigua: se guardan tal como los dejaba la versión anterior de la web
  const loginResponse = await request.post(`${API}/auth/login`, { data: { email: creds.user, password: creds.pass, tenantSlug: creds.slug } });
  const { accessToken, refreshToken } = (await loginResponse.json()) as { accessToken: string; refreshToken: string };
  const profile = (await (await request.get(`${API}/auth/profile`, { headers: { Authorization: `Bearer ${accessToken}` } })).json()) as {
    id: string;
    name: string;
    username: string;
    tenant: Record<string, unknown>;
  };
  const legacy = {
    state: { accessToken, refreshToken, user: { id: profile.id, name: profile.name, username: profile.username }, tenant: profile.tenant },
    version: 1,
  };
  await page.addInitScript(
    ([key, value]) => {
      if (!localStorage.getItem(key as string)) localStorage.setItem(key as string, value as string);
    },
    [STORAGE_KEY, JSON.stringify(legacy)],
  );

  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
  const dump = await storageDump(page);
  expect(dump).not.toContain(refreshToken);
  expect(dump).not.toContain(accessToken);
});
