# Estado de la web

**Esto caduca.** Es una foto con fechas, no una regla; contrástala con `git log` / `git status`. Las reglas viven en `../CLAUDE.md`. Última revisión: 2026-11-22.

## Cifras medidas
| Comprobación | Resultado | Fecha |
|---|---|---|
| `pnpm typecheck` | limpio | 2026-11-22 |
| `pnpm test` | 488 tests, 79 archivos | 2026-11-24 |
| `pnpm lint` | 50 avisos (tope 51, solo baja) | 2026-11-22 |
| `any` escritos a mano (sin `components/ui` ni `routeTree.gen.ts`) | 1 (`CashSessionsHistoryView.tsx`) | 2026-11-22 |
| `pnpm e2e` (Playwright) | 28 en verde contra el backend real | 2026-11-24 |

Al empezar el refactor: 22 tests, tope de lint 265, 202 `any`. Si una cifra empeora, algo se rompió.

## Dónde está
**El refactor a cuatro capas está terminado** (el plan por etapas se retiró; su historia queda en git). Contrastado con el código y los commits del 2026-11-05 al 11-09:
- todos los módulos migrados al patrón de capas;
- `HttpClient`/`ApiError` y catálogo `code → mensaje` completo;
- sesión con refresh token en cookie `HttpOnly` y access token en memoria;
- guardas de ruta con permisos (`ROUTE_PERMISSIONS`);
- `clientRequestId` por intento de cobro;
- carrito, arqueo y devoluciones como reglas puras con test (paridad con el backend);
- casos de uso con puertos; tickets con la moneda de la tienda; `POSView`, `CierreModal` y editores troceados.

Pruebas contra el backend real: recorrido por API (2026-11-05) y 14 specs de Playwright en `e2e/`. Desde el 2026-11-09: devoluciones por línea (`saleItemId`), filtro de lotes por tipo y fecha obligatoria en los filtros por fecha (`shared/domain/rules/date-range.ts`).

**Trabajo en curso sin commit (2026-11-24):** documentos de inventario en `products`; formularios de entrada y salida con 7 motivos y comentario obligatorio, conteo y traslado sin motivo (los pone el sistema); historial de movimientos filtrado por **categoría** (7 clases) con la columna **Saldo**. No lo comitees sin preguntar.

## Falta
- Repasar a mano 429/403/409 contra el backend real.
- Quitar el último `any` y bajar los avisos de lint.
- Offline: se prepara (repositorios como puertos, `clientRequestId`) pero no se implementa; antes hay que decidir alcance, factura provisional y conflictos.
- Hallazgos abiertos de pruebas: `hallazgos-abiertos.md`.
