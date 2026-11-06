import { test, expect } from '@playwright/test';
import { creds, login, watchProblems } from './helpers';

test.skip(!creds.slug || !creds.user || !creds.pass, 'Faltan credenciales E2E en .env.e2e.local');

test('la propietaria audita un turno cerrado: cifras, pestañas, guía de fórmulas y reimpresión', async ({ page }) => {
  const problems = watchProblems(page);
  await login(page);
  await page.goto('/cajas/historial');
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: /Auditar Caja/ }).first().click();
  await expect(page.getByText('Arqueo y Auditoría de Caja')).toBeVisible();

  // Cabecera y cifras principales
  await expect(page.getByText('Abierta por')).toBeVisible();
  await expect(page.getByText('Efectivo Esperado').first()).toBeVisible();

  // Pestañas de movimientos
  for (const tab of [/Gastos/, /Devoluciones/, /Ventas/]) {
    await page.getByRole('button', { name: tab }).first().click();
  }

  // Guía de fórmulas: se muestra y se oculta
  await page.getByRole('button', { name: /¿Cómo se calculan\?/ }).click();
  await expect(page.getByRole('button', { name: /Ocultar Fórmulas/ })).toBeVisible();
  await page.getByRole('button', { name: /Ocultar Fórmulas/ }).click();

  // Corte Z de la sesión: abre la vista previa del ticket con los importes de la tienda
  await page.getByRole('button', { name: /Imprimir Ticket de Sesión/ }).click();
  await expect(page.getByText(/Efectivo Esperado|EFECTIVO ESPERADO/i).first()).toBeVisible();

  const pageErrors = problems.consoleErrors.filter((e) => e.startsWith('pageerror:'));
  expect(pageErrors).toEqual([]);
});
