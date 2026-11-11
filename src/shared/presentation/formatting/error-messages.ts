import { ApiError, CLIENT_ERROR_CODES } from '@/shared/infrastructure/http/api-error';

type Details = Record<string, unknown>;
type Entry = string | ((details: Details, raw: unknown) => string);

const asDetails = (details: unknown): Details => (typeof details === 'object' && details !== null && !Array.isArray(details) ? (details as Details) : {});
const text = (value: unknown): string | null => (typeof value === 'string' && value.trim() ? value.trim() : typeof value === 'number' ? String(value) : null);
const list = (value: unknown): string => (Array.isArray(value) ? value.map(String).slice(0, 5).join(', ') : '');

/**
 * Catálogo `code → mensaje en español`, alineado con `pos-store/docs/error-codes.md`. La interfaz decide el
 * texto siempre por `code`, nunca parseando `message`. Cuando el backend manda datos en `details` (un SKU, una
 * cantidad) el mensaje los usa; si faltan, el texto sigue siendo correcto sin ellos.
 *
 * Quedan fuera adrede los códigos cuyo `message` ya es el dato (`INVALID_REFUND`, `INVALID_SALE_AMOUNTS`,
 * `INVALID_REFERENCE`, `INVALID_MEDIA_URL`): explican un caso concreto que ningún texto fijo puede resumir.
 */
