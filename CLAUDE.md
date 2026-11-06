# CLAUDE.md — web `pos-store-front`

Contexto y reglas para cualquier sesión de trabajo en la web. **Léelo entero antes de cambiar código**, y después `docs/refactor-plan.md` (análisis, arquitectura objetivo, plan por etapas y decisiones pendientes). El backend ya está terminado y es la fuente de verdad del contrato: `../pos-store/CLAUDE.md`, `../pos-store/architecture_guide.md`, `../pos-store/docs/error-codes.md`.

## Quién y cómo
- El dueño habla **español**: responde en español; textos de interfaz y comentarios en español; **commits en inglés** (convencionales).
- SaaS POS/ERP con **clientes reales en producción**: no romper el flujo de venta/caja. Explica en lenguaje llano, recomienda en vez de listar opciones, y di siempre qué se verificó y qué no.
- Cierra cada bloque con: qué cambió, qué se verificó (cifras reales), qué no se cubrió, qué decide el dueño.

## Reglas de trabajo (no negociables)
1. **No hagas `git commit` ni `git push` salvo petición expresa.** Hay ~24 archivos modificados sin commit de una fase anterior (Vitest, lint, CI): no los toques ni los comitees sin preguntar. Cuando pida commit: por temas, mensajes en inglés.
2. **Secretos:** los `.env` están ignorados por git; no imprimas ni pegues sus valores. La web solo usa `VITE_API_URL` y `VITE_IDLE_TIMEOUT_MINUTES` (no secretos).
3. **El backend lo arranca el dueño a mano** desde su terminal (puerto 3000, `VITE_API_URL=http://localhost:3000`); no lo arranques ni lo detengas tú. Si necesitas verlo funcionando, pídeselo.
4. No reabras las decisiones tomadas sin motivo nuevo.

## Decisiones vigentes
- **Arquitectura: Clean/Hexagonal en cuatro capas** — `domain`, `application` (casos de uso + puertos), `infrastructure`, `presentation` — por módulo, con `src/shared/` para lo transversal. Dependencias solo hacia adentro. Detalle y árbol de carpetas en `docs/refactor-plan.md` §2. La app móvil usa tres capas (casos de uso dentro de `domain`); se alineará después, en la Fase 4.
- **Pragmatismo:** casos de uso completos donde hay reglas y dinero (ventas, caja, productos, compras, auth); administración sencilla = repositorio + hook.
- **Errores por `code`**, nunca parseando `message`. Un catálogo `code → mensaje en español` en `shared`.
- **Cero `any`**, lint estricto; la deuda baja, no sube (`oxlint --max-warnings` es un tope que se reduce).
- **Sesión = tokens + `user` + `tenant` y nada más**; lo demás se deriva (selectores `useTenantId`, `useTimezone`…). La tienda no tiene valores por defecto: si falta un dato se exige. Contrato común con el móvil en `docs/auth-session-contract.md`.
- **Dinero con `Money`** (`src/shared/domain/money.ts`, copia del backend: céntimos enteros, mitad hacia arriba). Redondear con `roundMoney(x)`, nunca `Number(x.toFixed(2))`; mostrar con `formatMoney(x)` (`useSession`), que usa la moneda y el idioma de la tienda. Nada de `$`, `USD` ni `es-EC` fijos (lo vigila `no-hardcoded-tenant-data.test.ts`). Los tickets térmicos (`escpos-builder`, `label-builder`) quedan fuera hasta los puertos de impresión (Etapa 3).
- **Offline** se prepara (repositorios como puertos, `clientRequestId` por intento de cobro) pero no se implementa todavía.
- Stack fijado: TS 6.0.x, pnpm 11, Node 24, React 19, Vite 8.

## Jerarquía de carpetas de un módulo (vigilada por `architecture.test.ts`)
```
modules/<módulo>/
├── domain/                 QUÉ ES el negocio (sin React, sin HTTP, sin estado)
│   ├── entities/           datos del negocio (*.entity.ts) y sus tipos
│   ├── enums/              vocabulario cerrado (estados, métodos…)
│   └── rules/              reglas puras con test (cálculo de precios, arqueo…)
├── application/            QUÉ SE PUEDE HACER
│   ├── ports/              interfaces que el módulo necesita (*.repository.ts, impresora…)
│   ├── use-cases/          un archivo por caso de uso (verbo-sustantivo.ts) + su test
│   └── errors/             errores compartidos por varios casos de uso
├── infrastructure/         CÓMO SE HACE (lo único que conoce HTTP, la impresora, el DTO)
│   ├── repositories/       *.http-repository.ts: implementan los puertos y convierten DTO → entidad
│   ├── dtos/               forma de las respuestas del backend
│   ├── mappers/            DTO → entidad (puros, sin formato de pantalla)
│   └── dependencies.ts     raíz de composición: une repositorios y casos de uso
├── presentation/           CÓMO SE MUESTRA
│   ├── components/         pantallas y piezas de UI
│   ├── hooks/              hooks de vista que llaman a casos de uso/repositorios
│   ├── stores/             estado de cliente (zustand), si el módulo lo necesita
│   └── view-models/        entidad → textos de pantalla (moneda, fechas, etiquetas)
└── index.ts                API pública del módulo
```
El núcleo compartido (`src/shared/`) sigue la misma lógica: `domain/{value-objects,enums,rules}` (`Money`, `PaymentMethod`, formato de importes, validación de entradas), `infrastructure/http` (`HttpClient`, `ApiError`) y `presentation/{components,stores,formatting}` (formateadores de la tienda, catálogo `code → mensaje`, paginación).

