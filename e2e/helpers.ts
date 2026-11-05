import { expect, type Page } from '@playwright/test';

export const creds = {
  slug: process.env.E2E_TENANT_SLUG ?? '',
  user: process.env.E2E_USERNAME ?? '',
  pass: process.env.E2E_PASSWORD ?? '',
};

export async function login(page: Page): Promise<void> {
  await page.goto(`/login/${creds.slug}`);
  await page.getByRole('button', { name: /Usuario \/ Clave/ }).click();
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
