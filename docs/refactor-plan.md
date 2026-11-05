# Refactor de la web: análisis, arquitectura objetivo y plan

Documento de arranque para quien retome el trabajo del front sin haber visto la sesión de análisis. Las reglas de trabajo están en `../CLAUDE.md`; el contrato del backend, en `../../pos-store/docs/error-codes.md` y `../../pos-store/architecture_guide.md`.

## 1. Estado medido al inicio (antes de refactorizar)

Stack: React 19 · Vite 8 · TanStack Router (rutas por archivos) y Query · Zustand · zod · react-hook-form · Tailwind 4 · Vitest · oxlint · TypeScript 6 estricto (`noUncheckedIndexedAccess`).

- 35.292 líneas de TS/TSX (sin `components/ui/` ni `routeTree.gen.ts`) en 12 módulos. `products` 11.022, `sales` 8.534, `purchases` 2.675, `users` 2.007, `cash-sessions` 1.936, `reports` 1.611, `dashboard` 1.362, `auth` 1.316, `customers` 830, `cash-registers` 795, `media` 539, `branches` 323.
- Base verde: `pnpm typecheck` limpio, **22 tests** en 2 archivos (`usePOSCart.test.ts`, `customer.mapper.test.ts`), lint con tope de 265 avisos (`oxlint --max-warnings 265`).
- El árbol de trabajo tiene **~24 archivos modificados sin commit** (Vitest, config de lint, `ci.yml`, tests, `tsconfig.app.json`, arreglos sueltos). No se han commiteado por decisión del dueño.

### Lo que ya está bien
Carpetas por funcionalidad con `services → types (DTO) → mappers → entities → hooks`; datos del servidor con `useQuery` + mapper en `select`; zod en formularios de productos; herramientas modernas y TS estricto.

### Problemas (con evidencia)
| # | Problema | Evidencia |
|---|---|---|
| 1 | El cliente HTTP **descarta el contrato de errores** | `src/lib/apiClient.ts` lanza `new Error(message)`: se pierden `code`, `details`, `requestId`. **0 usos de `code`**; 33 sitios muestran `message` |
| 2 | **Defecto real hoy** | 3 sitios leen `err.response?.data?.message` (estilo axios) pero el cliente usa `fetch`: nunca existe, así que los mensajes del backend no se ven (p. ej. `useCustomerMutations`) |
| 3 | Acoplamientos circulares | `apiClient` importa `toast` y `useAuthStore`; el store importa servicios que usan `apiClient`; los mappers leen `useAuthStore.getState()` (zona horaria); `sale.mapper` importa `TicketSaleData` desde un componente |
| 4 | Dinero frágil | 190 `toFixed`; entidades con textos ya formateados (`totalFormatted`, 20 casos); símbolo `$` casi fijo (solo 6 usos de `currencySymbol`) |
| 5 | Reglas de negocio en la UI | `POSView.tsx` (752 líneas, 24 `useState`) repite la asignación de pagos que el backend ya hace; `usePOSCart` (290) mezcla reglas del carrito con `toast` |
| 6 | Componentes gigantes | `ProductVariableEditModal` 1164, `CashSessionAuditModal` 817, `POSView` 752, `ProductListTab` 719, `CashRegistersView` 625, `TenantSettings` 606, `CierreModal` 594, `CostSalesTab` 593 |
| 7 | **202 `any`** | `ProductVariableEditModal` 20, `POSView` 15, `ProductDetailModal` 13, `ProductListTab` 11, `sales.service` 10… |
| 8 | Seguridad del navegador | Access **y refresh token** persistidos en `localStorage` (`aura-pos-auth`); solo 7 de 26 rutas con `beforeLoad` y 2 con permisos; 4 componentes llaman a `apiClient` directamente (`TenantSettings`, `CostSalesTab`, `ProductSalesTab`, `ValuedInventoryTab`) |
| 9 | Cobertura casi nula | Sin tests de cliente HTTP, auth, arqueo ni mappers de dinero |
| 10 | Desfase con el backend nuevo | No envía `clientRequestId`; pasa SKU a mayúsculas en 13 sitios (ahora lo hace el servidor); no conoce `TOO_MANY_ATTEMPTS` (429), `PERMISSION_ESCALATION`, `BRANCH_ACCESS_DENIED` |
| 11 | Impresión | Servicios de impresora térmica y de etiquetas guardan config en `localStorage`, sin interfaz sustituible; `NO_PRINTER_CONFIGURED` se detecta comparando `err.message` |

