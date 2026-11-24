# Estado de la web

**Esto caduca.** Es una foto con fechas, no una regla; contrástala con `git log` / `git status`. Las reglas viven en `../CLAUDE.md`. Última revisión: 2026-11-22.

## Cifras medidas
| Comprobación | Resultado | Fecha |
|---|---|---|
| `pnpm typecheck` | limpio | 2026-11-22 |
| `pnpm test` | 496 tests, 79 archivos | 2026-11-24 |
| `pnpm lint` | 50 avisos (tope 51, solo baja) | 2026-11-22 |
| `any` escritos a mano (sin `components/ui` ni `routeTree.gen.ts`) | 1 (`CashSessionsHistoryView.tsx`) | 2026-11-22 |
| `pnpm e2e` (Playwright) | 29 en verde contra el backend real; los e2e del filtro de existencias, de «Buscar» con Enter y del foco del POS **no se han podido ejecutar** (el backend de desarrollo estaba sobre la copia de producción) | 2026-11-24 |

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

**Hecho el 2026-11-24 (comiteado):**
- Pantallas de movimientos de inventario (entrada, salida, conteo, traslado), historial filtrado por **categoría** con la columna **Saldo** y ventana de documento.
- Listado de productos: filtro de **existencias** (con existencias, en cero, en negativo) resuelto en el servidor, rediseño de la barra (búsqueda en vivo sin botón «Buscar», «Limpiar filtros» e «Imprimir etiquetas» en la franja de la tarjeta) y paginación arriba y abajo (`PaginationControls` admite `placement`).
- POS: la lista del carrito muestra primero lo último escaneado (el carrito y el ticket siguen en orden de escaneo) y, al completar la venta, el foco vuelve al campo de escaneo (también al cerrar la vista previa del ticket).
- Los e2e de productos pulsan Enter en el buscador (ya no hay botón «Buscar»).

## Falta
- Repasar a mano 429/403/409 contra el backend real.
- Quitar el último `any` y bajar los avisos de lint.
- Offline: se prepara (repositorios como puertos, `clientRequestId`) pero no se implementa; antes hay que decidir alcance, factura provisional y conflictos.
- Hallazgos abiertos de pruebas: `hallazgos-abiertos.md`.