Regla de lectura: **domain no conoce a nadie; application solo conoce a domain; infrastructure implementa lo que application pide; presentation usa application a través de `dependencies.ts`.** `printing` añade `infrastructure/escpos/` y `infrastructure/printers/` (generador ESC/POS e impresora USB).

## Patrón por módulo (referencia: `sales`, `cash-sessions`, `cash-registers`, `printing`, `auth`, `branches`, `customers`, `media`)
- **Datos:** la vista → hook (`presentation/hooks`) → **repositorio** (interfaz en `application/ports`, implementación `*HttpRepository` en `infrastructure`, que convierte DTO → entidad) o **caso de uso** (`application`) cuando hay reglas. Los hooks obtienen el repositorio/caso de uso de `infrastructure/dependencies.ts` (raíz de composición); **nunca** importan mappers, DTO ni clases HTTP (lo vigila `architecture.test.ts`).
- **Entidades puras:** solo datos del negocio. Los textos de pantalla (importes con moneda, fechas con zona horaria, etiquetas) se construyen en **view-models** (`presentation/view-models`, funciones puras que reciben `useFormatters()`), nunca en la entidad ni en el mapper. Una regla impide campos `*Formatted`/`*Label` en `domain`.
- **Dirección entre módulos** (vigilada): `printing` (tickets, impresora) no depende de ventas ni de turnos; `cash-sessions` depende de `printing`, nunca de `sales`; `sales` usa a ambos. El vocabulario común (`PaymentMethod`, `SaleStatus`) vive en `shared/domain/payments.ts`. No se permiten ciclos entre módulos (el heredado `media ↔ products` desapareció al mover la paginación a `shared`).
- Los módulos aún no migrados (`products`, `purchases`, `reports`, `users`, `dashboard`) conservan `components/hooks/services` y mappers que formatean; se migran por etapas.

## Reglas del código
- `domain` no importa `react`, `@tanstack/*`, `zustand`, `sonner`, `fetch`, ni nada de `infrastructure`/`presentation`. `application` no importa `infrastructure` ni `presentation`. Lo hace cumplir `src/architecture.test.ts` (reglas en `src/test/layer-rules.ts`; también vigila `infrastructure` → sin `presentation`, UI ni estado). Hallazgos pendientes: `docs/hallazgos-abiertos.md`.
- La **lógica de negocio no vive en componentes ni en hooks de UI**: va en `domain/rules` (puras, con test) o en un caso de uso. `toast` solo en `presentation`.
- Un componente > ~300 líneas se divide en contenedor (hook/view-model) + piezas de UI. Nada de `apiClient` ni `fetch` en componentes.
- **Todo cambio de reglas de dinero o de caja lleva test** (Vitest). Las reglas puras (carrito, arqueo, asignación de pagos) deben tener paridad con las del backend (`../pos-store/src/modules/sales/domain/services/`).
- **SKU:** el servidor lo normaliza (MAYÚSCULAS); el cliente no debe reimplementarlo salvo para mostrar.
- Rutas (`src/routes`, TanStack): adaptadores finos; **toda ruta protegida con `beforeLoad` y permisos**.
- Permisos: el catálogo vive en el backend (`APP_PERMISSIONS`); la UI debe ocultar o desactivar lo que el actor no puede conceder (`PERMISSION_ESCALATION`).

## Comandos
```bash
pnpm dev            # http://localhost:5173 (el backend debe estar en el 3000)
pnpm typecheck && pnpm lint && pnpm test      # = pnpm verify
pnpm build
pnpm e2e            # Playwright contra el backend real (puerto 3000); credenciales en .env.e2e.local (ignorado por git)
```
Línea base al empezar el refactor: **typecheck limpio · 22 tests · lint con tope de 265 avisos · 202 `any`**. Si una cifra empeora, algo se rompió.

## Trampas del entorno
- **zsh** expande comodines: entrecomilla o usa `Grep`/`find`. **macOS no tiene `timeout`**: `perl -e 'alarm 240; exec @ARGV' <comando>`.
- Las herramientas `Edit`/`Write` exigen haber leído el archivo antes en la sesión.
- `src/routeTree.gen.ts` es **generado** por el plugin del router: no lo edites.
- `components/ui/` es de shadcn: no se refactoriza.
- Los tokens se guardan hoy en `localStorage` (`aura-pos-auth`); es un riesgo conocido a resolver en la Etapa 2.

## Estado actual de las etapas
Ver la tabla de `docs/refactor-plan.md` §3. **Hechas:** Etapa 0 (línea base y e2e), Etapa 1 (HttpClient/`ApiError`, `Money`, reglas de capas), Etapa 2 (sesión adelgazada, guardas de ruta con permisos en todas las pantallas —tabla única `ROUTE_PERMISSIONS`—, errores de login por `code`). **Etapa 3 en curso:** hechos `clientRequestId` por intento de cobro, arqueo y carrito/precios/pagos como reglas puras con paridad con el backend (`modules/sales/domain/rules`, `modules/cash-sessions/domain`), y los primeros **casos de uso con puertos** (`sales/application/checkout.ts`, `cash-sessions/application/close-cash-session.ts`; adaptadores y raíz de composición en `infrastructure/`). El resto de módulos conserva la estructura antigua `components/hooks/services` y se migra por etapas. Tickets ESC/POS con la moneda de la tienda y puerto `TicketPrinter`; `POSView` y `CierreModal` troceados. **Falta:** `CashSessionAuditModal` y `useExchangeReturn`, catálogo `code → mensaje` completo; después Etapa 4 (`products`) y 5. Pendiente aparte: tokens en cookies `httpOnly` (requiere endpoints web en el backend). Hallazgos abiertos: `docs/hallazgos-abiertos.md`.