## 2. Arquitectura objetivo: Clean / Hexagonal en cuatro capas

Decisión del dueño: **usar `application`** (casos de uso y puertos en su propia capa). Dependencias **solo hacia adentro**: `presentation → application → domain`, y `infrastructure → application/domain` (implementa los puertos). `domain` no importa nada del resto, ni React, ni `fetch`, ni Zustand.

```
src/
  shared/                              lo transversal (no es un módulo de negocio)
    domain/        Money, Result, errores base, normalizeSku…
    application/   puertos comunes: SessionStore, Clock, Storage
    infrastructure/ http-client (ApiError), storage local, logger
    presentation/  ui/ (shadcn), catálogo code → mensaje, hooks comunes
  modules/<modulo>/
    domain/
      entities/            Sale, CartItem, Product… (sin formato ni DTO)
      rules/               funciones PURAS: cart.ts, cash-closing.ts, pricing.ts
      errors/              errores de dominio
    application/
      ports/               INTERFACES: SaleRepository, Printer, …
      use-cases/           checkout.use-case.ts, open-cash-session.use-case.ts…
    infrastructure/
      http/                llamadas a la API (usan el HttpClient)
      dtos/                forma exacta del backend (+ zod en el borde)
      mappers/             DTO → entidad
      repositories/        SaleHttpRepository implements SaleRepository (y luego Local, para offline)
      dependencies.ts      raíz de composición del módulo: el único sitio que enchufa todo
    presentation/
      components/, screens/
      hooks/               react-query + casos de uso
      view-models/         lo que la pantalla necesita ya preparado
      mappers/             entidad → texto de pantalla (formatos, moneda de la tienda)
  routes/                  rutas de TanStack: adaptadores finos (guardas con permisos), sin lógica
```

**Dónde va cada cosa:** Entities, reglas puras y errores → `domain`. Casos de uso e **interfaces de repositorio (puertos)** → `application`. Implementaciones de repositorio, datasources, DTOs, mappers DTO→entidad → `infrastructure`. ViewModels, hooks, vistas, componentes, mappers entidad→pantalla, `toast` → `presentation`.

**Pragmatismo:** casos de uso completos donde hay reglas y dinero (**ventas, caja, productos, compras, auth**). En administración sencilla (clientes, sucursales, multimedia) basta repositorio + hook, sin una clase por operación.

**Offline (más adelante):** los repositorios son puertos; un `SaleLocalRepository` y una cola de operaciones pendientes con `clientRequestId` se enchufan en `dependencies.ts` sin tocar casos de uso ni pantallas. No se implementa ahora, solo se deja preparado.

**Se hará cumplir con una regla automática** (como `architecture.spec.ts` del backend): `domain` no puede importar `react`, `@tanstack/*`, `zustand`, `sonner` ni nada de `infrastructure`/`presentation`; `application` no importa `infrastructure` ni `presentation`.

Ejemplo (cobrar): `domain/rules/allocate-payments.ts` (reglas puras) · `application/ports/sale.repository.ts` (`createSale(...)`) · `application/use-cases/checkout.use-case.ts` (valida y llama al puerto con `clientRequestId`) · `infrastructure/repositories/sale-http.repository.ts` (`POST /sales`) · `presentation/hooks/useCheckout.ts` (decide el `toast`) · `POSView.tsx` solo dibuja.

## 3. Plan por etapas (cada una se puede probar y entregar sola)

