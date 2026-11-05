# Modelo de sesión común (web y móvil)

Decidido el 2026-11-05 tras comparar el store de la web (`pos-store-front`) con el de la app móvil (`pos-store-mobile/src/shared/infrastructure/auth/auth.store.ts`). La web ya lo implementa; el móvil lo adoptará en la Fase 4.

## Regla de oro
Una sesión son **tres cosas y nada más**: `tokens`, `user` (perfil) y `tenant` (tienda). Todo lo demás se **deriva**, no se guarda:

| Dato | Cómo se obtiene |
|---|---|
| ¿Autenticado? | `accessToken && user && tenant` |
| Id / slug / zona horaria / moneda de la tienda | `tenant.id`, `tenant.slug`, `tenant.timezone`, `tenant.currencyCode` |
| ¿Propietario? / nombre del rol | `user.isOwner` / `roleLabel(user)` |
| Ids de sucursal | `user.branches.map(b => b.id)` |
| Permisos | `hasPermission(user, p)` (propietario o `*` pueden todo) |

La **sucursal y la caja seleccionadas** no son parte de la sesión: viven en un store aparte, el **espacio de trabajo** (ver más abajo).

## Forma
```ts
SessionUser   { id, name, username, email: string|null, isOwner, role: {id,name}|null,
                permissions: string[], branches: {id,name,address?}[], cashRegisters: {id,name,code,branchId}[] }
SessionTenant { id, name, slug, ruc?, logoUrl: string|null, country, currencyCode, currencySymbol, timezone }
```
Todos los campos de la tienda son **obligatorios**: si el backend no manda uno, la sesión no se actualiza (no se inventan valores como `America/Guayaquil` o `USD`). Código en `src/modules/auth/domain/session.ts` y `mappers/session.mapper.ts`.

## Qué se tomó de cada lado
| | Web antes | Móvil hoy | Consenso |
|---|---|---|---|
| Perfil | 8 campos sueltos (`role`, `roleId`, `roleName`, `permissions`, `branchIds`, `cashRegisters`, `timezone`, `user`) | un único objeto `user` | **objeto único `user`** (móvil) |
| Tienda | `publicTenant` + `tenantId` + `tenantSlug` + `timezone` | `activeTenant` + `tenantSlug` | **un único `tenant`**, sin copias |
| `isAuthenticated` | guardado | guardado | **derivado** |
| Estado de carga | `_hasHydrated` (sin uso) | `isLoading` | el de la plataforma (`persist.hasHydrated()` / carga de SecureStore) |
| Lectura en componentes | `useAuthStore()` entero (re-render con cualquier cambio) | — | **selectores** (`useTenantId`, `useTimezone`…) |
| Sucursal elegida | `selectedBranchId` dentro del store de sesión | `useBranchStore`: objeto `Branch` entero + lista `branches` | **store aparte** (`workspace`) con solo ids; el dato se lee del perfil |
| Caja elegida | `selectedCashRegisterId` dentro del store de sesión | no se guarda (se elige al abrir turno) | en el mismo store aparte, validada contra el perfil |
| Almacenamiento | `localStorage`, todo | SecureStore, 5 claves | detrás de un puerto; ver abajo |

## Almacenamiento
- **Web hoy:** `localStorage` con formato versionado (`version: 1`) y `migrate` desde el formato plano anterior (`src/modules/auth/hooks/auth-persistence.ts`, con tests). Guarda solo `accessToken`, `refreshToken`, `user` y `tenant` (clave `aura-pos-auth`). El perfil y la tienda se **revalidan al arrancar** (`revalidateSession`).
- **Web futuro:** con el refresh en cookie `httpOnly`, los tokens salen del store y solo quedan `user`, `tenant` y selecciones.
- **Móvil:** los tokens siguen en SecureStore; `user` y `tenant` pueden ir en almacenamiento no secreto.

## Espacio de trabajo (sucursal y caja elegidas)
Store aparte de la sesión: `src/shared/presentation/stores/workspace.store.ts` (`useWorkspaceStore`), con reglas puras en `src/shared/domain/workspace.ts`. Se separa porque cambia a menudo, no es un dato del servidor y puede quedar inválido (te quitan una sucursal) sin que la sesión cambie.

```ts
Workspace { selectedBranchId: string | null, selectedCashRegisterId: string | null }
```
- **Solo ids.** Del móvil se descarta guardar el objeto `Branch` entero (el nombre quedaba viejo) y la lista `branches` (duplica el perfil): el nombre y la dirección se leen de `user.branches`.
- **`reconcile` tras cargar el perfil:** una sucursal o caja que el usuario ya no puede usar se descarta; si solo hay una opción en el ámbito, se elige sola. La caja debe pertenecer a la sucursal elegida.
- **Cambiar de sucursal borra la caja elegida** (era de la anterior).
- **Cerrar sesión lo borra** (el siguiente usuario no hereda caja ni sucursal).
- Clave `aura-pos-workspace` (web, `localStorage`). No es secreto: en el móvil puede ir fuera de SecureStore.
- `selectedBranchId = null` significa "todas las sucursales" (propietario).

## Comportamiento acordado
- Solo un **401** (sesión inválida incluso tras intentar renovarla) cierra la sesión. Una caída de red o un 500 **no**.
- El cierre de sesión conserva `tenant` (la pantalla de login lo usa) y borra tokens, `user` y selecciones.

## Pendiente en el móvil (Fase 4)
Reemplazar `branch.store.ts` por `workspace.store.ts` (solo ids, sin `branches`, con la caja y `reconcile`); renombrar `activeTenant` → `tenant`; quitar `tenantSlug` e `isAuthenticated` como campos; añadir `cashRegisters` al perfil; no llamar a `clearSession` ante errores de red al renovar; centralizar el almacenamiento tras un puerto (hoy son 5 claves manuales).
