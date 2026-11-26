# Estado de la web

**Esto caduca.** Es una foto con fechas, no una regla; contrástala con `git log` / `git status`. Las reglas viven en `../CLAUDE.md`. Última revisión: 2026-11-22.

## Cifras medidas
| Comprobación | Resultado | Fecha |
|---|---|---|
| `pnpm typecheck` | limpio | 2026-11-22 |
| `pnpm test` | 599 tests, 92 archivos | 2026-11-25 |
| `pnpm lint` | 47 avisos (tope 47, solo baja) | 2026-11-25 |
| `any` escritos a mano (sin `components/ui` ni `routeTree.gen.ts`) | 1 (`CashSessionsHistoryView.tsx`) | 2026-11-22 |
| `pnpm e2e` (Playwright) | **36 en verde contra el backend real** (`confirm-dialog` falló una vez en una tanda anterior y pasa solo) (base de desarrollo `pos_store`), incluidos el filtro de existencias, «Buscar» con Enter, el foco del POS, la vista por documentos, crear con variantes y la importación por Excel | 2026-11-25 |

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

**Hecho el 2026-11-25 (sin comitear al escribir esto):**
- **Crear con variantes en una sola pantalla** (ya no hay asistente de 3 pasos): datos del producto, opciones y tabla de variantes que se arma sola al marcar opciones y **conserva lo escrito** (`syncRows`). SKU derivados de los valores (`PLY-NEGRO-M`), avisos por fila (SKU repetido, venta en 0, bajo el costo, stock con costo 0), Enter baja de fila, se puede pegar desde Excel, y una combinación que no vendes se quita (y se restaura). Reglas en `domain/rules/variable-wizard.ts`; estado en `useVariableProductForm`.
- **Importar productos con variantes desde Excel** (`VariantImportModal`, botón en esa pantalla): lectura tolerante de columnas (`domain/rules/variants-import.ts`), informe por fila antes de guardar y plantilla descargable con ejemplos.
- Vista por documentos en Movimientos (lista de documentos con filtros; se comiteó el 2026-11-25).
- Los atributos se agregan a demanda (buscador + máximo 4 por producto): con decenas de atributos en el catálogo ya no se despliegan todos. Los errores de precios y stock solo se pintan tras el primer intento de guardar.
- `products-wizard.spec.ts` (reescrito) y `products-import-variants.spec.ts` (nuevo) pasan contra el backend real.
- Editar un producto con variantes: cada fila de la tabla muestra qué falla (SKU vacío o repetido, precios negativos) y «Guardar» ya no cierra la ventana si algo no se guardó; «Nueva variante» exige todos los atributos del producto, avisa si la combinación o el SKU ya existen y propone el SKU a partir del SKU base y las opciones (`domain/rules/variant-edit.ts`).
- Impresoras (2026-11-26): la de tickets y la de etiquetas ya no comparten puerto. El navegador da una sola lista de impresoras vinculadas al sitio y antes cada servicio tomaba «la primera» o «la última»: al vincular solo la de etiquetas, el POS creía tener impresora de tickets y mandaba el ticket por ahí. Ahora cada rol recuerda cuál es la suya (`printing/domain/rules/port-assignment.ts`, `port-registry.ts`; se identifica por fabricante/modelo USB o servicio Bluetooth). Las de tickets vinculadas antes siguen funcionando; la de etiquetas hay que vincularla una vez en «Mi impresora». Con dos impresoras idénticas y sin datos distintos en el navegador (p. ej. dos Bluetooth iguales) se distinguen solo por el orden: no probado con hardware real.
- Escáner con la cámara (2026-11-26): botón junto a la búsqueda del POS (continuo: agrega al carrito y sigue; si hay varias coincidencias se cierra para elegir), del listado de productos (busca al instante), del ingreso de compras (suma el producto o una unidad más) y de los formularios de entradas/salidas y conteo de inventario. Usa el lector nativo del navegador (`BarcodeDetector`, Chrome en Android) y, si no hay, ZXing (iPhone, iPad, computadora), que se descarga solo al abrir el escáner (~120 KB comprimido). Exige HTTPS (o localhost). Código en `shared/` (`useBarcodeScanner`, `BarcodeScannerDialog`, `ScanButton`). El escáner muestra sobre la cámara qué se agregó o si el código no existe (borde verde/rojo, pitido distinto, lista de las últimas lecturas con «×2»), deja teclear un código que no lee, ofrece zoom y linterna si el dispositivo los tiene, recuerda la cámara elegida y mantiene la pantalla encendida. Probado con una cámara falsa de Chromium; **sin probar con un teléfono real**.
- Etiquetas adhesivas con código de barras (2026-11-26): un solo diseño (`printing/domain/rules/label-layout.ts`, escala con el tamaño y la resolución 203/300 dpi) dibujado en un canvas; esa misma imagen es la vista previa, lo que se manda a la impresora (TSPL `BITMAP` o ZPL `^GFA`) y lo que se imprime por el controlador del sistema. Se quitó el modo de texto con fuentes de la impresora (salía distinto a la vista previa). La etiqueta de una variante lleva su combinación (`M · Rojo`); una variante sin SKU ya no genera etiqueta. Diálogos rediseñados («Imprimir etiquetas» y «Mi impresora de etiquetas»: tamaños comunes, girar, resolución, conectar, etiqueta de prueba, calibrar rollo). **Pendiente de probar con la impresora real** tras el cambio (la polaridad del bitmap TSPL y la calibración).
- Orden de las opciones: en el catálogo de atributos, el botón «Ordenar las opciones» abre un diálogo con flechas ↑ ↓, «Ordenar como tallas» (XS…3XL o números) y «A–Z»; el orden vale para crear, importar, editar y el selector de variante (el editor de un producto también ordena sus variantes así). Reglas en `domain/rules/option-order.ts`.
- Catálogo de atributos: se pueden eliminar atributos y opciones (con confirmación; el servidor rechaza los que usa alguna variante). Los e2e de variantes ya borran el atributo que crean; las categorías «E2E …» siguen acumulándose (no hay borrado de categorías). El producto simple y su importador no se tocaron.

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
