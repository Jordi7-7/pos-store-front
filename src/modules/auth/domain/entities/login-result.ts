/**
 * Resultado de iniciar sesión (con usuario/contraseña o con PIN). Un fallo lleva el `code` del
 * backend (o del cliente) y un mensaje ya listo para mostrar: así la pantalla distingue
 * "credenciales incorrectas" de "demasiados intentos", "usuario deshabilitado" o "sin conexión".
 */
export type LoginResult = { ok: true } | { ok: false; code: string; message: string };

/** El perfil no se pudo cargar tras autenticar (red caída, 500…): no es un error de credenciales. */
export const PROFILE_UNAVAILABLE = 'PROFILE_UNAVAILABLE';
