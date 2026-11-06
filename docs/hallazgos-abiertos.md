# Hallazgos abiertos (encontrados probando contra el backend real)

Resueltos en la Etapa 2 (guardas de ruta con permisos y errores de login por `code`): antiguos #1 y #4. Documento vivo: al resolver uno, bórralo o márcalo con la etapa/commit. Los marcados con test llevan un test que **fallará (o avisará)** cuando se arregle.

| # | Hallazgo | Evidencia | Dónde se arregla |
|---|---|---|---|
| 2 | **El cierre de caja del cajero muestra ceros inventados.** `GET /sales/cash-sessions/:id/details` exige `view:cash_sessions`, que el cajero no tiene (403); el modal de cierre lo traga y muestra "Tickets 0, Cobros efectivo $0.00, Efectivo esperado $100" cuando lo real era $410. Decisión de negocio pendiente: ¿cierre ciego (el cajero no ve el esperado) o se le da el permiso? En ambos casos la pantalla no debe mostrar ceros como si fueran datos | exploración 2026-11-05; el e2e del turno cierra con el efectivo contado | Etapa 3 (`CierreModal`) + decisión del dueño |
| 3 | **`POST /sales` no envía `clientRequestId`.** Un doble clic o un reintento tras un corte de red puede duplicar la venta; el backend ya lo protege si se envía | el e2e lo anota en cada ejecución (`clientRequestId en POST /sales`) | Etapa 3 (`checkout`) |
| 5 | **Datos de prueba:** el código de barras `001` lo comparten 4 productos (el escáner abre un selector de coincidencias) | `e2e/cashier-flow.spec.ts` elige "PANTALON VARIOS LISO" a mano | Revisar si el backend debe exigir códigos de barras únicos |
| 6 | **Tickets e etiquetas** siguen con `$` y `toFixed` fijos (33 sitios) | `src/test` guarda excluye `escpos-builder.ts` y `label-builder.ts` | Etapa 3 (puertos de impresión) |
