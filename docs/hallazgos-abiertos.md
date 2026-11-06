# Hallazgos abiertos (encontrados probando contra el backend real)

Resueltos en la Etapa 4: el editor de productos variables ya no descarta lo escrito en la ficha del padre al crear una variante; las etiquetas de código de barras ya imprimen el precio con la moneda de la tienda. Resueltos en la Etapa 2 (guardas de ruta con permisos y errores de login por `code`): antiguos #1 y #4; en la Etapa 3, #3 (`clientRequestId`) #3 antiguo en lo que toca a tickets (Etapa 3: formato de la tienda en `escpos-builder`), y #2 (el cierre del cajero ya muestra el esperado real: el backend admite `cash.open_close` en el detalle del turno). Documento vivo: al resolver uno, bórralo o márcalo con la etapa/commit. Los marcados con test llevan un test que **fallará (o avisará)** cuando se arregle.

| # | Hallazgo | Evidencia | Dónde se arregla |
|---|---|---|---|
| 2 | **Datos de prueba:** el código de barras `001` lo comparten 4 productos (el escáner abre un selector de coincidencias) | `e2e/cashier-flow.spec.ts` elige "PANTALON VARIOS LISO" a mano | Revisar si el backend debe exigir códigos de barras únicos |

## Pendiente anotado (no es un hallazgo de la web)
- `GET /sales/cash-sessions/:id/details` comprueba acceso por **sucursal**, no por quién abrió el turno: un cajero puede leer el resumen de turnos de otros cajeros de su sucursal. El dueño decidió dejarlo así por ahora (2026-11-05).

