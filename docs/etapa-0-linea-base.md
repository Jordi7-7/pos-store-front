# Etapa 0 · Línea base y prueba real (2026-11-05)

## Cifras medidas
| Comprobación | Resultado |
|---|---|
| `pnpm typecheck` | limpio |
| `pnpm test` | 22 tests en 2 archivos, en verde |
| `pnpm lint` | 265 avisos = el tope (`--max-warnings 265`); 0 de ellos en `e2e/` |
| `any` (`: any`, `as any`, `<any>`, sin `components/ui`) | 197 (el plan decía 202 con otro criterio de conteo) |
| `pnpm e2e` (Playwright, Chromium) | 3 tests en verde: login, login fallido, humo de 7 rutas |

## Árbol de trabajo (sin commit)
Los 24 archivos modificados se agrupan así (no se ha commiteado nada):
- **Tooling:** `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.oxlintrc.json`, `tsconfig.app.json`, `vite.config.ts`, `src/test/`, `.github/workflows/ci.yml` y `deploy.yml`.
- **Tests:** `customer.mapper.test.ts`, `usePOSCart.test.ts`.
- **Arreglos por `noUncheckedIndexedAccess` y `catch` sin variable** (22 archivos de `src/modules` y `src/providers`): cambios pequeños y mecánicos; revisados, sin cambios de comportamiento salvo que `BulkImportModal` y `BulkPurchaseModal` ahora lanzan error si el Excel no tiene hojas.
- **Añadido en esta etapa:** `@playwright/test`, `playwright.config.ts`, `e2e/`, script `pnpm e2e`, `.gitignore` (resultados de Playwright). Las credenciales de prueba van en `.env.e2e.local` (ignorado por git).

Propuesta de commits (en inglés, por tema): `chore: add vitest, stricter lint and CI` · `test: add cart and customer mapper tests` · `fix: handle possibly undefined indexed access` · `test: add playwright e2e baseline`.

## Prueba real contra el backend (tenant `leiza`, sucursal Leiza, Caja Principal 1)
Por API, replicando lo que envía el front. Funciona todo el recorrido:
- Abrir turno (201); abrir otra vez la misma caja → **409 `CASH_REGISTER_BUSY`** con mensaje útil.
- Venta de 310 pagando 400: el servidor guarda 310 (el vuelto no es ingreso) y asigna CONSUMIDOR FINAL.
- **Idempotencia confirmada:** el mismo `clientRequestId` devuelve la misma venta, no una duplicada.
- Devolución total (201); segunda devolución → **409 `SALE_ALREADY_REFUNDED`**.
- Cierre con arqueo 100 = 100, diferencia 0. Stock restituido.
- Datos que dejó la prueba: 2 ventas (folios 001-001-000000047 y 048), ambas devueltas, en un turno ya cerrado.
- Contrato de errores confirmado: 404 `SALE_NOT_FOUND`, 401 `AUTH_TOKEN_INVALID`, 400 `VALIDATION_FAILED` (con `details`), todos con `requestId`.

## Fallos y riesgos reales encontrados en el front
1. **Login: todo error se muestra como "Credenciales incorrectas".** `authStore.login()` devuelve `false` ante cualquier excepción. Un 429 (`TOO_MANY_ATTEMPTS`), una cuenta deshabilitada o el backend caído dicen lo mismo al usuario. (Plan: problemas 1 y 10.)
2. **El front no envía `clientRequestId`.** Un doble clic o un reintento tras un corte de red puede duplicar la venta. El backend ya lo protege si se envía.
3. **El POS adopta la sesión de caja abierta del usuario** (Caja 2, abierta hace 18 h): cualquier venta o "Cerrar Caja" desde la UI actúa sobre ese turno.
4. **Moneda:** el tenant es MXN (país MX) y la UI sigue escribiendo `$` fijo y `toFixed(2)` (p. ej. `-${...toFixed(2)}` en `POSPaymentPanel`).
5. Las 7 rutas probadas (`/dashboard`, `/pos`, `/ventas`, `/clientes`, `/usuarios`, `/multimedia`, `/configuracion`) cargan sin errores de consola ni respuestas ≥ 400.

## Qué no se cubrió
- **Recorrido de venta/devolución/cierre por la interfaz:** no se automatizó para no tocar el turno de Caja 2 (ver decisión 1).
- **429 en login:** no se provocó; bloquearía la cuenta `admin` 15 min.
- **403** (`PERMISSION_DENIED`, `BRANCH_ACCESS_DENIED`, `PERMISSION_ESCALATION`): hace falta un usuario no propietario.
- **409 `SKU_TAKEN` / `BASE_SKU_TAKEN`:** exige crear productos en el tenant.
- **PIN login**, compras, reportes e inventario más allá de que la ruta cargue.
- Otros navegadores: solo Chromium (decisión del dueño: lo último).

## Decide el dueño
1. **Para el e2e de venta por UI:** ¿puedes cerrar Caja 2 a mano (o decirme que lo haga yo) o prefieres crear un tenant/sucursal de pruebas aparte? Recomiendo un tenant de pruebas.
2. **Usuario no propietario** (p. ej. un cajero con PIN) en el tenant de pruebas, para cubrir 403 y PIN.
3. **Commits** del árbol de trabajo según la propuesta de arriba.
