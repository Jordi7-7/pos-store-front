# Auditoría de la web (noviembre 2026)

Qué se revisó: código (`src`), dependencias (`pnpm audit --prod`), cabeceras de `nginx.conf`, tamaños de `dist`, y las pruebas. Qué **no** se revisó: accesibilidad real con lector de pantalla, rendimiento medido (Lighthouse), uso en tablet/móvil, ni el despliegue en producción.

## Estado de calidad (cifras reales)
| Medida | Valor |
|---|---|
| `any` fuera de `components/ui` (shadcn) | **0** (antes ~200) |
| Avisos de lint | 51 (tope vigilado en `package.json`) |
| Tests unitarios (Vitest) | 398 |
| Pruebas e2e (Playwright, contra el backend real) | 22 |
| `typecheck` (`pnpm typecheck` = `tsc -b`) | limpio |
| Módulos con la estructura de capas vigilada por test | 12 de 12 |

## Hallazgos de seguridad (de mayor a menor)

1. **Tokens en `localStorage` (alto) — RESUELTO.** Antes `aura-pos-auth` guardaba `accessToken` y `refreshToken`; cualquier XSS los leía. Ahora el refresh token va en una cookie `HttpOnly; SameSite=Strict` y el de acceso solo en memoria (ver "Plan de cookies", implementado).
2. **`xlsx` 0.18.5 (alto) — RESUELTO.** Ahora SheetJS 0.20.3 desde `cdn.sheetjs.com` (el `pnpm-lock.yaml` fija su hash). El texto original: Prototype pollution y ReDoS al leer Excel; el paquete de npm no recibe parches (los arreglos están en SheetJS ≥ 0.20.2, que se instala desde su propio CDN). La web lee archivos que sube el usuario (productos, compras). Opciones: pasar a SheetJS 0.20.x desde su CDN, o a otra librería. Decisión pendiente.
3. **Dependencias de desarrollo en `dependencies` (medio) — RESUELTO** (`shadcn` y `@types/jsbarcode` pasaron a `devDependencies`). El texto original: `shadcn` (un CLI) está como dependencia de producción y arrastra **31 de los 77 avisos** (incluida la única crítica). No se empaqueta en la web, pero ensucia la auditoría; se mueve a `devDependencies`. Igual `@types/*`.
4. **`zod` < 4.6.6 (alto) y `@tanstack/react-router` (moderado) — RESUELTO** (zod 4.6.7, router 1.170.46, y `overrides` para `fast-uri` y `seroval`; `pnpm audit --prod` da 0 avisos, antes 77). Actualizaciones menores; hacer con tests.
5. **Sin Content-Security-Policy (medio) — RESUELTO** (`security-headers.conf`, incluido en cada `location` porque nginx no hereda `add_header` en los que definen los suyos: antes las cabeceras de seguridad ni siquiera llegaban a `index.html`). Verificado con un nginx como el de producción: 12 e2e en verde, sin violaciones. Sin verificar: impresión de tickets. El texto original: `nginx.conf` no la manda; `X-XSS-Protection` está obsoleta y `Referrer-Policy` es la más permisiva. HSTS debe ponerse donde termina TLS (el Caddy). Propuesta: CSP `default-src 'self'` + `img-src 'self' data: https:` (las imágenes vienen de un almacenamiento externo) + `connect-src 'self'` con el origen del API, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (permitir `usb`/`serial` solo para la impresora).
6. **Impresión de informes (corregido).** Los tres informes escribían nombres de clientes y productos en HTML sin escapar; ahora todo se escapa (`escapeHtml`, con tests).
7. **XSS directo.** No hay `innerHTML`, `dangerouslySetInnerHTML`, `eval` ni `document.write` fuera de la impresión ya corregida.

## Defectos funcionales encontrados al tipar
- **Etiquetas de variante borradas (corregido).** El mapper descartaba las etiquetas y el listado no las manda: el editor de producto simple abría sin etiquetas y, al guardar, dejaba la variante sin ninguna. Ahora se leen del detalle y no se tocan hasta que cargan. e2e `products-tags.spec.ts` (falla con el código anterior).
- **NaN en cantidades del Excel de compras (corregido).** Una cantidad ilegible pasaba la validación.

## Rendimiento (solo tamaños, sin medir tiempos)
`index` 464 KB, `xlsx` 425 KB (carga perezosa), `dashboard` 393 KB (gráficas), `products` 377 KB, `pos` 193 KB. Hay división por rutas. Pendiente medir gzip y Lighthouse.

## Robustez
- Sin pantalla de error propia: si un componente falla al dibujar, el router muestra su mensaje por defecto, sin estilo ni botón de reintentar. Conviene un `defaultErrorComponent`.
- 37 `console.error` en `src` (revisar que no vuelquen datos de clientes en producción).
- `luxon` solo se usa en un archivo y `date-fns` en seis: una de las dos sobra.

## Plan de cookies (sesión web) — implementado

Implementado en `pos-store` (`/auth/web/*`, commits `199dc59` y `403ab3f`) y en la web. Decisiones del dueño: todos vuelven a iniciar sesión una vez; backend primero y después la web.

**Diseño recomendado:** el refresh token vive en una cookie `httpOnly`; el access token (corto) vive solo en memoria y se pide al cargar la página.

Backend (`pos-store`), endpoints nuevos para la web (los de móvil no cambian):
- `POST /auth/web/login`, `POST /auth/web/pin-login`: ejecutan los mismos comandos; ponen la cookie `pos_rt` (`HttpOnly; SameSite=Strict; Secure` en producción; `Path` configurable) y devuelven el access token y el usuario **sin** el refresh token.
- `POST /auth/web/refresh`: lee la cookie, rota el token (la rotación y la detección de reutilización ya existen) y reemplaza la cookie.
- `POST /auth/web/logout`: revoca la sesión y borra la cookie.
- Contra CSRF: `SameSite=Strict` + exigir una cabecera propia (`X-Requested-With`) en refresh/logout (obliga a preflight CORS, que un sitio ajeno no pasa) + CORS solo con los orígenes listados y `credentials: true`.
- No hace falta tocar el guard de las demás rutas: siguen usando `Authorization: Bearer`.

Web (`pos-store-front`): `HttpClient` con `credentials: 'include'`; el store deja de persistir tokens (solo usuario y tienda); al arrancar llama a `/auth/web/refresh`; login por los endpoints nuevos.

Puntos a decidir antes de implementarlo:
1. **Sesiones abiertas al desplegar:** los usuarios con tokens en `localStorage` tendrán que volver a iniciar sesión una vez (lo más simple y seguro), o se acepta temporalmente el refresh token antiguo en el cuerpo de `/auth/web/refresh` para migrarlos (más código y una puerta que luego hay que cerrar).
2. **Ruta de la cookie en producción:** el Caddy publica la API bajo `/api`, así que la cookie debe tener `Path=/api/auth/web`; se configura por variable de entorno y se documenta en `pos-store/docs/deployment.md`.
3. **Orden de despliegue:** primero el backend (endpoints nuevos, sin romper nada), después la web.
