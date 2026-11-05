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

La **sucursal y la caja seleccionadas** son estado de trabajo (`selectedBranchId`, `selectedCashRegisterId`), no parte de la sesión.

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
| Almacenamiento | `localStorage`, todo | SecureStore, 5 claves | detrás de un puerto; ver abajo |

## Almacenamiento
- **Web hoy:** `localStorage` con formato versionado (`version: 1`) y `migrate` desde el formato plano anterior (`src/modules/auth/hooks/auth-persistence.ts`, con tests). Guarda `accessToken`, `refreshToken`, `user`, `tenant` y las dos selecciones. El perfil y la tienda se **revalidan al arrancar** (`revalidateSession`).
- **Web futuro:** con el refresh en cookie `httpOnly`, los tokens salen del store y solo quedan `user`, `tenant` y selecciones.
- **Móvil:** los tokens siguen en SecureStore; `user` y `tenant` pueden ir en almacenamiento no secreto.

## Comportamiento acordado
- Solo un **401** (sesión inválida incluso tras intentar renovarla) cierra la sesión. Una caída de red o un 500 **no**.
- El cierre de sesión conserva `tenant` (la pantalla de login lo usa) y borra tokens, `user` y selecciones.

## Pendiente en el móvil (Fase 4)
Renombrar `activeTenant` → `tenant`; quitar `tenantSlug` e `isAuthenticated` como campos; añadir `cashRegisters` al perfil; no llamar a `clearSession` ante errores de red al renovar; centralizar el almacenamiento tras un puerto (hoy son 5 claves manuales).
