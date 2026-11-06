# Hallazgos abiertos (encontrados probando contra el backend real)

Resueltos en la Etapa 2 (guardas de ruta con permisos y errores de login por `code`): antiguos #1 y #4; en la Etapa 3, #3 (`clientRequestId`) y la parte de la pantalla del #2. Documento vivo: al resolver uno, bórralo o márcalo con la etapa/commit. Los marcados con test llevan un test que **fallará (o avisará)** cuando se arregle.

| # | Hallazgo | Evidencia | Dónde se arregla |
|---|---|---|---|
| 2 | **El cajero del tenant de pruebas no puede ver el resumen del turno al cerrar caja.** `GET /sales/cash-sessions/:id/details` exige `action:cash_sessions.get`; el rol por defecto del backend lo incluye, pero el rol "Cajero" de este tenant no. La pantalla ya no inventa ceros (avisa que el resumen no está disponible y deja cerrar contando), pero el dueño eligió **esperado visible**: falta darle ese permiso al rol Cajero (pantalla Personal y Roles) | e2e del turno: acepta ambos estados; con el permiso mostrará el esperado | Acción del dueño (rol) |
| 3 | **Datos de prueba:** el código de barras `001` lo comparten 4 productos (el escáner abre un selector de coincidencias) | `e2e/cashier-flow.spec.ts` elige "PANTALON VARIOS LISO" a mano | Revisar si el backend debe exigir códigos de barras únicos |
| 4 | **Tickets e etiquetas** siguen con `$` y `toFixed` fijos (33 sitios) | `src/test` guarda excluye `escpos-builder.ts` y `label-builder.ts` | Etapa 3 (puertos de impresión) |
