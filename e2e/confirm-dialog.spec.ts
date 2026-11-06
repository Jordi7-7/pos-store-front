import { test, expect } from '@playwright/test';
import { creds, login } from './helpers';

test.skip(!creds.slug || !creds.user || !creds.pass, 'Faltan credenciales E2E en .env.e2e.local');

test('eliminar una imagen pide confirmación con un diálogo de la app (no el nativo) y cancelar no borra nada', async ({ page }) => {
  const nativeDialogs: string[] = [];
  page.on('dialog', (dialog) => {
    nativeDialogs.push(dialog.message());
    void dialog.dismiss();
  });
  const deletes: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'DELETE' && request.url().includes('/media')) deletes.push(request.url());
  });

  await login(page);
  await page.goto('/multimedia');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Eliminar imagen' }).first().click();

  const dialog = page.getByRole('dialog', { name: 'Eliminar imagen' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/no se puede deshacer/i)).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancelar' }).click();
  await expect(dialog).toBeHidden();

  expect(nativeDialogs, 'no debe salir ningún cuadro nativo del navegador').toEqual([]);
  expect(deletes, 'cancelar no borra').toEqual([]);
});