export const ERROR_MESSAGES: Readonly<Record<string, Entry>> = {
  // Del cliente
  [CLIENT_ERROR_CODES.NETWORK_ERROR]: 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.',
  [CLIENT_ERROR_CODES.INVALID_RESPONSE]: 'El servidor respondió algo inesperado. Inténtalo de nuevo.',

  // Genéricos
  BAD_REQUEST: 'La solicitud no es válida. Revisa los datos e inténtalo de nuevo.',
  VALIDATION_FAILED: (_details, raw) => {
    // El backend manda en `details` la lista de mensajes por campo.
    const problems = list(raw);
    return problems ? `Revisa los datos ingresados: ${problems}` : 'Revisa los datos ingresados.';
  },
  UNAUTHORIZED: 'Tu sesión no es válida. Inicia sesión de nuevo.',
  FORBIDDEN: 'No tienes permiso para hacer esto.',
  NOT_FOUND: 'No se encontró lo que buscas.',
  CONFLICT: 'La operación choca con el estado actual. Actualiza la pantalla e inténtalo de nuevo.',
  PAYLOAD_TOO_LARGE: 'El archivo es demasiado grande.',
  TOO_MANY_REQUESTS: 'Demasiadas peticiones seguidas. Espera un momento e inténtalo de nuevo.',
  INTERNAL_ERROR: 'Ocurrió un error en el servidor. Inténtalo de nuevo; si sigue, avisa a soporte.',
  SERVICE_UNAVAILABLE: 'El servicio no está disponible por ahora. Inténtalo en unos minutos.',

  // Sesión y acceso
  TOO_MANY_ATTEMPTS: 'Demasiados intentos fallidos. Espera unos minutos antes de volver a intentarlo.',
  INVALID_CREDENTIALS: 'Credenciales incorrectas o usuario no asignado a esta tienda.',
  INVALID_PIN: 'PIN incorrecto. Intenta de nuevo.',
  USER_DISABLED: 'Tu usuario está deshabilitado. Contacta a un administrador.',
  SESSION_EXPIRED: 'Tu sesión expiró. Inicia sesión de nuevo.',
  AUTH_TOKEN_INVALID: 'Tu sesión no es válida o expiró. Inicia sesión de nuevo.',
  AUTH_TOKEN_MISSING: 'Inicia sesión para continuar.',
  USER_NOT_AUTHENTICATED: 'Inicia sesión de nuevo para continuar.',
  USER_NOT_VALID: 'Tu usuario no puede realizar esta acción.',
  USER_NOT_FOUND: 'Usuario no encontrado.',
  PERMISSION_DENIED: 'No tienes permisos suficientes para realizar esta acción.',
  PERMISSION_ESCALATION: 'No puedes otorgar ni administrar permisos que tú no tienes.',
  INVALID_PERMISSIONS: 'Hay permisos que no son válidos.',
  BRANCH_ACCESS_DENIED: 'No tienes permisos para esta acción en la sucursal seleccionada.',
  BRANCH_REQUIRED: 'Selecciona una sucursal en la barra superior para continuar.',
  TENANT_NOT_FOUND: 'Tienda no encontrada. Verifica la URL.',
  TENANT_SLUG_REQUIRED: 'Falta el identificador de la tienda. Verifica la URL.',
  TENANT_SLUG_INVALID: 'El identificador de la tienda debe tener letras o números.',
  TENANT_SLUG_TAKEN: 'Ese identificador de tienda ya está en uso. Elige otro.',
  TENANT_RUC_TAKEN: 'Ya existe una tienda registrada con ese RUC.',
  ONBOARDING_UNAUTHORIZED: 'No estás autorizado para crear una tienda.',

  // Usuarios y roles
  USERNAME_TAKEN: 'Ese nombre de usuario ya está en uso.',
  USERNAME_REQUIRED: 'El nombre de usuario no puede estar vacío.',
  USERNAME_INVALID: 'El nombre de usuario es obligatorio y debe contener caracteres válidos.',
  EMAIL_TAKEN: 'Ese correo ya está registrado en otra cuenta.',
  PIN_ALREADY_IN_USE: 'Ese PIN ya está en uso por otro usuario.',
  CANNOT_DEACTIVATE_SELF: 'No puedes desactivar tu propia cuenta mientras estás en sesión.',
  OWNER_ONLY_EDITS_SELF: 'Solo el propietario puede modificar su propia cuenta.',
  ROLE_REQUIRED: 'Un usuario debe tener un rol asignado.',
  ROLE_NOT_FOUND: 'Rol no encontrado.',
  ROLE_NAME_TAKEN: 'Ya existe un rol con ese nombre.',
  ROLE_IS_SYSTEM: 'Los roles del sistema no se pueden modificar.',
  ROLE_IN_USE: (d) => {
    const n = text(d.assignedUsers);
    return n ? `No puedes eliminar este rol: tiene ${n} usuario(s) asignado(s). Reasígnalos primero.` : 'No puedes eliminar este rol porque tiene usuarios asignados. Reasígnalos primero.';
  },

  // Sucursales, cajas y turnos
  BRANCH_NOT_FOUND: 'Sucursal no encontrada.',
  BRANCH_NAME_TAKEN: 'Ya existe otra sucursal con ese nombre.',
  CASH_REGISTER_NOT_FOUND: 'Caja registradora no encontrada.',
  CASH_REGISTER_NOT_ASSIGNED: 'No tienes asignada esta caja registradora.',
  CASH_REGISTER_NOT_AUTHORIZED: (d) => {
    const name = text(d.cashRegisterName);
    return name ? `No tienes autorización para operar en la ${name}.` : 'No tienes autorización para operar en esta caja.';
  },
  CASH_REGISTER_BUSY: (d) => {
    const name = text(d.cashRegisterName);
    const by = text(d.openedBy);
    return `${name ? `La ${name}` : 'La caja'} ya tiene un turno abierto${by ? ` (por ${by})` : ''}. Cierra ese turno o elige otra caja.`;
  },
  CASH_REGISTER_INACTIVE: (d) => {
    const name = text(d.cashRegisterName);
    return `${name ? `La ${name}` : 'La caja'} está desactivada y no se puede abrir.`;
  },
  CASH_REGISTER_HAS_OPEN_SESSION: 'No puedes desactivar una caja con un turno abierto. Cierra el turno primero.',
  CASH_SESSION_NOT_FOUND: 'Turno de caja no encontrado.',
  CASH_SESSION_REQUIRED: 'Abre un turno de caja antes de registrar una venta.',
  NO_OPEN_CASH_SESSION: 'No hay un turno de caja abierto en esta sucursal.',

  // Ventas
  SALE_NOT_FOUND: 'Venta no encontrada.',
  SALE_ALREADY_REFUNDED: 'Esta venta ya fue devuelta en su totalidad.',
  IDEMPOTENCY_KEY_REUSED: 'Ese identificador ya se usó en otra venta distinta. Vuelve a intentar el cobro.',
  OFFLINE_REFERENCE_TAKEN: 'Ese número provisional ya lo tiene otra venta. Revisa la venta pendiente.',
  INSUFFICIENT_PAYMENT: 'El monto pagado es menor al total de la venta.',
  CUSTOMER_NOT_FOUND: 'Cliente no encontrado.',
  CUSTOMER_IDENTITY_TAKEN: 'Ya existe un cliente con ese documento.',
  CONSUMER_FINAL_PROTECTED: 'El CONSUMIDOR FINAL es el comprador por defecto de las ventas y no se puede eliminar.',

  // Productos e inventario
  PRODUCT_NOT_FOUND: 'Producto o variante no encontrado.',
  VARIANT_NOT_FOUND: 'Variante no encontrada.',
  SKU_TAKEN: (d) => {
    const skus = list(d.skus) || text(d.sku);
    return skus ? `El SKU ${skus} ya está registrado en otra variante.` : 'Ese SKU ya está registrado en otra variante.';
  },
  BASE_SKU_TAKEN: (d) => {
    const sku = text(d.baseSku);
    return sku ? `El SKU base ${sku} ya lo usa otro producto.` : 'Ese SKU base ya lo usa otro producto.';
  },
  BASE_SKU_REQUIRED: 'El SKU base es obligatorio para un producto con variantes.',
  VARIANTS_REQUIRED: 'Un producto con variantes debe tener al menos una variante.',
  DUPLICATE_VARIANT_COMBINATION: 'No se permiten dos variantes con la misma combinación de atributos en un producto.',
  LAST_VARIANT_CANNOT_BE_DELETED: 'No puedes eliminar la única variante de un producto. Si quieres retirarlo, elimina el producto.',
  PRODUCT_NOT_SIMPLE: 'Este producto tiene variantes: edítalo como producto con variantes o variante por variante.',
  PRODUCT_HAS_STOCK: 'No se puede eliminar el producto porque tiene existencias o saldos negativos. Deja todas las cantidades en 0.',
  VARIANT_HAS_STOCK: 'No se puede eliminar la variante porque tiene existencias o saldos negativos. Deja todas las cantidades en 0.',
  INSUFFICIENT_STOCK: (d) => {
    const available = text(d.available);
    const requested = text(d.requested);
    return available && requested
      ? `No hay stock suficiente: hay ${available} y se piden ${requested}.`
      : 'No hay stock suficiente para esta operación.';
  },
  CATEGORY_NOT_FOUND: 'Categoría no encontrada.',
  CATEGORY_NAME_TAKEN: (d) => (text(d.name) ? `La categoría "${text(d.name)}" ya existe.` : 'Esa categoría ya existe.'),
  ATTRIBUTE_NOT_FOUND: 'Atributo no encontrado.',
  ATTRIBUTE_NAME_TAKEN: (d) => (text(d.name) ? `El atributo "${text(d.name)}" ya existe.` : 'Ese atributo ya existe.'),
  ATTRIBUTE_VALUE_TAKEN: (d) => (text(d.value) ? `El valor "${text(d.value)}" ya existe para este atributo.` : 'Ese valor ya existe para este atributo.'),
  ATTRIBUTE_VALUES_NOT_FOUND: 'Uno o más valores de atributo ya no existen.',
  IMAGES_NOT_FOUND: 'Una o más imágenes ya no existen.',
  MEDIA_NOT_FOUND: 'Imagen no encontrada.',
  MEDIA_IN_USE: 'No se puede eliminar la imagen porque está asignada a uno o más productos.',
  MEDIA_NOT_OWNED: 'El archivo no pertenece a esta tienda.',
  UNSUPPORTED_MEDIA_TYPE: 'Tipo de archivo no permitido. Solo se aceptan imágenes JPEG, PNG, WebP, GIF o AVIF.',

  // Importaciones masivas
  IMPORT_EMPTY: 'No hay registros para importar.',
  IMPORT_LIMIT_EXCEEDED: (d) => {
    const max = text(d.max);
    const received = text(d.received);
    return max && received ? `El archivo tiene ${received} filas y el máximo por importación es ${max}.` : 'El archivo supera el máximo de filas por importación.';
  },
  DUPLICATE_SKU_IN_IMPORT: (d) => {
    const skus = list(d.skus);
    return skus ? `El archivo repite estos SKU: ${skus}.` : 'El archivo repite SKU.';
  },
  INVALID_QUANTITY: (d) => (text(d.sku) ? `La cantidad del SKU ${text(d.sku)} debe ser mayor a 0.` : 'Las cantidades deben ser mayores a 0.'),
  SKUS_NOT_FOUND: (d) => {
    const skus = list(d.skus);
    return skus ? `Estos SKU no existen en el catálogo: ${skus}.` : 'Hay SKU que no existen en el catálogo.';
  },

  // Compras y proveedores
  EMPTY_PURCHASE: 'La compra debe tener al menos un producto.',
  PURCHASE_ORDER_NOT_FOUND: 'Orden de compra no encontrada.',
  PURCHASE_ORDER_ALREADY_CANCELLED: 'La orden de compra ya está anulada.',
  PURCHASE_ORDER_NOT_CANCELLABLE: 'Solo se pueden anular órdenes de compra completadas.',
  PURCHASE_BATCH_ALREADY_SOLD: (d) => {
    const n = text(d.consumed);
    return n ? `No se puede anular: ya se vendieron ${n} unidad(es) de esta compra.` : 'No se puede anular: ya se vendieron unidades de esta compra.';
  },
  STOCK_RECORD_NOT_FOUND: 'No hay registro de existencias de esa variante en la sucursal de la compra.',
  SUPPLIER_NOT_FOUND: 'Proveedor no encontrado.',
  DEFAULT_SUPPLIER_NOT_FOUND: 'No hay un proveedor por defecto configurado para esta tienda.',
  SUPPLIER_IDENTITY_TAKEN: 'Ya existe un proveedor con ese documento.',
  SUPPLIER_HAS_PURCHASES: 'No se puede eliminar el proveedor porque tiene órdenes de compra asociadas.',
};

/**
 * Mensaje para mostrar al usuario ante un error.
 * - `ApiError` con código en el catálogo → texto del catálogo (con los `details` si el texto los usa).
 * - `ApiError` con código propio que el catálogo no conoce → su `message` (ya viene en español).
 * - Cualquier otra cosa (incluidos errores sin contrato) → `fallback`.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback;
  const entry = ERROR_MESSAGES[error.code];
  if (entry) return typeof entry === 'function' ? entry(asDetails(error.details), error.details) : entry;
  if (error.code === CLIENT_ERROR_CODES.UNKNOWN_ERROR) return fallback;
  return error.message || fallback;
}