| Etapa | Contenido | Hecho cuando |
|---|---|---|
| **0 · Línea base** | Decidir qué hacer con los archivos sin commit; **prueba real contra el backend** (abrir caja → vender → devolver → cerrar) anotando lo que se rompa | Hay una lista de fallos reales y el árbol de trabajo está ordenado |
| **1 · Cimientos (`shared`)** | `HttpClient` con `ApiError` (`status`, `code`, `message`, `details`, `requestId`); catálogo **`code → mensaje en español`** (los ~100 códigos de `pos-store/docs/error-codes.md`); `Money` y formato por moneda de la tienda; cliente sin `toast` ni store (callbacks `onUnauthorized` y proveedor de token inyectados, rompe el ciclo); puerto de almacenamiento; arreglar el defecto nº 2; regla automática de dependencias | Ningún `err.response`; errores con `code` en un test; el cliente no importa Zustand ni `sonner` |
| **2 · `auth` (primer corte completo)** | Separar el store (sesión / permisos / selección de sucursal); casos de uso login, PIN, refresh, logout, perfil; `beforeLoad` con permisos en **todas** las rutas; manejo del 429 con espera; decisión sobre dónde guardar tokens | Patrón de referencia para los demás módulos |
| **3 · `sales` + `cash-sessions` + `cash-registers`** | Carrito y arqueo como reglas puras con tests (paridad con las del backend); `checkout` con `clientRequestId`; trocear `POSView`, `CierreModal`, `CashSessionAuditModal`; puertos de impresión | Flujo de venta completo sin lógica en componentes |
| **4 · `products`** | Trocear `ProductVariableEditModal` y `ProductListTab`; zod en el borde; errores `SKU_TAKEN` / `BASE_SKU_TAKEN`; SKU sin normalizar en el cliente | Ningún componente > 400 líneas |
| **5 · `purchases`, `reports`, `users`** | Reportes a hooks (sin `apiClient` en componentes); en usuarios, ocultar/desactivar permisos y roles que el actor no puede conceder (`PERMISSION_ESCALATION`) | |
| **6 · Resto y cierre** | `customers`, `branches`, `dashboard`, `media`; 0 `any`; lint a 0 avisos; tests por capa | `grep ": any"` = 0 |

Cada etapa termina con: typecheck + lint + tests en verde y resumen (qué cambió, qué se verificó, qué no se cubrió, qué decide el dueño).

## 4. Decisiones pendientes del dueño (preguntar al empezar)

1. **Tokens:** lo ideal es refresh en cookie `httpOnly` (exige cambios coordinados en backend y CORS). Alternativa intermedia propuesta: access token solo en memoria + refresh en `localStorage`. ¿Cuál ahora?
2. **Mensajes de error:** propuesta: catálogo propio `code → mensaje` en `shared`; el `message` del backend solo como respaldo. ¿Textos que quiera revisar?
3. **Pruebas de punta a punta:** recomendado un recorrido mínimo con Playwright (login, vender, cerrar caja) para no romper al refactorizar. ¿Se incluye?
4. **Moneda:** hoy todo asume `$`. ¿Habrá tiendas con otra moneda? Sube la prioridad de `Money`.
5. **Offline:** ¿cuándo se implementará? Define cuánto invertir ahora en la cola de operaciones.
6. **Impresoras:** ¿qué modelos? Web Serial/USB solo funciona en Chrome/Edge; ¿hay clientes con otro navegador?
7. **Orden:** recomendado cimientos → auth → ventas; si prefiere ver resultado visible antes, adelantar ventas justo tras los cimientos.

## 5. Lo que el backend ya garantiza (para el front)

- **Errores:** `{ statusCode, code, message, details?, path, timestamp, requestId }`; decidir por `code`. 429 `TOO_MANY_ATTEMPTS` (login), 403 `PERMISSION_DENIED` / `BRANCH_ACCESS_DENIED` / `PERMISSION_ESCALATION`, 409 `SKU_TAKEN` / `BASE_SKU_TAKEN` / `CASH_REGISTER_BUSY`…
- **SKU** siempre en MAYÚSCULAS (guardado y devuelto); las búsquedas aceptan cualquier capitalización; el SKU base es único.
- **`POST /sales`** acepta `clientRequestId` (8–64 caracteres): generarlo **por intento de cobro** y reutilizarlo solo al reintentar esa venta; hoy opcional, **obligatorio en el futuro**. Sin `customerId` se asigna el CONSUMIDOR FINAL (`9999999999999`), que no se puede borrar.
- **Pagos:** el servidor guarda de cada pago solo lo que cubre el total (el vuelto no es ingreso).
- **Sucursales:** quien no es propietario solo ve lo de sus sucursales; un listado cruzado se filtra solo, una consulta ajena da 403.
- **Permisos:** nadie concede más de lo que tiene; la UI debe reflejarlo.
- **Auth:** login por `tenantSlug` + usuario/correo + contraseña, o PIN; refresh token rotatorio (cada refresh invalida el anterior).
- Códigos completos: `pos-store/docs/error-codes.md`. Arquitectura y reglas del backend: `pos-store/architecture_guide.md`.
