import { test, expect } from '@playwright/test';
import { creds, login } from './helpers';

test.skip(!creds.slug || !creds.user || !creds.pass, 'Faltan credenciales E2E en .env.e2e.local');

test('login con usuario y contraseña entra a la aplicación', async ({ page }) => {
  await login(page);
});

test('contraseña incorrecta muestra un error y no entra (1 solo intento: el límite es 5)', async ({ page }) => {
  await page.goto(`/login/${creds.slug}`);
  await page.getByRole('button', { name: /Usuario \/ Clave/ }).click();
  await page.getByPlaceholder('cajero1 o admin@tienda.com').fill(creds.user);
  await page.getByPlaceholder('••••••••').fill(`${creds.pass}-incorrecta`);
  await page.getByRole('button', { name: /Acceder al Sistema/ }).click();
  await expect(page).toHaveURL(/\/login/);
  const banner = page.locator('div.text-rose-500').first();
  await expect(banner).toBeVisible();
  test.info().annotations.push({ type: 'mensaje mostrado', description: await banner.innerText() });
});
