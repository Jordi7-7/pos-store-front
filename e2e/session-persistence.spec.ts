import { test, expect } from '@playwright/test';
import { creds, login } from './helpers';

test.skip(!creds.slug || !creds.user || !creds.pass, 'Faltan credenciales E2E en .env.e2e.local');

const API = process.env.E2E_API_URL ?? 'http://localhost:3000';
const STORAGE_KEY = 'aura-pos-auth';

interface PersistedEnvelope {
  version: number;
  state: Record<string, unknown>;
}

test('tras el login solo se guarda tokens, usuario, tienda y selección (sin duplicados)', async ({ page }) => {
  await login(page);
  const raw = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
  const saved = JSON.parse(raw ?? '{}') as PersistedEnvelope;
  expect(saved.version).toBe(1);
  expect(Object.keys(saved.state).sort()).toEqual([
    'accessToken',
    'refreshToken',
    'selectedBranchId',
    'selectedCashRegisterId',
    'tenant',
    'user',
  ]);
  await page.reload();
  await expect(page).not.toHaveURL(/\/login/);
});

test('una sesión guardada por la versión anterior sigue abierta y se revalida al arrancar', async ({ page, request }) => {
  // Tokens y perfil reales; con ellos se fabrica el formato antiguo (plano, sin versión).
  const loginResponse = await request.post(`${API}/auth/login`, {
    data: { email: creds.user, password: creds.pass, tenantSlug: creds.slug },
  });
  const { accessToken, refreshToken } = (await loginResponse.json()) as { accessToken: string; refreshToken: string };
  const profile = (await (
    await request.get(`${API}/auth/profile`, { headers: { Authorization: `Bearer ${accessToken}` } })
  ).json()) as {
    id: string;
    name: string;
    username: string;
    email: string | null;
    isOwner: boolean;
    permissions: string[];
    branches: Array<{ id: string; name: string }>;
    cashRegisters: unknown[];
    tenant: Record<string, unknown>;
  };
  const branchIds = profile.branches.map((b) => b.id);
  const legacy = {
    state: {
      accessToken,
      refreshToken,
      tenantId: profile.tenant.id,
      tenantSlug: profile.tenant.slug,
      publicTenant: profile.tenant,
      role: profile.isOwner ? 'OWNER' : 'USER',
      roleId: null,
      roleName: 'Propietario',
      permissions: profile.permissions,
      user: { id: profile.id, name: profile.name, username: profile.username, email: profile.email, branchIds },
      branchIds,
      cashRegisters: profile.cashRegisters,
      timezone: profile.tenant.timezone,
      selectedBranchId: null,
      selectedCashRegisterId: null,
      isAuthenticated: true,
    },
    version: 0,
  };
  await page.addInitScript(
    ([key, value]) => {
      if (!localStorage.getItem(key as string)) localStorage.setItem(key as string, value as string);
    },
    [STORAGE_KEY, JSON.stringify(legacy)],
  );

  const profileRequest = page.waitForResponse((r) => r.url().endsWith('/auth/profile') && r.status() === 200);
  await page.goto('/dashboard');
  await profileRequest; // revalidación al arrancar
  await expect(page).toHaveURL(/\/dashboard/);

  await expect
    .poll(async () => {
      const raw = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
      const saved = JSON.parse(raw ?? '{}') as PersistedEnvelope;
      const user = saved.state.user as { branches: Array<{ name: string }> } | undefined;
      return { version: saved.version, namesFilled: user?.branches.every((b) => b.name !== '') ?? false };
    })
    .toEqual({ version: 1, namesFilled: true });
});
