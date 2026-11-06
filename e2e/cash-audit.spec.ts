import { test, expect } from '@playwright/test';
import { creds, login, watchProblems } from './helpers';

test.skip(!creds.slug || !creds.user || !creds.pass, 'Faltan credenciales E2E en .env.e2e.local');

test('la propietaria audita un turno cerrado: cifras, pestañas, guía de fórmulas y reimpresión', async ({ page }) => {
  const problems = watchProblems(page);
  await login(page);
  await page.goto('/cajas/historial');
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: /Auditar Caja/ }).first().click();
  await expect(page.getByText('Arqueo y auditoría de caja')).toBeVisible();

  // Cabecera y cuenta del efectivo: apertura + cobros − gastos − devoluciones = esperado, y el resultado del conteo
  await expect(page.getByText('Abierta por')).toBeVisible();
  const reconciliation = page.getByRole('region', { name: 'Conciliación de efectivo' });
  await expect(reconciliation.getByText('Fondo de apertura')).toBeVisible();
  await expect(reconciliation.getByText('= Esperado')).toBeVisible();
  await expect(reconciliation.getByText('Contado al cierre')).toBeVisible();

  // Pestañas de movimientos
  for (const tab of [/Gastos/, /Devoluciones/, /Ventas/]) {
    await page.getByRole('tab', { name: tab }).first().click();
  }

  // Guía de fórmulas: se muestra y se oculta
  const guideButton = page.getByRole('button', { name: 'Cómo se calculan las cifras' });
  await guideButton.click();
  await expect(guideButton).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Cómo se calculan las cifras de este turno')).toBeVisible();
  await guideButton.click();
  await expect(guideButton).toHaveAttribute('aria-pressed', 'false');

  // Corte Z de la sesión: abre la vista previa del ticket con los importes de la tienda
  await page.getByRole('button', { name: /Imprimir ticket/ }).click();
  await expect(page.getByText(/Efectivo Esperado|EFECTIVO ESPERADO/i).first()).toBeVisible();

  const pageErrors = problems.consoleErrors.filter((e) => e.startsWith('pageerror:'));
  expect(pageErrors).toEqual([]);
});
